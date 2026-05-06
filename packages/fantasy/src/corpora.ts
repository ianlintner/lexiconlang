// Hand-curated fantasy name corpora for Markov training.
// Roots are public-domain or generic — these are not from any particular IP.

export const corpora = {
  elven_male: [
    "aelar", "aerdeth", "ahvain", "aramil", "arannis", "aust", "beiro",
    "berrian", "caeldrim", "carric", "dayereth", "dreali", "eiravel",
    "enialis", "erdan", "erevan", "fivin", "galinndan", "gennal", "hadarai",
    "halimath", "heian", "himo", "immeral", "ivellios", "korfel", "lamlis",
    "laucian", "lucan", "mindartis", "naal", "nutae", "paelias", "peren",
    "quarion", "riardon", "rolen", "soveliss", "suhnae", "thamior", "tharivol",
    "theren", "theriatis", "uthemar", "vanuath", "varis", "aelyndar",
  ],
  elven_female: [
    "adrie", "ahinar", "aleia", "althaea", "anastrianna", "andraste",
    "antinua", "arara", "baelitae", "bethrynna", "birel", "caelynn", "chaedi",
    "claira", "dara", "drusilia", "elama", "enna", "faral", "felosial",
    "ielenia", "ilanis", "irann", "jelenneth", "keyleth", "leshanna",
    "lia", "maiathah", "malquis", "meriele", "mialee", "myathethil",
    "naivara", "quelenna", "quillathe", "ridaro", "sariel", "shanairra",
    "shava", "silaqui", "theirastra", "thiala", "vadania", "valanthe",
    "valna", "xanaphia",
  ],
  dwarven_male: [
    "adrik", "alberich", "baern", "barendd", "brottor", "bruenor", "dain",
    "darrak", "delg", "eberk", "einkil", "fargrim", "flint", "gardain",
    "harbek", "kildrak", "morgran", "orsik", "oskar", "rangrim", "rurik",
    "taklinn", "thoradin", "thorin", "tordek", "traubon", "travok",
    "ulfgar", "veit", "vondal", "kilvar", "morrik", "thrain", "balin",
    "dvalin", "gloin", "azaghal", "kazadar", "duregar", "kazrim", "varin",
  ],
  dwarven_female: [
    "amber", "artin", "audhild", "bardryn", "dagnal", "diesa", "eldeth",
    "falkrunn", "finellen", "gunnloda", "gurdis", "helja", "hlin",
    "kathra", "kristryd", "ilde", "liftrasa", "mardred", "riswynn",
    "sannl", "torbera", "torgga", "vistra", "balifra", "lindra", "harlin",
    "thorin", "myrin", "kira", "freydis", "ranveig", "ingerd", "torhild",
  ],
  human_male: [
    "aiden", "albrecht", "alric", "anson", "arden", "arvin", "balan",
    "barden", "berek", "branton", "carrick", "cedric", "darian", "edric",
    "elgar", "fendrel", "garrick", "gavin", "haldric", "hewn", "ivar",
    "jorrick", "kael", "kendric", "lothar", "magnus", "mordan", "owain",
    "perrin", "quintin", "renard", "stefan", "talric", "ulric", "vorian",
    "wilhelm", "yannick", "zorian", "alaric", "bertram", "darek", "ellard",
  ],
  human_female: [
    "ada", "alana", "anya", "brynn", "cara", "celia", "darra", "elsa",
    "eliana", "freya", "gilda", "halia", "isolde", "jenna", "kara",
    "lena", "mira", "nessa", "orla", "petra", "quinn", "rhea", "saskia",
    "tessa", "una", "vela", "wren", "xara", "ysolde", "zora", "alida",
    "brielle", "corina", "delia", "edith", "freyja", "gretha", "helena",
  ],
  orcish: [
    "graksh", "burgokh", "morguth", "krang", "uruk", "thrall", "drogan",
    "korg", "vargosh", "rok", "graug", "zorg", "morg", "garr", "ushar",
    "kogor", "drakka", "ghazok", "shazga", "ulgosh", "narghul", "barakh",
    "drogath", "kazgar", "throg", "ugluk", "lugburz", "uruz", "zogru",
  ],
  halfling: [
    "alton", "ander", "bilbo", "cade", "corrin", "eldon", "errich", "finnan",
    "garret", "lyle", "merric", "milo", "osborn", "perrin", "pippin",
    "reed", "rosco", "wellby", "wendel", "andry", "bree", "callie",
    "cora", "euphemia", "jillian", "kithri", "lavinia", "lidda", "merla",
    "nedda", "paela", "portia", "seraphina", "shaena", "trym", "vani",
  ],
  draconic: [
    "akra", "balasar", "bharash", "donaar", "ghesh", "heskan", "kriv",
    "medrash", "mehen", "nadarr", "pandjed", "patrin", "rhogar", "shamash",
    "shedinn", "tarhun", "torinn", "akra", "biri", "daar", "farideh",
    "harann", "havilar", "jheri", "kava", "korinn", "mishann", "nala",
    "perra", "raiann", "sora", "surina", "thava", "uadjit",
  ],
} as const;

export type CorpusName = keyof typeof corpora;
