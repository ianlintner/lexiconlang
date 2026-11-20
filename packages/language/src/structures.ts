import type { Context } from "@lexiconlang/core";
import type {
  Culture,
  Gender,
  NameSlot,
  NameStructure,
  StructuredName,
  StructuredNameComponent,
  StructuredNameInput,
  TranslatedName,
} from "./types.js";
import { generateName, ownValue, resolveNameTemplates } from "./templates.js";

/**
 * Generate a structured name — "given + family", family-first, patronymic /
 * matronymic, clan / house, honorific and epithet components, in an order the
 * culture declares.
 *
 * Structured names are entirely opt-in: a culture without `nameStructures`
 * behaves exactly as before, and nothing here is reachable from the existing
 * `given` / `surname` generators.
 *
 * Determinism contract:
 * - generation slots are the walked in display order and each sub-roll is
 *   derived through `ctx.child("slot:<key>")`, so a name is independent of the
 *   order its siblings happened to be generated in;
 * - input slots consume no RNG at all, so adding or removing one never shifts
 *   any other component;
 * - an absent **optional** input slot disappears together with its affixes
 *   instead of rendering an empty component;
 * - the structure is validated before anything is rendered, so a malformed
 *   structure throws without consuming RNG.
 */
export function generateStructuredName<C extends Culture>(
  culture: C,
  input: StructuredNameInput,
  ctx: Context,
): StructuredName {
  const structure = ownValue(culture.nameStructures, input.structure);
  if (structure === undefined) {
    throw new Error(
      `No name structure ${JSON.stringify(input.structure)} in culture ${culture.id}`,
    );
  }

  const slots = displayOrder(structure);

  const components: StructuredNameComponent[] = [];
  const forms: string[] = [];
  const translations: string[] = [];

  for (const slot of slots) {
    let value: TranslatedName;

    if (slot.source.type === "kind") {
      // Slot kinds come from pack data, so they cannot be checked against `C`'s
      // literal template keys at compile time — an unknown kind throws at runtime.
      const kind = slot.source.kind as Extract<keyof C["templates"], string>;
      if (slot.optional === true && isEmptyPool(culture, slot.source.kind, input.gender)) {
        continue;
      }
      value = generateName(culture, kind, ctx.child(`slot:${slot.key}`), {
        ...(input.gender !== undefined ? { gender: input.gender } : {}),
        ...(input.locale !== undefined ? { locale: input.locale } : {}),
      });
    } else {
      const provided = ownValue(
        input.values as { readonly [key: string]: TranslatedName | undefined } | undefined,
        slot.source.field,
      );
      if (provided === undefined) {
        if (slot.optional === true) continue;
        throw new Error(
          `Missing required input ${JSON.stringify(slot.source.field)} for slot ${JSON.stringify(slot.key)} in structure ${JSON.stringify(input.structure)}`,
        );
      }
      value = validatedInput(provided, slot, input.structure);
    }

    const prefix = slot.prefix ?? "";
    const suffix = slot.suffix ?? "";
    const component: TranslatedName = {
      form: `${prefix}${value.form}${suffix}`,
      translation: `${prefix}${value.translation}${suffix}`,
      language: culture.id,
      parts: value.parts,
      toString() {
        return this.form;
      },
    };

    components.push({ key: slot.key, role: slot.role, value: component });
    forms.push(component.form);
    translations.push(component.translation);
  }

  const separator = structure.separator ?? " ";
  const translationSeparator = structure.translationSeparator ?? separator;

  const full: StructuredName = {
    form: forms.join(separator),
    translation: translations.join(translationSeparator),
    language: culture.id,
    parts: components.map((c) => ({
      form: c.value.form,
      meaning: c.value.translation,
    })),
    structure: structure.id,
    components,
    toString() {
      return this.form;
    },
  };

  return full;
}

/**
 * Resolve the display order of a structure's slots, validating the whole
 * structure first (duplicate keys, unknown order entries, malformed sources).
 */
