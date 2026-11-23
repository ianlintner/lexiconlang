"""Generate packages/wuxia/data/wuxia.pack.json (original CC0 data)."""
import json
from pathlib import Path

P = "lexiconlang.wuxia"


def lit(form, translation, weight=1):
    return {"value": {"kind": "literal", "form": form, "translation": translation}, "weight": weight}


def choices(pairs):
    return [lit(f, t) for f, t in pairs]


def rules(*triples):
    """(key, [(template, weight), ...]) -> grammar rule objects"""
    out = []
    for key, pairs in triples:
        out.append({"key": key, "choices": [{"value": v, "weight": w} for v, w in pairs]})
    return out


# ─── Culture A: pinyin forms with English glosses ────────────────────────
# Original invented names. Pinyin-style spelling is an invented aesthetic,
# not a transcription of any real person's name or a published work.
pinyin_given = [
    ("Língxiá", "spirit dawn"), ("Yùndé", "cloud virtue"), ("Qīngyǔ", "clear rain"),
    ("Chénxī", "morning brook"), ("Jǐnglán", "well orchid"), ("Fēnghé", "wind crane"),
    ("Mòyán", "ink swallow"), ("Báishuāng", "white frost"), ("Zhāoyáng", "morning sun"),
    ("Wǎnqíng", "evening clear"), ("Sīyuǎn", "thoughtful distance"), ("Ruòshuǐ", "like water"),
    ("Juéyǐng", "broken shadow"), ("Liúguāng", "flowing light"), ("Yínzhú", "silver candle"),
    ("Dānxīn", "red heart"), ("Xuánwǔ", "dark warrior"), ("Zhìyǔ", "wise rain"),
    ("Tíngyuè", "stopping moon"), ("Hánzhāng", "cold chapter"), ("Yìfēi", "soaring flight"),
    ("Chúnjiàn", "pure sword"), ("Qiūlán", "autumn orchid"), ("Míngchè", "bright clarity"),
    ("Yānsōng", "mist pine"), ("Tiānjī", "heavenly mechanism"),
]
pinyin_clan = [
    ("Zhǎnliú", "surging current"), ("Wénlán", "literary orchid"), ("Shùnbēi", "obedient cup"),
    ("Mùyún", "wood cloud"), ("Língzhōu", "spirit boat"), ("Jīnguī", "gold tortoise"),
    ("Báiyún", "white cloud"), ("Qīngléi", "green thunder"), ("Chìyàn", "red swallow"),
    ("Hánshān", "cold mountain"), ("Fēixīng", "flying star"), ("Tiězhèn", "iron town"),
    ("Liǔyīn", "willow shade"), ("Sōngquán", "pine spring"), ("Hèlù", "crane dew"),
    ("Méiyǐng", "plum shadow"), ("Shuǐjìng", "water mirror"), ("Yùpǔ", "jade garden"),
    ("Jīnpíng", "gold vase"), ("Yínlín", "silver scale"), ("Zhúyǐng", "bamboo shadow"),
    ("Wùyǔn", "matter rhyme"), ("Qiānlǐ", "thousand mile"), ("Gūjiàn", "lonely sword"),
    ("Yìjūn", "one ruler"), ("Sìhǎi", "four seas"),
]
pinyin_settlement = [
    ("Qīngyún Zhèn", "clear cloud town"), ("Liúshuǐ Cūn", "flowing water village"),
    ("Wòlóng Shān", "sleeping dragon mountain"), ("Jīnpíng Chéng", "gold vase city"),
    ("Báilù Wān", "white dew bay"), ("Yùquán Dòng", "jade spring cave"),
    ("Chángfēng Dào", "long wind pass"), ("Hányuè Gǔ", "cold moon valley"),
    ("Mùyǔ Tíng", "evening rain pavilion"), ("Shénsōng Lín", "spirit pine forest"),
    ("Yānbo Dǎo", "mist wave island"), ("Wàngshū Tái", "missing-letter terrace"),
    ("Fēixiá Xiá", "flying gorge"), ("Tiěqiáo Zhèn", "iron bridge town"),
    ("Zǐyún Jiàn", "purple cloud stream"), ("Qīnglián Sì", "green lotus temple"),
    ("Gūdēng Chéng", "lonely lamp city"), ("Ruòshuǐ Biān", "weak water shore"),
    ("Cāngláng Pǔ", "blue wave garden"), ("Yǐngluò Gǔ", "shadow falling valley"),
    ("Báishí Qiáo", "white stone bridge"), ("Língquán Cūn", "spirit spring village"),
    ("Wúyǔng Gǎng", "no-wind harbor"), ("Chìxiá Guān", "red cloud pass"),
    ("Jīgǔ Tái", "drum terrace"), ("Yuèyǐng Hú", "moon shadow lake"),
    ("Shíqiáo Cūn", "stone bridge village"), ("Fēihuā Gǔ", "falling flower valley"),
    ("Qīngjìng Sì", "clear mirror temple"), ("Báiyǔ Lóu", "white rain tower"),
    ("Sōngyǐng Zhèn", "pine shadow town"), ("Lányǔ Biān", "blue rain shore"),
    ("Hánjīn Dòng", "cold gold cave"), ("Zǐtíng Gǎng", "violet pavilion harbor"),
    ("Mùyáng Pō", "shepherd slope"), ("Yínshā Dǎo", "silver sand isle"),
    ("Qīngniú Zhèn", "green ox town"), ("Yèyǔ Cheng", "night rain city"),
    ("Wàngquán Gǔ", "forgotten spring valley"), ("Jīnpí Lǐng", "golden threshold ridge"),
    ("Gūxīng Dǎo", "lonely star isle"), ("Liúyíng Pǔ", "flowing glow garden"),
]

