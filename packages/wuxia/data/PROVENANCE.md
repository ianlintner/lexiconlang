# Provenance — @lexiconlang/wuxia

| Resource | Source | License | Notes |
| --- | --- | --- | --- |
| `data/wuxia.pack.json` (all names, grammars, tables, glosses) | Original synthetic data authored for LexiconLang contributors | CC0-1.0 | No third-party corpus, living person, trademark or setting-specific IP. |
| `data/PROVENANCE.md` | Original documentation | CC0-1.0 | Inventory for this package. |

Two declarative cultures ship in the manifest: a pinyin-style romanized naming
style with English glosses and a fully translated English style. Both are
invented string sets, not reconstructions of Mandarin or any other real
language, and not transcriptions of any real person's name. English glosses
describe the invented literal elements and are not claims of linguistic
authenticity. The pack's martial techniques, realms, treasures and oracle text
are original fictional content, not drawn from any published wuxia or xianxia
setting.

The manifest declares only the `language-v1`, `grammar-v1` and `tables-v1`
capabilities it actually uses and has no external pack dependency. All naming
data is original literal text; the B2 Mandarin base is not imported at runtime
and the two data sets are independent, so this pack loads and generates
standalone without a resolver.

