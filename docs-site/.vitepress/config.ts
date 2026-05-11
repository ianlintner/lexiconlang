import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Lexiconlang",
  description:
    "Procedural constructed-language generation: deterministic, seeded conlangs with phonotactics, lexicons, and culture-specific naming.",
  base: "/lexiconlang/",
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ["link", { rel: "icon", href: "/lexiconlang/favicon.svg", type: "image/svg+xml" }],
    ["meta", { name: "theme-color", content: "#8b5cf6" }],
  ],

  appearance: true,

  themeConfig: {
    logo: { light: "/logo.svg", dark: "/logo-dark.svg" },
    siteTitle: "Lexiconlang",

    nav: [
      { text: "Guide", link: "/guide/getting-started", activeMatch: "/guide/" },
      { text: "Packages", link: "/packages/", activeMatch: "/packages/" },
      {
        text: "v0.3",
        items: [
          { text: "Changelog", link: "https://github.com/ianlintner/lexiconlang/releases" },
          { text: "npm", link: "https://www.npmjs.com/package/lexiconlang" },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "Getting started", link: "/guide/getting-started" },
            { text: "Why Lexiconlang?", link: "/guide/why" },
          ],
        },
        {
          text: "Concepts",
          items: [
            { text: "The seeding model", link: "/guide/seeding" },
            { text: "Cultures & morphemes", link: "/guide/cultures" },
            { text: "Visual glyph systems", link: "/guide/glyphs" },
          ],
        },
        {
          text: "Recipes",
          items: [
            { text: "Composing generators", link: "/guide/composing" },
            { text: "Custom grammars", link: "/guide/grammars" },
            { text: "Training Markov models", link: "/guide/markov" },
          ],
        },
      ],
      "/packages/": [
        {
          text: "Core primitives",
          items: [
            { text: "Overview", link: "/packages/" },
            { text: "@lexiconlang/core", link: "/packages/core" },
            { text: "@lexiconlang/grammar", link: "/packages/grammar" },
            { text: "@lexiconlang/markov", link: "/packages/markov" },
          ],
        },
        {
          text: "Language system",
          items: [
            { text: "@lexiconlang/language", link: "/packages/language" },
            { text: "@lexiconlang/glyphs", link: "/packages/glyphs" },
          ],
        },
        {
          text: "Genre packs",
          items: [
            { text: "@lexiconlang/fantasy", link: "/packages/fantasy" },
            { text: "@lexiconlang/scifi", link: "/packages/scifi" },
            { text: "@lexiconlang/modern", link: "/packages/modern" },
          ],
        },
        {
          text: "Tooling",
          items: [{ text: "@lexiconlang/cli", link: "/packages/cli" }],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/ianlintner/lexiconlang" },
      { icon: "npm", link: "https://www.npmjs.com/package/lexiconlang" },
    ],

    editLink: {
      pattern:
        "https://github.com/ianlintner/lexiconlang/edit/main/docs-site/:path",
      text: "Edit this page on GitHub",
    },

    search: {
      provider: "local",
    },

    footer: {
      message: "Released under the MIT License.",
      copyright: "© 2025–present Ian Lintner",
    },
  },
});