# ─── Culture B: English-translated style ─────────────────────────────────
english_given = [
    ("Dawnpetal", "dawn petal"), ("Cloudshear", "cloud shearer"), ("Brightreed", "bright reed"),
    ("Stillwater", "still water"), ("Frostlane", "frost path"), ("Emberquill", "ember quill"),
    ("Moonwoven", "moon woven"), ("Silvercrane", "silver crane"), ("Mistwalker", "mist walker"),
    ("Jadelight", "jade light"), ("Riverwhisper", "river whisper"), ("Pinechoir", "pine choir"),
    ("Wavebrother", "wave brother"), ("Autumnblade", "autumn blade"), ("Starfold", "star fold"),
    ("Nightcandle", "night candle"), ("Thunderink", "thunder ink"), ("Lotusheart", "lotus heart"),
    ("Windletter", "wind letter"), ("Snowplum", "snow plum"), ("Goldfinch", "gold finch"),
    ("Ironwillow", "iron willow"), ("Crimsonstep", "crimson step"), ("Greycloud", "grey cloud"),
    ("Larkspur", "lark's spur"), ("Duskbloom", "dusk bloom"),
]
english_clan = [
    ("Nine Pines", "nine pines"), ("Bright River", "bright river"), ("High Orchard", "high orchard"),
    ("Stone Lotus", "stone lotus"), ("Far Lantern", "far lantern"), ("Quiet Forge", "quiet forge"),
    ("Red Reed", "red reed"), ("White Crane", "white crane"), ("Deepwell", "deep well"),
    ("Cloudgate", "cloud gate"), ("Thornscript", "thorn script"), ("Northbridge", "north bridge"),
    ("Silverbank", "silver bank"), ("Hollowbamboo", "hollow bamboo"), ("Iron Orchard", "iron orchard"),
    ("Longshadow", "long shadow"), ("Frostpine", "frost pine"), ("Duskharbor", "dusk harbor"),
    ("Skyward", "skyward"), ("Mossgate", "moss gate"), ("Copperleaf", "copper leaf"),
    ("Stillpeak", "still peak"), ("Windwright", "wind wright"), ("Goldencreed", "golden reed"),
    ("Moonfold", "moon fold"), ("Ashenvale", "ashen vale"),
]
english_settlement = [
    ("Mistgate", "mist gate"), ("Lantern Ford", "lantern ford"), ("Pinefall", "pine fall"),
    ("Silver terrace", "silver terrace"), ("Cloudrest", "cloud rest"), ("Jade Hollow", "jade hollow"),
    ("Windward Quay", "windward quay"), ("Stillwater Cross", "stillwater cross"),
    ("Craneview", "crane view"), ("Bamboo Bend", "bamboo bend"), ("Emberwatch", "ember watch"),
    ("Frostbloom", "frost bloom"), ("Golden Reed Village", "golden reed village"),
    ("Longbridge", "long bridge"), ("Ashen Pass", "ashen pass"), ("Lotus Bay", "lotus bay"),
    ("Greystone港", "greystone harbor"), ("Dawnwell", "dawn well"), ("Riverbend", "river bend"),
    ("Highreed", "high reed"), ("Moonmere", "moon mere"), ("Thornhollow", "thorn hollow"),
    ("Quietstep", "quiet step"), ("Starfall Market", "starfall market"),
    ("Willowmere", "willow mere"), ("Ironvale", "iron vale"),
    ("Stonebridge Village", "stonebridge village"), ("Falling Flower Vale", "falling flower vale"),
    ("Mirror Temple", "mirror temple"), ("White Rain Tower", "white rain tower"),
    ("Pineshade Town", "pineshade town"), ("Blue Rain Shore", "blue rain shore"),
    ("Coldgold Grotto", "coldgold grotto"), ("Violet Pavilion Port", "violet pavilion port"),
    ("Shepherd Slope", "shepherd slope"), ("Silversand Isle", "silversand isle"),
    ("Green Ox Town", "green ox town"), ("Nightrain City", "nightrain city"),
    ("Forgotten Spring Vale", "forgotten spring vale"), ("Gold Threshold Ridge", "gold threshold ridge"),
    ("Lonestar Isle", "lonestar isle"), ("Flowing Glow Garden", "flowing glow garden"),
]

