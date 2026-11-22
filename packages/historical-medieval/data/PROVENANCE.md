# Provenance — historical-medieval genre pack

All data in `historical-medieval.pack.json` is original synthetic material authored for lexiconlang and released under **CC0-1.0**.

- **Origin:** `original:lexiconlang` — no third-party corpus, no copyrighted setting, no real living people, no trademarked names.
- **Inspiration:** broadly public-domain historical linguistic families (Latin, Old English, Celtic, Norse). The four cultures are synthetic naming styles, *not* reconstructions of any specific historical record. Place names, guild names, manors, titles, market goods, events and heraldic vocabulary are invented or generic historical terms.
- **Scope:** curated lists and tables only; no corpus text was copied from any source.
- **Modifications:** none.

## Heraldry note

Heraldry support implements a deliberately narrow, documented subset: one field tincture and one charge with an attitude. The rule enforced is the conventional "metal on colour / colour on metal" contrast heuristic (documented in the package README). It is a generator convenience, **not** a claim of historical or heraldic universal accuracy; users must verify arms against their own domain rules.

## Dependencies

The historical-medieval pack declares **no dependency on any B1 base pack** because none were available in the repository at implementation time. It ships its own original cultures and grammar rules. This is a documented deviation from the expansion plan's "selected B1 bases" wording; see the PR description.
