# Why Lexiconlang?

Most naming libraries treat names as opaque strings drawn from a weighted list.
That works for *Faker*-style placeholder data, but it falls apart the moment
your world has internal logic — the moment players ask **what does this name
mean?** or save files need to survive a library upgrade.

Lexiconlang generates names as *meaningful utterances*. Every name decomposes
into morphemes with semantic weight: `Drakaztum` (Strong-anvil), `Aelthelan`
(Silver-stream), `Krazzivek` (Swarm-signal). The same conlang has consistent
words for "iron" and "mountain" across every name that uses them.

## Compared to other libraries

|                                 | faker  | Tracery | rot.js | **Lexiconlang** |
| ------------------------------- | :----: | :-----: | :----: | :-------------: |
| Weighted lists                  |   ✓    | partial | partial |        ✓        |
| Context-free grammars           |   ✗    |    ✓    |   ✗    |     ✓ (compat)  |
| Markov chains                   |   ✗    |    ✗    |   ✗    |        ✓        |
| Hierarchical seeds              |   ✗    |    ✗    | partial |        ✓        |
| Sibling-order independence      |   ✗    |    ✗    |   ✗    |        ✓        |
| Strategies inter-operate        |  n/a   |    ✗    |   ✗    |        ✓        |
| Typed                           | partial|    ✗    | partial |        ✓        |
| Tree-shakeable genre packs      |   ✗    |   n/a   |   ✗    |        ✓        |
| Morpheme-rich translations      |   ✗    |    ✗    |   ✗    |        ✓        |
| Visual glyph systems            |   ✗    |    ✗    |   ✗    |        ✓        |

## What it's good for

- **Tabletop and digital RPGs.** Procedurally-generated NPCs, settlements, factions, quests, with stable seeds for save files.
- **Worldbuilding.** Lazily-generated worlds where region/settlement/NPC trees reconstruct from a single seed string.
- **Fiction generation.** Names that sound like they come from a real culture, with meanings authors can lean on.
- **Linguistic experiments.** Per-culture phonotactics and morpheme packs make it easy to prototype a conlang aesthetic.

## What it's *not* trying to be

- A linguistically-rigorous conlang construction kit. Real conlangers should use [Vulgar](https://www.vulgarlang.com/) or [Awkwords](http://akana.conlang.org/tools/awkwords/).
- An NLP system. Lexiconlang generates surface forms; it doesn't parse or translate natural language.
- A Faker replacement. If you just need fake-looking placeholder data, Faker is lighter.