# avoid stray non-Latin char in an English style; keep pinyin flavor only in culture A
english_settlement[16] = ("Greystone Harbor", "greystone harbor")

cultures = [
    {
        "id": f"{P}/culture/pinyin",
        "capitalize": "first",
        "templates": {
            "given": choices(pinyin_given),
            "surname": choices(pinyin_clan),
            "settlement": choices(pinyin_settlement),
            "mountain": choices([
                ("Wòlóng Shān", "sleeping dragon mountain"),
                ("Hányuè Fēng", "cold moon peak"),
                ("Cāngsōng Lǐng", "blue pine ridge"),
                ("Báixuě Shān", "white snow mountain"),
                ("Qīngléi Fēng", "green thunder peak"),
                ("Yùncuì Lǐng", "cloud jade ridge"),
                ("Gūyàn Fēng", "lonely wild goose peak"),
                ("Tiēgǔ Shān", "iron bone mountain"),
                ("Zǐyān Lǐng", "purple mist ridge"),
                ("Míngyuè Fēng", "bright moon peak"),
                ("Shénsōng Shān", "spirit pine mountain"),
                ("Yínpíng Lǐng", "silver vase ridge"),
                ("Chìxiá Fēng", "red cloud peak"),
                ("Húndi Shān", "soul lake mountain"),
                ("Jīnpíng Lǐng", "gold vase ridge"),
                ("Fēilóng Fēng", "flying dragon peak"),
                ("Ruòshuǐ Shān", "weak water mountain"),
                ("Wúyǐng Lǐng", "shadowless ridge"),
                ("Qiūshuāng Fēng", "autumn frost peak"),
                ("Yěhuǒ Shān", "wildfire mountain"),
                ("Língquán Fēng", "spirit spring peak"),
                ("Bìluó Shān", "green vine mountain"),
                ("Dānxiá Lǐng", "cinnabar cloud ridge"),
                ("Chénxī Fēng", "dawn brook peak"),
                ("Báilù Fēng", "white dew peak"), ("Qīngjìng Lǐng", "clear mirror ridge"),
                ("Yèyǔ Shān", "night rain mountain"), ("Gǔsōng Fēng", "ancient pine peak"),
                ("Yùnduàn Lǐng", "cloud broken ridge"), ("Hánxīng Shān", "cold star mountain"),
                ("Zǐwēi Fēng", "purple violet peak"), ("Shíjìng Lǐng", "stone mirror ridge"),
                ("Lúhuā Shān", "reed flower mountain"), ("Yínyuè Fēng", "silver moon peak"),
                ("Fēixuě Lǐng", "flying snow ridge"), ("Wúmíng Shān", "nameless mountain"),
                ("Jīnpí Fēng", "gold threshold peak"), ("Dānxīn Lǐng", "red heart ridge"),
                ("Mùyǔ Shān", "evening rain mountain"), ("Báigǔ Fēng", "white bone peak"),
                ("Shénmì Lǐng", "mysterious ridge"), ("Lǎngyàn Shān", "clear wild goose mountain"),
                ("Qīngyín Fēng", "clear silver peak"), ("Dānhé Lǐng", "red crane ridge"),
            ]),
        },
    },
    {
        "id": f"{P}/culture/translated",
        "capitalize": "first",
        "templates": {
            "given": choices(english_given),
            "surname": choices(english_clan),
            "settlement": choices(english_settlement),
            "mountain": choices([
                ("Sleeping Dragon Mountain", "sleeping dragon mountain"),
                ("Cold Moon Peak", "cold moon peak"),
                ("Blue Pine Ridge", "blue pine ridge"),
                ("White Snow Mountain", "white snow mountain"),
                ("Green Thunder Peak", "green thunder peak"),
                ("Cloudjade Ridge", "cloud jade ridge"),
                ("Lone Goose Peak", "lonely wild goose peak"),
                ("Ironbone Mountain", "iron bone mountain"),
                ("Purple Mist Ridge", "purple mist ridge"),
                ("Bright Moon Peak", "bright moon peak"),
                ("Spirit Pine Mountain", "spirit pine mountain"),
                ("Silver Vase Ridge", "silver vase ridge"),
                ("Red Cloud Peak", "red cloud peak"),
                ("Soul Lake Mountain", "soul lake mountain"),
                ("Gold Vase Ridge", "gold vase ridge"),
                ("Flying Dragon Peak", "flying dragon peak"),
                ("Weak Water Mountain", "weak water mountain"),
                ("Shadowless Ridge", "shadowless ridge"),
                ("Autumn Frost Peak", "autumn frost peak"),
                ("Wildfire Mountain", "wildfire mountain"),
                ("Spirit Spring Peak", "spirit spring peak"),
                ("Green Vine Mountain", "green vine mountain"),
                ("Cinnabar Cloud Ridge", "cinnabar cloud ridge"),
                ("Dawnbrook Peak", "dawn brook peak"),
                ("White Dew Peak", "white dew peak"), ("Clear Mirror Ridge", "clear mirror ridge"),
                ("Nightrain Mountain", "night rain mountain"), ("Ancient Pine Peak", "ancient pine peak"),
                ("Broken Cloud Ridge", "broken cloud ridge"), ("Cold Star Mountain", "cold star mountain"),
                ("Violet Peak", "violet peak"), ("Stone Mirror Ridge", "stone mirror ridge"),
                ("Reed Flower Mountain", "reed flower mountain"), ("Silver Moon Peak", "silver moon peak"),
                ("Flying Snow Ridge", "flying snow ridge"), ("Nameless Mountain", "nameless mountain"),
                ("Gold Threshold Peak", "gold threshold peak"), ("Red Heart Ridge", "red heart ridge"),
                ("Evening Rain Mountain", "evening rain mountain"), ("White Bone Peak", "white bone peak"),
                ("Mysterious Ridge", "mysterious ridge"), ("Clear Goose Mountain", "clear goose mountain"),
                ("Clear Silver Peak", "clear silver peak"), ("Red Crane Ridge", "red crane ridge"),
            ]),
        },
    },
]