function displayOrder(structure: NameStructure): readonly NameSlot[] {
  if (structure.slots.length === 0) {
    throw new Error(`Name structure ${JSON.stringify(structure.id)} declares no slots`);
  }

  const byKey = new Map<string, NameSlot>();
  for (const slot of structure.slots) {
    if (typeof slot.key !== "string" || slot.key.length === 0) {
      throw new Error(
        `Name structure ${JSON.stringify(structure.id)} has a slot with an empty key`,
      );
    }
    if (byKey.has(slot.key)) {
      throw new Error(
        `Duplicate name slot key ${JSON.stringify(slot.key)} in structure ${JSON.stringify(structure.id)}`,
      );
    }
    if (slot.prefix !== undefined && typeof slot.prefix !== "string") {
      throw new Error(
        `Slot ${JSON.stringify(slot.key)} in structure ${JSON.stringify(structure.id)} has a non-string prefix`,
      );
    }
    if (slot.suffix !== undefined && typeof slot.suffix !== "string") {
      throw new Error(
        `Slot ${JSON.stringify(slot.key)} in structure ${JSON.stringify(structure.id)} has a non-string suffix`,
      );
    }
    const sourceType = (slot.source as { type?: unknown } | null | undefined)?.type;
    if (sourceType !== "kind" && sourceType !== "input") {
      throw new Error(
        `Slot ${JSON.stringify(slot.key)} in structure ${JSON.stringify(structure.id)} has unknown source type ${JSON.stringify(sourceType)}`,
      );
    }
    if (
      slot.source.type === "kind" &&
      (typeof slot.source.kind !== "string" || slot.source.kind.length === 0)
    ) {
      throw new Error(
        `Slot ${JSON.stringify(slot.key)} in structure ${JSON.stringify(structure.id)} references a missing or non-string kind`,
      );
    }
    if (
      slot.source.type === "input" &&
      (typeof slot.source.field !== "string" || slot.source.field.length === 0)
    ) {
      throw new Error(
        `Slot ${JSON.stringify(slot.key)} in structure ${JSON.stringify(structure.id)} references a missing or non-string input field`,
      );
    }
    byKey.set(slot.key, slot);
  }

  if (structure.order === undefined) return structure.slots;

  if (structure.order.length !== structure.slots.length) {
    throw new Error(
      `Name structure ${JSON.stringify(structure.id)} has ${structure.slots.length} slots but an order of length ${structure.order.length}`,
    );
  }

  const ordered: NameSlot[] = [];
  const seen = new Set<string>();
  for (const key of structure.order) {
    if (seen.has(key)) {
      throw new Error(
        `Name structure ${JSON.stringify(structure.id)} lists slot ${JSON.stringify(key)} twice in its order`,
      );
    }
    const slot = byKey.get(key);
    if (slot === undefined) {
      throw new Error(
        `Name structure ${JSON.stringify(structure.id)} orders unknown slot ${JSON.stringify(key)}`,
      );
    }
    seen.add(key);
    ordered.push(slot);
  }

  return ordered;
}

/** True when a culture declares no (or an empty) template pool for a kind. */
function isEmptyPool(culture: Culture, kind: string, gender?: Gender): boolean {
  const pool = resolveNameTemplates(culture, kind, gender);
  return pool === undefined || pool.length === 0;
}

function validatedInput(
  value: TranslatedName,
  slot: NameSlot,
  structureId: string,
): TranslatedName {
  if (
    value === null ||
    typeof value !== "object" ||
    typeof value.form !== "string" ||
    typeof value.translation !== "string"
  ) {
    throw new Error(
      `Input ${JSON.stringify((slot.source as { field: string }).field)} for slot ${JSON.stringify(slot.key)} in structure ${JSON.stringify(structureId)} must be a TranslatedName`,
    );
  }
  return value;
}
