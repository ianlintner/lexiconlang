# @lexiconlang/pirates

Pirates & age of sail genre pack: ships, captains, crews, ports, treasure,
shanties, naval ranks and sea encounters. Declarative pack v1 data with a
typed facade and `withSeed(seed)` API.

```ts
import { pirates } from "@lexiconlang/pirates";
const voyage = pirates.withSeed("the-grey-gull");
voyage.ship();       // "The Gilded Wake"
voyage.captain();    // a captain name with translation and epithet
voyage.encounter();  // a sea encounter oracle roll
```