# ─── Grammars ─────────────────────────────────────────────────────────────
def grammar(suffix, description, tags, start, rule_list, max_depth=10):
    return {
        "id": f"{P}/grammar/{suffix}",
        "description": description,
        "tags": tags,
        "start": start,
        "maxDepth": max_depth,
        "rules": rules(*rule_list),
    }


sect_prefix = [("Cloud", 1), ("Jade", 1), ("Iron", 1), ("White", 1), ("Red", 1), ("Silver", 1),
               ("Mist", 1), ("Thunder", 1), ("Bamboo", 1), ("Golden", 1), ("Shadow", 1),
               ("North", 1), ("Southern", 1), ("Ancient", 1), ("Hidden", 1), ("Empty", 1)]
sect_core = [("Sword", 1), ("Lotus", 1), ("Crane", 1), ("Palm", 1), ("Gate", 1), ("Pine", 1),
             ("River", 1), ("Scripture", 1), ("Fist", 1), ("Drum", 1), ("Banner", 1), ("Bell", 1),
             ("Needle", 1), ("Censer", 1), ("Mirror", 1), ("Lantern", 1)]
sect_suffix = [("Sect", 4), ("School", 3), ("Order", 2), ("Guild", 1), ("Academy", 2), ("House", 2)]

technique_canon = [("Nine Heavens Thunder", 1), ("Silent River", 1), ("White Crane", 1),
                   ("Jade Spear", 1), ("Iron Bamboo", 1), ("Mist Step", 1), ("Red Lotus", 1),
                   ("Cold Moon", 1), ("Golden Bell", 1), ("Shadow Thread", 1), ("Dragon Tide", 1),
                   ("Empty Mountain", 1), ("Pine Wind", 1), ("Silver Needle", 1), ("Cloud Ladder", 1),
                   ("Thousand Petal", 1)]
