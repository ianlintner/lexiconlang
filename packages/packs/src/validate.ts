import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";
import commonSchema from "../schema/common-v1.schema.json" with { type: "json" };
import cultureSchema from "../schema/culture-v1.schema.json" with { type: "json" };
import meaningSchema from "../schema/meaning-v1.schema.json" with { type: "json" };
import grammarSchema from "../schema/grammar-v1.schema.json" with { type: "json" };
import tableSchema from "../schema/table-v1.schema.json" with { type: "json" };
import corpusSchema from "../schema/corpus-v1.schema.json" with { type: "json" };
import generatorSchema from "../schema/generator-v1.schema.json" with { type: "json" };
import baseSchema from "../schema/base-v1.schema.json" with { type: "json" };
import dialectSchema from "../schema/dialect-v1.schema.json" with { type: "json" };
import packSchema from "../schema/pack-v1.schema.json" with { type: "json" };
import type { PackDiagnostic } from "./types.js";

export const MANIFEST_MAX_BYTES = 5 * 1024 * 1024;
export const ASSETS_MAX_BYTES = 25 * 1024 * 1024;
export const DEPENDENCY_MAX_DEPTH = 32;
export const RESOURCE_MAX_COUNT = 10_000;
export const TEXT_MAX_LENGTH = 64 * 1024;
export const WEIGHT_MAX_TOTAL = 0x1_0000_0000;

const ajv = new Ajv2020({ allErrors: true, strict: false, allowUnionTypes: true });
for (const schema of [commonSchema, cultureSchema, meaningSchema, grammarSchema, tableSchema, corpusSchema, generatorSchema, baseSchema, dialectSchema, packSchema]) {
  ajv.addSchema(schema);
}
const validateManifest = ajv.getSchema("https://lexiconlang.dev/schemas/pack-v1.schema.json");
if (!validateManifest) throw new Error("pack-v1 schema failed to compile");
const checkManifest = validateManifest;

/** Detect duplicate keys in raw JSON text; JSON.parse silently keeps the last. */
export function duplicateKeyDiagnostics(text: string): readonly PackDiagnostic[] {
  const out: PackDiagnostic[] = [];
  const stack: Array<{ kind: "object"; keys: Set<string> } | { kind: "array" }> = [];
  let i = 0;
  const skipSpace = () => { while (i < text.length && /\s/.test(text[i] as string)) i++; };
  while (i < text.length) {
    skipSpace();
    const ch = text[i];
    if (ch === "{" || ch === "[") {
      stack.push(ch === "{" ? { kind: "object", keys: new Set() } : { kind: "array" });
      i++;
      continue;
    }
    if (ch === "}" || ch === "]") {
      const expected = ch === "}" ? "object" : "array";
      if (stack.at(-1)?.kind === expected) stack.pop();
      i++;
      continue;
    }
    if (ch === '"') {
      const start = i;
      const key = readString(text, i);
      i = key.end;
      const frame = stack.at(-1);
      if (frame?.kind === "object") {
        const save = i;
        skipSpace();
        if (text[i] === ":") {
          if (frame.keys.has(key.value)) {
            out.push({ code: "SCHEMA", pointer: pointerFor(text, start), message: `duplicate object key ${JSON.stringify(key.value)}` });
          } else frame.keys.add(key.value);
        }
        i = save;
      }
      continue;
    }
    i++;
  }
  return dedupe(out);
}

function readString(text: string, start: number): { value: string; end: number } {
  let value = "";
  let i = start + 1;
  while (i < text.length) {
    const ch = text[i] as string;
    if (ch === '"') return { value, end: i + 1 };
    if (ch === "\\") {
      i++;
      const esc = text[i] as string;
      if (esc === "u") {
        value += String.fromCharCode(Number.parseInt(text.slice(i + 1, i + 5), 16));
        i += 5;
      } else {
        value += esc === "n" ? "\n" : esc === "t" ? "\t" : esc === "r" ? "\r" : esc;
        i++;
      }
      continue;
    }
    value += ch;
    i++;
  }
  return { value, end: i };
}

/** Best-effort JSON Pointer for a duplicate key, from its raw offset. */
function pointerFor(text: string, offset: number): string {
  const stack: Array<{ kind: "object" | "array"; key: string | null; index: number }> = [];
  let i = 0;
  while (i <= offset && i < text.length) {
    const ch = text[i];
    if (ch === "{" || ch === "[") {
      stack.push({ kind: ch === "{" ? "object" : "array", key: null, index: 0 });
    } else if (ch === "}" || ch === "]") {
      stack.pop();
    } else if (ch === "," && stack.at(-1)?.kind === "array") {
      (stack[stack.length - 1] as { index: number }).index++;
    } else if (ch === '"') {
      const s = readString(text, i);
      const frame = stack.at(-1);
      if (frame?.kind === "object") {
        let j = s.end;
        while (j < text.length && /\s/.test(text[j] as string)) j++;
        if (text[j] === ":") frame.key = s.value;
      }
      i = s.end - 1;
    }
    i++;
  }
  const parts = stack.map((f) => f.kind === "object" ? (f.key ?? "") : String(f.index)).filter((p) => p !== "");
  return parts.length === 0 ? "" : `/${parts.map(escapePointer).join("/")}`;
}

function escapePointer(s: string): string {
  return s.replace(/~/g, "~0").replace(/\//g, "~1");
}

export function schemaDiagnostics(input: unknown): readonly PackDiagnostic[] {
  if (checkManifest(input)) return [];
  const diagnostics = (checkManifest.errors ?? []).map(ajvError);
  return dedupe(diagnostics);
}

function ajvError(error: ErrorObject): PackDiagnostic {
  const params = error.params as Record<string, unknown>;
  let pointer = error.instancePath;
  if (error.keyword === "required" && typeof params.missingProperty === "string") {
    pointer = `${pointer}/${escapePointer(params.missingProperty)}`;
  }
  const extra = typeof params.allowedValues === "object"
    ? ` (allowed: ${(params.allowedValues as unknown[]).join(", ")})`
    : "";
  return {
    code: "SCHEMA",
    pointer: pointer || "",
    message: `${pointer || "manifest"} ${error.message ?? "is invalid"}${extra}`,
  };
}

export function dedupe(diagnostics: readonly PackDiagnostic[]): readonly PackDiagnostic[] {
  const seen = new Set<string>();
  return diagnostics
    .filter((d) => {
      const key = `${d.code}|${d.pointer}|${d.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.pointer.localeCompare(b.pointer) || a.code.localeCompare(b.code) || a.message.localeCompare(b.message));
}
