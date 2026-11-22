/**
 * @lexiconlang/bases — real-language-inspired base descriptors and cultures.
 *
 * This entry point is deliberately light: it exports only types, helpers and
 * the registry of slugs. Import a specific base through its subpath
 * (`@lexiconlang/bases/norse`, `.../japanese`, ...) so bundlers can drop the
 * five you do not use.
 */
export type { BaseData, BaseSlug, OrthographyData, SensitivityData } from "./registry.js";
export { BASE_SLUGS, basePack, cultureFor, renderOrthography } from "./registry.js";
export { defineBase, literal, pick } from "./define.js";