technique_form = [("Palm", 3), ("Sword", 3), ("Fist", 2), ("Step", 2), ("Art", 2), ("Staff", 1),
                  ("Dagger", 1), ("Technique", 2), ("Strike", 2), ("Stance", 2)]
technique_grade = [("", 3), (" Supreme", 1), (" Mortal", 1), (" Unfettered", 1), (" Ancient", 1)]

realm_stage = [("Qi Gathering", 1), ("Foundation", 1), ("Core", 1), ("Nascent Soul", 1),
               ("Spirit Severing", 1), ("Void Return", 1), ("Ascendant", 1), ("Unity", 1),
               ("Timeless", 1), ("Ember", 1), ("Starwind", 1), ("Iron Slumber", 1)]
realm_layer = [("Early", 2), ("Middle", 2), ("Late", 2), ("Peak", 1), ("", 1), ("Half-step", 1)]

treasure_material = [("Jade", 1), ("Bronze", 1), ("Silver", 1), ("Gold", 1), ("Crystal", 1),
                     ("Ironwood", 1), ("Porcelain", 1), ("Bone", 1), ("Glass", 1), ("Ink", 1),
                     ("Thunderstone", 1), ("Moonstone", 1), ("Cinnabar", 1), ("Pearl", 1)]
treasure_kind = [("Pendant", 1), ("Censer", 1), ("Gourd", 1), ("Mirror", 1), ("Robe", 1),
                 ("Ring", 1), ("Bell", 1), ("Scroll", 1), ("Sword", 1), ("Cup", 1), ("Seal", 1),
                 ("Lantern", 1), ("Needle", 1), ("Drum", 1), ("Comb", 1), ("Flute", 1)]
treasure_quality = [("", 3), (" of the Cloud Vault", 1), (" of Silent Water", 1),
                    (" of the Nine Terraces", 1), (" of Dawn", 1), (" of the Hidden Valley", 1)]

nickname_prefix = [("Thunder", 1), ("Jade", 1), ("Crimson", 1), ("Silver", 1), ("Iron", 1),
                   ("Mist", 1), ("Dusk", 1), ("Laughing", 1), ("Silent", 1), ("Pale", 1),
                   ("Drunken", 1), ("Wandering", 1), ("Frost", 1), ("Golden", 1), ("Hidden", 1)]
nickname_noun = [("Sword", 1), ("Crane", 1), ("Tiger", 1), ("Lotus", 1), ("Fox", 1), ("Dragon", 1),
                 ("Bamboo", 1), ("Palm", 1), ("Pine", 1), ("Wolf", 1), ("Lantern", 1), ("Raven", 1),
                 ("Serpent", 1), ("Mountain", 1), ("River", 1), ("Sparrow", 1)]
nickname_title = [("the Uncrowned", 1), ("of the Mist Gate", 1), ("Who Never Kneels", 1),
                  ("of the Thousand Faces", 1), ("the Night Walker", 1), ("of the Broken Blade", 1),
                  ("the Quiet Guest", 1), ("of the Far Lantern", 1), ("the Cloud Rider", 1)]

