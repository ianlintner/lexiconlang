// Built-in modifiers, Tracery-compatible plus a few extras.
// A modifier is a pure (string, ...args) → string function.

export type Modifier = (input: string, ...args: string[]) => string;

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

const cap: Modifier = (s) => (s.length ? (s[0] as string).toUpperCase() + s.slice(1) : s);
const upper: Modifier = (s) => s.toUpperCase();
const lower: Modifier = (s) => s.toLowerCase();
const title: Modifier = (s) =>
  s.replace(/\b([a-z])/g, (_, c: string) => c.toUpperCase());

const a: Modifier = (s) => {
  if (!s) return s;
  const first = (s[0] ?? "").toLowerCase();
  return (VOWELS.has(first) ? "an " : "a ") + s;
};

const s: Modifier = (input) => {
  if (!input) return input;
  if (/(s|sh|ch|x|z)$/i.test(input)) return input + "es";
  if (/[^aeiou]y$/i.test(input)) return input.slice(0, -1) + "ies";
  return input + "s";
};

const ed: Modifier = (input) => {
  if (!input) return input;
  if (/e$/i.test(input)) return input + "d";
  if (/[^aeiou]y$/i.test(input)) return input.slice(0, -1) + "ied";
  return input + "ed";
};

const possessive: Modifier = (input) =>
  /s$/i.test(input) ? input + "'" : input + "'s";

const trim: Modifier = (s) => s.trim();
const reverse: Modifier = (s) => s.split("").reverse().join("");
const replace: Modifier = (s, from = "", to = "") => s.split(from).join(to);

export const builtinModifiers: Record<string, Modifier> = {
  cap,
  capitalize: cap,
  upper,
  uppercase: upper,
  lower,
  lowercase: lower,
  title,
  a,
  an: a,
  s,
  ed,
  possessive,
  trim,
  reverse,
  replace,
};