mountain_adj = [("Sleeping", 1), ("Cold", 1), ("Green", 1), ("White", 1), ("Red", 1),
                ("Ancient", 1), ("Hidden", 1), ("Silver", 1), ("Golden", 1), ("Misty", 1),
                ("Thunder", 1), ("Lonely", 1)]
mountain_noun = [("Dragon", 1), ("Moon", 1), ("Pine", 1), ("Snow", 1), ("Crane", 1),
                 ("Cloud", 1), ("Tiger", 1), ("Lotus", 1), ("Frost", 1), ("Bell", 1),
                 ("Spear", 1), ("Phoenix", 1)]
mountain_kind = [("Mountain", 3), ("Peak", 2), ("Ridge", 2), ("Crag", 1), ("Range", 1)]


def pairs(xs):
    """Accept either bare strings or pre-weighted (value, weight) tuples."""
    return [x if isinstance(x, tuple) else (x, 1) for x in xs]


grammars = [
    grammar("sect", "Wuxia martial sects and schools.", ["sect", "faction"], "start", [
        ("start", [("#prefix# #core# #suffix#", 6), ("The #prefix# #core# #suffix#", 2),
                   ("#prefix# #core# #suffix# of the #place#", 1)]),
        ("prefix", pairs(sect_prefix)),
        ("core", pairs(sect_core)),
        ("suffix", sect_suffix),
        ("place", pairs(["Silent Valley", "Nine Bends", "Pine Terrace", "Cloud Ford",
                         "Red Pass", "Jade Well", "Long River", "Broken Gate"])),
    ]),
    grammar("technique", "Martial arts techniques, including the Nine Heavens Thunder family.",
            ["technique", "martial-arts"], "start", [
        ("start", [("#canon# #form##grade#", 8), ("The #canon# #form#", 2),
                   ("#canon# #form# of the #season#", 1)]),
        ("canon", pairs([x for x, _ in technique_canon])),
        ("form", technique_form),
        ("grade", technique_grade),
        ("season", pairs(["East Wind", "Autumn Rain", "Winter Sun", "Spring Thunder", "Dusk"])),
    ]),
    grammar("realm", "Cultivation realms on an original ladder of invented stages.",
            ["realm", "cultivation"], "start", [
        ("start", [("#layer# #stage# Realm", 6), ("#stage# Realm", 3),
                   ("#layer# #stage#", 1)]),
        ("layer", realm_layer),
        ("stage", pairs([x for x, _ in realm_stage])),
    ]),
    grammar("treasure", "Treasures, pills and spirit artifacts (fictional items only).",
            ["treasure", "artifact"], "start", [
        ("start", [("#material# #kind##quality#", 7), ("The #material# #kind# of #owner#", 2),
                   ("#material# #kind#", 2)]),
        ("material", pairs([x for x, _ in treasure_material])),
        ("kind", pairs([x for x, _ in treasure_kind])),
        ("quality", [(v, w) for v, w in treasure_quality if v]),
        ("owner", pairs(["the Jade Hermit", "the Mist Court", "the Nine Terraces",
                         "the Silent Abbot", "the River Duke", "the Cloud Vault"])),
    ]),
    grammar("nickname", "Jianghu nicknames used by wanderers and martial artists.",
            ["nickname", "jianghu"], "start", [
        ("start", [("#prefix# #noun#", 6), ("#prefix# #noun#, #title#", 3),
                   ("The #prefix# #noun#", 2)]),
        ("prefix", pairs([x for x, _ in nickname_prefix])),
        ("noun", pairs([x for x, _ in nickname_noun])),
        ("title", pairs([x for x, _ in nickname_title])),
    ]),
    grammar("mountain", "Sacred mountains and famous peaks (fictional geography).",
            ["mountain", "place"], "start", [
        ("start", [("The #adj# #noun# #kind# of #place#", 1), ("#adj# #noun# #kind#", 6),
                   ("The #adj# #noun# #kind#", 2)]),
        ("adj", pairs([x for x, _ in mountain_adj])),
        ("noun", pairs([x for x, _ in mountain_noun])),
        ("kind", mountain_kind),
        ("place", pairs(["Silent Valley", "Nine Bends", "Pine Terrace", "Cloud Ford",
                         "Red Pass", "Jade Well", "Long River", "Broken Gate"])),
    ]),
    grammar("secret-realm", "Secret realms, hidden valleys and trial grounds.",
            ["secret-realm", "place", "hook"], "start", [
        ("start", [("#adj# #realm#", 6), ("The #adj# #realm# of #keeper#", 3),
                   ("#realm# of the #adj# #keeper#", 1)]),
        ("adj", pairs([x for x, _ in mountain_adj])),
        ("realm", pairs(["Gate", "Valley", "Grotto", "Garden", "Terrace", "Cavern",
                         "Sanctum", "Passage", "Basin", "Isle", "Court", "Threshold",
                         "Lake", "Furnace", "Library", "Ladder"])),
        ("keeper", pairs(["Cloud Hermit", "Jade Dragon", "Silent Monk", "Thunder Saint",
                          "Mist Maiden", "Iron Wanderer", "Pine Sage", "Crane Elder"])),
    ]),
    grammar("pill", "Alchemical pills and elixirs from an invented pharmacopoeia.",
            ["pill", "treasure"], "start", [
        ("start", [("#ingredient# #form#", 7), ("#ingredient# #form# of #effect#", 3)]),
        ("ingredient", pairs(["Cloud Lotus", "Silver Dew", "Jade Marrow", "Red Cinnabar",
                              "Moon Petal", "Pine Resin", "Thunder Root", "Crane Feather",
                              "Gold Ash", "Frost Berry", "Ink Cap", "Pearl Dust",
                              "River Stone", "Ember Seed", "Night Orchid", "Bamboo Heart"])),
        ("form", [("Pill", 5), ("Elixir", 3), ("Draught", 2), ("Decoction", 1)]),
        ("effect", pairs(["Clear Sight", "Steel Bones", "Quiet Breath", "Long Life",
                          "Iron Will", "Fleet Foot", "Warm Core", "Still Mind"])),
    ]),
]

# ─── Tables ──────────────────────────────────────────────────────────────
def text_result(text):
    return {"type": "text", "text": text}


tribulation_entries = [
    {"key": "still-sky", "range": [2, 4],
     "result": text_result("The sky stays clear; the trial passes without incident.")},
    {"key": "wind-turn", "range": [5, 7],
     "result": text_result("A cold wind turns the cultivator's robe inside out.")},
    {"key": "red-thunder", "range": [8, 9],
     "result": text_result("Red thunder splits the peak; the third strike is the true one.")},
    {"key": "heart-echo", "range": [10, 10],
     "result": text_result("An old regret speaks in a familiar voice. It knows your name.")},
    {"key": "cloud-pillar", "range": [11, 11],
     "result": text_result("A pillar of cloud descends; the mountain holds its breath.")},
    {"key": "double-trial", "range": [12, 12],
     "result": text_result("Two trials arrive together. Even the master steps back.")},
]
omen_entries = [
    ("beggar", 4, "A laughing beggar offers a riddle and refuses payment."),
    ("bell", 3, "A temple bell rings at dusk with no one near the rope."),
    ("crane", 3, "A white crane lands on the road and will not move aside."),
    ("sword-rain", 2, "Sword-light flashes above the ridge; no thunder follows."),
    ("lantern", 3, "A paper lantern drifts upstream against the current."),
    ("merchant", 2, "A merchant sells an empty gourd and calls it a treasure."),
    ("child-song", 2, "A child's song names a name no living elder recognizes."),
    ("master", 1, "A sword master asks directions to a village that burned years ago."),
]
tables = [
    {
        "id": f"{P}/table/tribulation",
        "description": "2d6 ascension trial oracle for a fictional cultivation ladder (not a game-balance rule).",
        "tags": ["oracle", "tribulation", "cultivation"],
        "mode": "dice",
        "dice": {"count": 2, "sides": 6, "modifier": 0},
        "maxDepth": 4,
        "entries": tribulation_entries,
    },
    {
        "id": f"{P}/table/jianghu-omen",
        "description": "Weighted roadside encounter oracle for jianghu wanderers.",
        "tags": ["oracle", "jianghu", "hook"],
        "mode": "weighted",
        "maxDepth": 4,
        "entries": [
            {"key": key, "weight": weight, "result": text_result(text)}
            for key, weight, text in omen_entries
        ],
    },
]

# ─── Generator descriptors ──────────────────────────────────────────────
def gen(suffix, description, tags, engine, **kwargs):
    output = {
        "grammar-v1": "string", "table-v1": "table-roll-v1", "name-v1": "translated-name-v1",
    }[engine]
    return {
        "id": f"{P}/generator/{suffix}",
        "description": description,
        "tags": tags,
        "output": output,
        "engine": engine,
        **kwargs,
    }


generators = [
    gen("person-name", "Portable subset: a pinyin-style given name with a literal gloss. The TS facade also picks a naming style and prefixes a surname.",
        ["person", "name"], "name-v1", culture=f"{P}/culture/pinyin", kind="given"),
    gen("place-name", "Portable subset: a pinyin-style settlement name with a literal gloss. The TS facade may pick either naming style.",
        ["place", "name"], "name-v1", culture=f"{P}/culture/pinyin", kind="settlement"),
    gen("sect-name", "Martial sect or school.", ["sect", "faction"], "grammar-v1",
        grammar=f"{P}/grammar/sect"),
    gen("technique-name", "Martial technique or palm art.", ["technique"], "grammar-v1",
        grammar=f"{P}/grammar/technique"),
    gen("realm", "Cultivation realm from an original ladder.", ["realm", "cultivation"], "grammar-v1",
        grammar=f"{P}/grammar/realm"),
    gen("treasure-name", "Treasure, pill vessel or spirit artifact.", ["treasure"], "grammar-v1",
        grammar=f"{P}/grammar/treasure"),
    gen("nickname", "Jianghu nickname.", ["nickname", "jianghu"], "grammar-v1",
        grammar=f"{P}/grammar/nickname"),
    gen("mountain-name", "Portable grammar for sacred peaks. The TS facade uses glossed culture templates instead; both draw from the same fictional corpus.",
        ["mountain", "place"], "grammar-v1", grammar=f"{P}/grammar/mountain"),
    gen("secret-realm", "Hidden valley or trial ground.", ["secret-realm", "place"], "grammar-v1",
        grammar=f"{P}/grammar/secret-realm"),
    gen("pill-name", "Alchemical pill or elixir.", ["pill", "treasure"], "grammar-v1",
        grammar=f"{P}/grammar/pill"),
    gen("tribulation-oracle", "2d6 ascension trial outcome.", ["oracle", "tribulation"], "table-v1",
        table=f"{P}/table/tribulation"),
    gen("jianghu-omen-oracle", "Weighted roadside encounter.", ["oracle", "jianghu"], "table-v1",
        table=f"{P}/table/jianghu-omen"),
]

pack = {
    "$schema": "https://lexiconlang.dev/schemas/pack-v1.schema.json",
    "formatVersion": 1,
    "id": P,
    "version": "0.1.0",
    "license": "CC0-1.0",
    "description": (
        "Original fictional wuxia, xianxia and cultivation content: sects, martial techniques, "
        "realms, treasures, jianghu nicknames, mountains, secret realms and pinyin-style names "
        "with English glosses. Not a reconstruction of any real tradition or published setting."
    ),
    "provenance": [
        {
            "id": "original-wuxia",
            "source": "original:lexiconlang",
            "title": "Synthetic wuxia / xianxia corpus",
            "creator": "LexiconLang contributors",
            "license": "CC0-1.0",
            "attribution": (
                "All strings in this pack are original synthetic fiction authored for LexiconLang. "
                "Pinyin-style spellings are invented aesthetics, not transcriptions of living "
                "people's names. No trademarks, real sects or setting-specific IP are reproduced."
            ),
            "modifications": "None",
            "files": ["data/wuxia.pack.json", "data/PROVENANCE.md"],
        }
    ],
    "depends": [],
    "extends": [],
    "requires": ["language-v1", "grammar-v1", "tables-v1"],
    "cultures": cultures,
    "meaningPacks": [],
    "grammars": grammars,
    "tables": tables,
    "corpora": [],
    "markovModels": [],
    "generators": generators,
}

out = Path("packages/wuxia/data/wuxia.pack.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("wrote", out, out.stat().st_size, "bytes")
print("cultures", len(cultures), "grammars", len(grammars), "tables", len(tables),
      "generators", len(generators))
