/* ============================================================
   Five Letter Words — a self-contained Wordle-style game
   No network calls, no external links. Everything client-side.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------------------------------------------------
     Word lists
     ANSWERS: common, family-friendly five-letter words used as
       the secret word (daily + practice).
     EXTRA_GUESSES: additional real words accepted as guesses,
       so play doesn't feel restrictive.
     --------------------------------------------------------- */
  var ANSWERS = [
    "about","above","abuse","actor","acute","admit","adopt","adult","after","again",
    "agent","agree","ahead","alarm","album","alert","alike","alive","allow","alone",
    "along","alter","among","angel","anger","angle","angry","apart","apple","apply",
    "arena","argue","arise","armor","aside","asset","audio","audit","avoid","awake",
    "award","aware","badge","baker","basic","basis","beach","begin","being","below",
    "bench","berry","birth","black","blade","blame","blank","blast","bless","blind",
    "block","blood","board","boost","booth","bound","brain","brand","brave","bread",
    "break","breed","brief","bring","broad","broke","brown","brush","build","built",
    "bunch","burst","cabin","cable","candy","canoe","carry","carve","catch","cause",
    "chain","chair","chalk","charm","chart","chase","cheap","check","cheer","chess",
    "chest","chief","child","chunk","churn","claim","class","clean","clear","climb",
    "clock","close","cloud","coach","coast","color","comic","cover","craft","crane",
    "crash","cream","creek","crime","crisp","cross","crowd","crown","crush","curve",
    "cycle","dairy","dance","dealt","death","debut","delay","depth","diary","dodge",
    "doing","donor","doubt","dozen","draft","drain","drama","dream","dress","dried",
    "drift","drill","drink","drive","drove","dwell","eager","early","earth","eight",
    "elbow","elder","elite","empty","enemy","enjoy","enter","entry","equal","equip",
    "error","event","every","exact","exist","extra","fable","faith","false","fancy",
    "fault","fiber","field","fifth","fifty","fight","final","first","fixed","flame",
    "flash","fleet","flesh","float","flock","flood","floor","flour","fluid","flute",
    "focus","force","forge","forth","forty","forum","found","frame","fresh","front",
    "frost","fruit","fully","funny","genre","ghost","giant","given","glare","glass",
    "gleam","glide","globe","glory","glove","grace","grade","grain","grand","grant",
    "grape","graph","grasp","grass","great","greed","green","greet","grief","grill",
    "grind","groom","gross","group","grove","guard","guess","guest","guide","habit",
    "happy","harsh","haste","haven","heart","heavy","hello","hobby","honey","honor",
    "horse","hotel","house","human","humor","hurry","ideal","image","imply","index",
    "inner","input","issue","ivory","japan","jelly","jolly","joint","judge","juice",
    "jumbo","kneel","knife","knock","known","label","labor","laugh","layer","learn",
    "least","leave","lemon","level","light","limit","local","lodge","logic","loose",
    "lower","loyal","lucky","lunar","lunch","lyric","magic","major","maker","mango",
    "march","match","maybe","mayor","medal","media","melon","mercy","merit","metal",
    "meter","might","minor","minus","mirth","model","moist","money","month","moral",
    "motor","mount","mouse","mouth","movie","music","naive","nerve","never","newly",
    "night","noble","noise","north","novel","nurse","ocean","offer","often","olive",
    "onset","orbit","order","organ","other","ought","outer","owner","oxide","paint",
    "panel","panic","paper","party","pasta","patch","pause","peace","pearl","pedal",
    "penny","phase","phone","photo","piano","piece","pilot","pitch","pivot","pixel",
    "place","plaid","plain","plane","plant","plate","point","pooch","porch","posse",
    "pound","power","press","price","pride","prime","print","prior","prize","proof",
    "proud","prove","pulse","punch","pupil","puppy","purse","queen","query","quest",
    "quick","quiet","quilt","quite","quote","radar","radio","raise","rally","ranch",
    "range","rapid","ratio","reach","react","ready","realm","rebel","refer","reign",
    "relax","reply","reset","rhyme","ridge","rider","right","rigid","rival","river",
    "roast","robot","rocky","rouge","rough","round","route","royal","rugby","rural",
    "salad","salsa","sauce","scale","scarf","scene","scent","scope","score","scout",
    "scrap","screw","seven","shade","shake","shall","shape","share","shark","sharp",
    "sheep","sheet","shelf","shell","shift","shine","shirt","shock","shoot","shore",
    "short","shout","shown","sight","silky","since","sixth","skill","skirt","slate",
    "sleep","slice","slide","slope","small","smart","smell","smile","smoke","snack",
    "solar","solid","solve","sonic","sound","south","space","spare","spark","speak",
    "speed","spell","spend","spent","spice","spike","spine","spire","spoke","sport",
    "spray","squad","stack","staff","stage","stain","stair","stake","stall","stamp",
    "stand","stark","start","state","steak","steal","steam","steel","steep","stern",
    "stick","stiff","still","stock","stone","store","storm","story","stout","stove",
    "study","stuff","style","sugar","suite","sunny","super","surge","swamp","swarm",
    "swear","sweat","sweep","sweet","swift","swing","sword","syrup","table","taste",
    "teach","teams","tempo","tenth","theme","thick","thief","thing","think","third",
    "thorn","those","three","threw","throw","thumb","tiger","tight","timer","tired",
    "title","toast","today","token","tonic","topic","torch","total","touch","tough",
    "tower","toxic","trace","track","trade","trail","train","trait","trend","trial",
    "tribe","trick","troop","trout","truck","truly","trunk","trust","truth","tulip",
    "tumor","tunic","turbo","twice","twist","ultra","uncle","under","union","unity",
    "until","upper","upset","urban","usage","usual","valid","value","vapor","vault",
    "venue","verse","video","vigor","vinyl","viral","virus","visit","vital","vivid",
    "vocal","voice","voter","wagon","waste","watch","water","weary","whale","wheat",
    "wheel","where","which","while","white","whole","widen","widow","width","witty",
    "world","worry","worth","would","wound","woven","wreck","wrist","write","wrong",
    "yield","young","youth"
  ];

  var EXTRA_GUESSES = [
    "aback","abbey","abide","abort","abyss","acids","acorn","adage","adieu","adobe",
    "afoot","afoul","after","agile","aglow","agony","aider","aisle","alibi","align",
    "alloy","aloft","aloof","alpha","altar","amber","amble","amend","amiss","amity",
    "ample","amuse","angst","anime","ankle","annex","annoy","anode","antic","aorta",
    "apnea","aptly","aroma","arrow","ashen","atlas","atoll","atone","attic","avert",
    "avian","avoid","await","axiom","azure","bagel","baggy","bally","balmy","banjo",
    "barge","basil","batch","bathe","baton","belly","bevel","bicep","bigot","bilge",
    "binge","bison","blaze","bleak","bloat","blond","blunt","blurt","boast","bogus",
    "bonus","booby","borne","bossy","bough","boxer","brace","brake","brawl","brawn",
    "brine","briny","brisk","broil","brood","brook","broom","brute","buddy","budge",
    "buggy","bulge","bulky","bunny","burly","cabby","cache","cacti","caddy","camel",
    "canal","candi","canny","caper","caste","cedar","chard","chasm","cheek","cheep",
    "chewy","chime","chirp","choir","chomp","chord","chose","chute","churl","cider",
    "cigar","cinch","civic","civil","clamp","clang","clash","clasp","cleat","cleft",
    "clerk","cliff","cling","clink","clown","clued","clump","clung","coast","cobra",
    "cocoa","comet","comfy","comma","conch","condo","conic","coral","corny","couch",
    "cough","could","coupe","court","covet","covey","cower","crack","cramp","crank",
    "crate","crawl","credo","creek","creep","crepe","crest","crick","crony","crook",
    "creed","crust","cubic","cupid","curly","curry","curse","curvy","cynic",
    "daddy","daily","dally","dandy","datum","dazed","dealt","decal","decay","decor",
    "decoy","defer","deity","delta","dense","depot","derby","desks","diner","dingo",
    "dingy","disco","ditch","ditto","diver","dizzy","dodgy","dogma","donut","dowdy",
    "downy","dowry","dozer","drank","dread","drear","drone","droop","dross","drown",
    "drunk","dryer","dryly","duchy","dully","dummy","dumpy","dunce","dusky","dusty",
    "dutch","duvet","dwelt","early","ebony","eerie","eject","elope","elude","elves",
    "embed","ember","emcee","emote","enact","endow","envoy","epoch","epoxy","erase",
    "erode","erupt","essay","ethic","evict","evoke","exalt","exert","exile","expel",
    "extol","fable","facet","faint","fairy","falls","fancy","fanny","farce","fatal",
    "fated","favor","feast","feign","fella","fence","feral","ferry","fetal","fetch",
    "fever","fiery","filet","filly","filmy","filth","finch","finer","fjord","flack",
    "flair","flake","flaky","flank","flare","flask","fleck","flick","flier","fling",
    "flint","flirt","flock","flora","flops","fluff","fluke","flung","flunk","floss",
    "flush","flyer","foamy","foray","forge","forgo","fudge","fully","fungi","funky",
    "furry","fussy","fuzzy","gaily","gamma","gassy","gaudy","gauge","gaunt","gauze",
    "gazer","gecko","genie","germs","goofy","ghoul","giddy","gizmo","glean","glint",
    "gloat","gloom","glued","gnash","gnome","godly","golly","gonad","goose","gorge",
    "gouge","gourd","grape","grimy","grind","gripe","groan","groat","gruff","grunt",
    "guise","gully","gummy","gusto","gusty","hairy","halve","handy","hardy","harem",
    "hasty","hatch","haunt","hazel","heave","hedge","hefty","heist","herby","hinge",
    "hippo","hoard","hoist","holly","homer","hooky","horde","hovel","hover","howdy",
    "hunch","husky","hutch","hydra","hyena","hymns","icing","igloo","incur","indie",
    "infer","inlet","irate","irony","islet","itchy","ivory","jaunt","jazzy","jerky",
    "jewel","joker","jumpy","junky","juror","kayak","kebab","kiosk","kitty","knead",
    "kneed","koala","krill","lager","lance","lanky","lapel","lapse","larva","lasso",
    "latch","later","latte","lease","leash","lefty","legal","lever","liner","lithe",
    "livid","llama","loamy","locus","lofty","loner","looms","loopy","loved","lover",
    "lowly","lucid","lumpy","lunge","lupus","lurch","lurid","lusty","lymph","lyric",
    "macro","madly","mango","mange","mangy","mania","manor","maple","marsh","mason",
    "match","mauve","medic","melee","mercy","messy","meter","midst","miner","minty",
    "mocha","modem","moldy","mommy","moody","moose","mossy","motel","motto","mound",
    "mummy","mural","murky","mushy","musty","myrrh","nacho","nasal","natal",
    "needy","nervy","nifty","nomad","noose","numbs","nutty","nylon","oasis","ogled",
    "olden","opera","optic","opine","orbit","organ","oscar","otter","ounce","outdo",
    "ovary","paddy","pagan","pally","panda","panga","parka","party","patio","peaty",
    "peppy","perch","peril","perky","petal","photo","piety","pilaf","pique","pixie",
    "plaza","plead","pluck","plumb","plume","plump","poesy","poise","poker","polar",
    "polka","poppy","potty","preen","press","prism","privy","probe","prong","prowl",
    "proxy","puffy","pulpy","pygmy","quack","quail","qualm","quart","query","quick",
    "quill","quirk","quota","quoth","rabid","radii","rajah","rally","ranch","rasps",
    "raspy","ratty","raven","razor","reedy","refit","regal","reign","relic","remix",
    "renal","repay","reply","resin","retro","rhino","ridge","rigid","rinse",
    "risky","ritzy","rival","robin","robot","rocky","rodeo","roomy","rowdy","ruddy",
    "rugby","ruler","rumba","rusty","sable","salsa","salty","salvo","samba","sappy",
    "sassy","satin","savor","savvy","scald","scaly","scamp","scant","scare","scarf",
    "scary","scoff","scoop","scoot","scowl","scrub","seedy","serum","sewer","shaky",
    "shale","shame","shard","sharp","shawl","sheen","shied","shiny","shone","showy",
    "shrub","shrug","shush","shyly","siege","silky","silly","siren","sissy","sixty",
    "skate","skimp","skull","slack","slain","slang","slant","sleek","sleet","slept",
    "slick","slimy","sling","slink","slosh","sloth","slump","slurp","slush","slyly",
    "smash","smirk","smock","smoky","smote","snarl","sneak","sneer","snide","snoop",
    "snore","snout","snowy","soggy","sonar","sooty","sorry","spasm","spawn","speck",
    "spelt","spool","spoof","spoon","spoor","spout","sprig","spunk","spurn",
    "spurt","squid","stale","stall","stark","stash","steed","stein","stint","stony",
    "stoop","stray","strut","stump","stung","stunt","suave","surly","swirl",
    "swish","swoon","swoop","tabby","taffy","talon","tangy","tardy","tarot","tawny",
    "teddy","teeny","tempt","tepid","testy","thigh","thorn","throb","thump","thyme",
    "tibia","tidal","tilde","timid","tipsy","toddy","token","tonal","tooth","toque",
    "torso","truss","toxin","trawl","treat","tress","trill","tripe","trove","tryst",
    "tunes","turfy","twang","tweak","tweed","twerp","twine","udder","ulcer","ultra",
    "umbra","uncut","undid","undue","unfit","unify","unite","untie","upend","urged",
    "usher","utter","vague","vaunt","veery","venom","verge","vertu","vexed","vigil",
    "villa","vixen","vodka","vogue","vouch","waist","waltz","warty","weave","wedge",
    "weedy","weird","welsh","whack","wharf","whelp","whiny","whisk","witch","woken",
    "wooly","worry","wrath","wring","yacht","yearn","yeast","yield","zebra","zesty"
  ];

  var VALID = new Set(ANSWERS.concat(EXTRA_GUESSES));
  var ANSWER_POOL = ANSWERS.slice();

  /* ---------------------------------------------------------
     Config
     --------------------------------------------------------- */
  var WORD_LEN = 5;
  var MAX_GUESSES = 6;
  var STORAGE_KEY = "ftw_state_v1";

  var EPOCH = new Date(2024, 0, 1); // arbitrary local epoch for daily rotation

  function dayIndex() {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var ms = today - EPOCH;
    return Math.floor(ms / 86400000);
  }

  function wordForIndex(idx) {
    // Simple deterministic scatter so consecutive days don't look sequential.
    var n = ANSWER_POOL.length;
    var i = ((idx * 2654435761) % n + n) % n;
    return ANSWER_POOL[i];
  }

  function randomWord(excludeWord) {
    var w;
    do {
      w = ANSWER_POOL[Math.floor(Math.random() * ANSWER_POOL.length)];
    } while (w === excludeWord && ANSWER_POOL.length > 1);
    return w;
  }

  /* ---------------------------------------------------------
     Storage
     --------------------------------------------------------- */
  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage unavailable (private mode etc.) — game still works in-memory */
    }
  }

  function defaultStats() {
    return {
      played: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0, 0],
      lastCompletedDay: -1
    };
  }

  function newHints() {
    return { vowels: false, first: false, last: false };
  }

  function defaultState() {
    return {
      stats: defaultStats(),
      daily: {
        dayIndex: dayIndex(),
        guesses: [],       // array of {word, feedback:[...]}
        status: "playing", // playing | won | lost
        hints: newHints()
      }
    };
  }

  var state = loadState() || defaultState();
  if (!state.stats) state.stats = defaultStats();
  if (!state.daily || state.daily.dayIndex !== dayIndex()) {
    state.daily = { dayIndex: dayIndex(), guesses: [], status: "playing", hints: newHints() };
  }
  if (!state.daily.hints) state.daily.hints = newHints();

  function vowelCount(word) {
    var m = word.match(/[aeiou]/g);
    return m ? m.length : 0;
  }

  /* ---------------------------------------------------------
     Core game engine
     --------------------------------------------------------- */
  function scoreGuess(guess, answer) {
    var result = new Array(WORD_LEN).fill("absent");
    var answerLetters = answer.split("");
    var used = new Array(WORD_LEN).fill(false);

    for (var i = 0; i < WORD_LEN; i++) {
      if (guess[i] === answer[i]) {
        result[i] = "correct";
        used[i] = true;
        answerLetters[i] = null;
      }
    }
    for (i = 0; i < WORD_LEN; i++) {
      if (result[i] === "correct") continue;
      var idx = answerLetters.indexOf(guess[i]);
      if (idx !== -1) {
        result[i] = "present";
        answerLetters[idx] = null;
      }
    }
    return result;
  }

  /* ============================================================
     UI wiring
     ============================================================ */
  var els = {};
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    els.board = qs("#board");
    els.keyboard = qs("#keyboard");
    els.toast = qs("#toast");
    els.streakVal = qs("#streak-val");
    els.modeSeg = qsa(".mode-btn");
    els.statsBtn = qs("#stats-btn");
    els.helpBtn = qs("#help-btn");
    els.statsModal = qs("#stats-modal");
    els.helpModal = qs("#help-modal");
    els.endPanel = qs("#end-panel");
    els.endTitle = qs("#end-title");
    els.endWord = qs("#end-word");
    els.endBadges = qs("#end-badges");
    els.nextBtn = qs("#next-btn");
    els.closeButtons = qsa("[data-close]");
    els.hintToggle = qs("#hint-toggle");
    els.hintPanel = qs("#hint-panel");
    els.hintButtons = qsa(".hint-reveal");

    if (!els.board || !els.keyboard) {
      /* Guess-the-word puzzle markup isn't on the page right now
         (temporarily removed) — skip wiring it up rather than
         throwing on the missing elements. */
      return;
    }

    buildBoard();
    buildKeyboard();
    bindEvents();

    mode = "daily";
    loadMode("daily");
    renderStats();
  }

  var mode = "daily"; // "daily" | "practice"
  var practice = null; // {word, guesses, status}
  var current = "";
  var locked = false;
  var revealing = false;

  function activePuzzle() {
    return mode === "daily" ? state.daily : practice;
  }
  function activeAnswer() {
    return mode === "daily" ? wordForIndex(state.daily.dayIndex) : practice.word;
  }

  function buildBoard() {
    els.board.innerHTML = "";
    for (var r = 0; r < MAX_GUESSES; r++) {
      var row = document.createElement("div");
      row.className = "row";
      row.setAttribute("data-row", r);
      for (var c = 0; c < WORD_LEN; c++) {
        var tile = document.createElement("div");
        tile.className = "tile";
        tile.setAttribute("data-r", r);
        tile.setAttribute("data-c", c);
        row.appendChild(tile);
      }
      els.board.appendChild(row);
    }
  }

  var KEY_ROWS = [
    ["q","w","e","r","t","y","u","i","o","p"],
    ["a","s","d","f","g","h","j","k","l"],
    ["enter","z","x","c","v","b","n","m","back"]
  ];

  function buildKeyboard() {
    els.keyboard.innerHTML = "";
    KEY_ROWS.forEach(function (rowKeys) {
      var row = document.createElement("div");
      row.className = "kb-row";
      rowKeys.forEach(function (k) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "key" + (k === "enter" || k === "back" ? " key--wide" : "");
        btn.setAttribute("data-key", k);
        btn.setAttribute("aria-label", k === "back" ? "Backspace" : (k === "enter" ? "Enter" : k));
        if (k === "back") {
          btn.innerHTML = "&#9003;";
        } else if (k === "enter") {
          btn.textContent = "Enter";
        } else {
          btn.textContent = k;
        }
        row.appendChild(btn);
      });
      els.keyboard.appendChild(row);
    });
  }

  function bindEvents() {
    els.keyboard.addEventListener("click", function (e) {
      var btn = e.target.closest(".key");
      if (!btn) return;
      handleKey(btn.getAttribute("data-key"));
    });

    document.addEventListener("keydown", function (e) {
      if (isModalOpen()) return;
      var k = e.key;
      if (k === "Enter") { handleKey("enter"); }
      else if (k === "Backspace") { handleKey("back"); }
      else if (/^[a-zA-Z]$/.test(k)) { handleKey(k.toLowerCase()); }
    });

    els.modeSeg.forEach(function (btn) {
      btn.addEventListener("click", function () {
        loadMode(btn.getAttribute("data-mode"));
      });
    });

    els.statsBtn.addEventListener("click", function () { openModal(els.statsModal); renderStats(); });
    els.helpBtn.addEventListener("click", function () { openModal(els.helpModal); });
    els.closeButtons.forEach(function (b) {
      b.addEventListener("click", function () { closeAllModals(); });
    });
    qsa(".modal-backdrop").forEach(function (bd) {
      bd.addEventListener("click", function (e) {
        if (e.target === bd) closeAllModals();
      });
    });

    els.nextBtn.addEventListener("click", function () {
      hideEndPanel();
      if (mode === "practice") {
        startPractice(activeAnswer());
      } else {
        loadMode("practice");
        els.modeSeg.forEach(function (b) {
          b.classList.toggle("is-active", b.getAttribute("data-mode") === "practice");
        });
      }
    });

    els.hintToggle.addEventListener("click", function () {
      var open = els.hintToggle.getAttribute("aria-expanded") === "true";
      els.hintToggle.setAttribute("aria-expanded", String(!open));
      els.hintPanel.setAttribute("data-open", String(!open));
    });

    els.hintButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        revealHint(btn.getAttribute("data-hint"));
      });
    });
  }

  function revealHint(key) {
    if (locked) return;
    var puzzle = activePuzzle();
    if (!puzzle.hints) puzzle.hints = newHints();
    if (puzzle.hints[key]) return;
    puzzle.hints[key] = true;
    renderHints(puzzle);
    if (mode === "daily") persist();
  }

  function renderHints(puzzle) {
    var answer = mode === "daily" ? wordForIndex(state.daily.dayIndex) : (puzzle && puzzle.word);
    if (!answer) return;
    var hints = puzzle.hints || newHints();

    setHintRow("vowels", hints.vowels, function () {
      var n = vowelCount(answer);
      return n + (n === 1 ? " vowel" : " vowels");
    });
    setHintRow("first", hints.first, function () {
      return "Starts with “" + answer[0].toUpperCase() + "”";
    });
    setHintRow("last", hints.last, function () {
      return "Ends with “" + answer[answer.length - 1].toUpperCase() + "”";
    });
  }

  function setHintRow(key, revealed, textFn) {
    var row = qs('.hint-row[data-hint-row="' + key + '"]');
    if (!row) return;
    row.classList.toggle("is-revealed", !!revealed);
    var out = row.querySelector(".hint-value");
    var btn = row.querySelector(".hint-reveal");
    if (revealed) {
      out.textContent = textFn();
      btn.disabled = true;
    } else {
      out.textContent = "";
      btn.disabled = false;
    }
  }

  function hintsUsedCount(puzzle) {
    var h = puzzle && puzzle.hints;
    if (!h) return 0;
    return (h.vowels ? 1 : 0) + (h.first ? 1 : 0) + (h.last ? 1 : 0);
  }

  function isModalOpen() {
    return !els.statsModal.hidden || !els.helpModal.hidden;
  }
  function openModal(m) { m.hidden = false; }
  function closeAllModals() { els.statsModal.hidden = true; els.helpModal.hidden = true; }

  function loadMode(m) {
    mode = m;
    els.modeSeg.forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-mode") === m);
      b.setAttribute("aria-selected", b.getAttribute("data-mode") === m ? "true" : "false");
    });

    if (m === "daily") {
      hideEndPanel();
      redrawFromPuzzle(state.daily);
      locked = state.daily.status !== "playing";
      if (locked) showEndPanel(state.daily.status, wordForIndex(state.daily.dayIndex));
    } else {
      if (!practice) startPractice(null);
      else redrawFromPuzzle(practice);
    }
    updateStreakBadge();
  }

  function startPractice(avoidWord) {
    practice = { word: randomWord(avoidWord), guesses: [], status: "playing", hints: newHints() };
    current = "";
    locked = false;
    revealing = false;
    buildBoard();
    resetKeyboardColors();
    redrawFromPuzzle(practice);
    hideEndPanel();
  }

  function redrawFromPuzzle(puzzle) {
    buildBoard();
    resetKeyboardColors();
    current = "";
    revealing = false;
    locked = puzzle.status !== "playing";
    if (!puzzle.hints) puzzle.hints = newHints();
    renderHints(puzzle);
    puzzle.guesses.forEach(function (g, r) {
      paintRow(r, g.word, g.feedback, false);
      applyKeyboardFeedback(g.word, g.feedback);
    });
    if (locked) {
      var answer = mode === "daily" ? wordForIndex(state.daily.dayIndex) : puzzle.word;
      showEndPanel(puzzle.status, answer);
    }
  }

  function resetKeyboardColors() {
    qsa(".key").forEach(function (k) { k.removeAttribute("data-state"); });
  }

  /* ---------------------------------------------------------
     Input handling
     --------------------------------------------------------- */
  function handleKey(key) {
    if (locked || revealing) return;
    var puzzle = activePuzzle();
    var row = puzzle.guesses.length;
    if (row >= MAX_GUESSES) return;

    if (key === "back") {
      current = current.slice(0, -1);
      paintRow(row, current, null, false);
      return;
    }
    if (key === "enter") {
      submitGuess();
      return;
    }
    if (/^[a-z]$/.test(key) && current.length < WORD_LEN) {
      current += key;
      paintRow(row, current, null, true);
    }
  }

  function submitGuess() {
    var puzzle = activePuzzle();
    var row = puzzle.guesses.length;

    if (current.length < WORD_LEN) {
      shakeRow(row);
      showToast("Not enough letters");
      return;
    }
    if (!VALID.has(current)) {
      shakeRow(row);
      showToast("Not in word list");
      return;
    }

    var answer = activeAnswer();
    var feedback = scoreGuess(current, answer);
    var guessWord = current;

    puzzle.guesses.push({ word: guessWord, feedback: feedback });
    revealing = true;

    revealRow(row, guessWord, feedback, function () {
      revealing = false;
      applyKeyboardFeedback(guessWord, feedback);

      var won = feedback.every(function (f) { return f === "correct"; });
      var lost = !won && puzzle.guesses.length >= MAX_GUESSES;

      if (won) {
        puzzle.status = "won";
        bounceRow(row);
        onGameEnd(true, answer);
      } else if (lost) {
        puzzle.status = "lost";
        onGameEnd(false, answer);
      }
      current = "";
      persist();
    });
  }

  function onGameEnd(won, answer) {
    locked = true;
    if (mode === "daily") {
      var s = state.stats;
      if (state.daily.dayIndex !== s.lastCompletedDay) {
        s.played++;
        if (won) {
          s.wins++;
          s.currentStreak++;
          s.maxStreak = Math.max(s.maxStreak, s.currentStreak);
          var guessCount = state.daily.guesses.length;
          s.distribution[guessCount - 1]++;
        } else {
          s.currentStreak = 0;
        }
        s.lastCompletedDay = state.daily.dayIndex;
      }
      updateStreakBadge();
    }
    setTimeout(function () {
      showEndPanel(won ? "won" : "lost", answer);
      if (won) launchConfetti();
      if (mode === "daily") {
        document.dispatchEvent(new CustomEvent("ftw:daily-complete", {
          detail: { won: won, guesses: state.daily.guesses.length, streak: state.stats.currentStreak }
        }));
      }
    }, 550);
  }

  function persist() { saveState(state); }

  /* ---------------------------------------------------------
     Rendering: tiles
     --------------------------------------------------------- */
  function paintRow(r, word, feedback, animatePop) {
    for (var c = 0; c < WORD_LEN; c++) {
      var tile = els.board.querySelector('.tile[data-r="' + r + '"][data-c="' + c + '"]');
      if (!tile) continue;
      var letter = word[c] || "";
      var already = tile.textContent;
      tile.textContent = letter.toUpperCase();
      tile.classList.toggle("tile--filled", !!letter);
      if (feedback) {
        tile.setAttribute("data-state", feedback[c]);
      } else {
        tile.removeAttribute("data-state");
        if (animatePop && letter && already !== letter.toUpperCase()) {
          tile.classList.remove("tile--pop");
          void tile.offsetWidth;
          tile.classList.add("tile--pop");
        }
      }
    }
  }

  function revealRow(r, word, feedback, done) {
    var tiles = [];
    for (var c = 0; c < WORD_LEN; c++) {
      tiles.push(els.board.querySelector('.tile[data-r="' + r + '"][data-c="' + c + '"]'));
    }
    tiles.forEach(function (tile, i) {
      setTimeout(function () {
        tile.classList.add("tile--flip");
        setTimeout(function () {
          tile.textContent = word[i].toUpperCase();
          tile.setAttribute("data-state", feedback[i]);
        }, 180);
      }, i * 220);
    });
    setTimeout(done, WORD_LEN * 220 + 260);
  }

  function shakeRow(r) {
    var row = els.board.querySelector('.row[data-row="' + r + '"]');
    if (!row) return;
    row.classList.remove("row--shake");
    void row.offsetWidth;
    row.classList.add("row--shake");
  }

  function bounceRow(r) {
    for (var c = 0; c < WORD_LEN; c++) {
      var tile = els.board.querySelector('.tile[data-r="' + r + '"][data-c="' + c + '"]');
      (function (t, delay) {
        setTimeout(function () {
          t.classList.add("tile--bounce");
        }, delay);
      })(tile, c * 80);
    }
  }

  /* ---------------------------------------------------------
     Keyboard feedback
     --------------------------------------------------------- */
  var STATE_RANK = { absent: 0, present: 1, correct: 2 };
  function applyKeyboardFeedback(word, feedback) {
    for (var i = 0; i < word.length; i++) {
      var keyBtn = els.keyboard.querySelector('.key[data-key="' + word[i] + '"]');
      if (!keyBtn) continue;
      var prev = keyBtn.getAttribute("data-state");
      var next = feedback[i];
      if (!prev || STATE_RANK[next] > STATE_RANK[prev]) {
        keyBtn.setAttribute("data-state", next);
      }
    }
  }

  /* ---------------------------------------------------------
     Toast
     --------------------------------------------------------- */
  var toastTimer = null;
  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      els.toast.classList.remove("is-visible");
    }, 1400);
  }

  /* ---------------------------------------------------------
     End panel
     --------------------------------------------------------- */
  function showEndPanel(status, answer) {
    els.endPanel.hidden = false;
    els.endPanel.setAttribute("data-status", status);
    els.endTitle.textContent = status === "won" ? pickWinTitle() : "So close!";
    els.endWord.textContent = answer.toUpperCase();
    renderBadges(status);
  }
  function hideEndPanel() {
    els.endPanel.hidden = true;
  }

  var WIN_TITLES = ["Genius!", "Brilliant!", "Impressive!", "Great job!", "Nice one!", "Solved it!"];
  function pickWinTitle() {
    var puzzle = activePuzzle();
    var n = puzzle.guesses.length;
    if (n === 1) return "Incredible!";
    if (n <= 2) return "Genius!";
    if (n <= 3) return "Brilliant!";
    return WIN_TITLES[Math.floor(Math.random() * WIN_TITLES.length)];
  }

  function renderBadges(status) {
    els.endBadges.innerHTML = "";
    var badges = [];
    var puzzle = activePuzzle();

    var usedHints = hintsUsedCount(puzzle) > 0;

    if (status === "won") {
      var n = puzzle.guesses.length;
      if (n <= 2 && !usedHints) badges.push({ icon: "⚡", label: "Flawless" });
      if (usedHints) badges.push({ icon: "💡", label: "Hint-assisted" });
      if (mode === "daily") {
        var s = state.stats;
        if (s.currentStreak > 0 && s.currentStreak === s.maxStreak && s.currentStreak > 1) {
          badges.push({ icon: "🔥", label: s.currentStreak + "-day streak" });
        }
        if (s.wins === 1) badges.push({ icon: "🎉", label: "First win" });
      }
    }
    if (badges.length === 0 && mode === "daily") {
      badges.push({ icon: "📅", label: "Daily puzzle" });
    } else if (badges.length === 0) {
      badges.push({ icon: "🎯", label: "Practice round" });
    }

    badges.forEach(function (b) {
      var el = document.createElement("span");
      el.className = "badge";
      el.innerHTML = '<span class="badge-icon">' + b.icon + '</span>' + b.label;
      els.endBadges.appendChild(el);
    });
  }

  /* ---------------------------------------------------------
     Streak badge + stats modal
     --------------------------------------------------------- */
  function updateStreakBadge() {
    els.streakVal.textContent = state.stats.currentStreak;
  }

  function renderStats() {
    var s = state.stats;
    qs("#stat-played").textContent = s.played;
    var pct = s.played ? Math.round((s.wins / s.played) * 100) : 0;
    qs("#stat-winpct").textContent = pct;
    qs("#stat-streak").textContent = s.currentStreak;
    qs("#stat-max").textContent = s.maxStreak;

    var max = Math.max.apply(null, s.distribution.concat([1]));
    var wrap = qs("#dist-wrap");
    wrap.innerHTML = "";
    s.distribution.forEach(function (count, i) {
      var row = document.createElement("div");
      row.className = "dist-row";
      var pctWidth = Math.max(6, Math.round((count / max) * 100));
      row.innerHTML =
        '<span class="dist-label">' + (i + 1) + '</span>' +
        '<div class="dist-bar-track"><div class="dist-bar" style="width:' + pctWidth + '%">' +
        '<span class="dist-count">' + count + '</span></div></div>';
      wrap.appendChild(row);
    });
  }

  /* ---------------------------------------------------------
     Confetti (lightweight canvas burst, no external libs)
     --------------------------------------------------------- */
  function launchConfetti() {
    var canvas = qs("#confetti");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.width = window.innerWidth * dpr;
    var h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.scale(dpr, dpr);
    canvas.classList.add("is-active");

    var colors = ["#0e4076", "#4d97c0", "#2e9e63", "#e0a53c", "#ffffff"];
    var pieces = [];
    var count = 120;
    for (var i = 0; i < count; i++) {
      pieces.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
        y: window.innerHeight * 0.35,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 9 - 4,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        life: 0
      });
    }

    var gravity = 0.28;
    var frame = 0;
    var maxFrames = 130;

    function tick() {
      frame++;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      pieces.forEach(function (p) {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (frame < maxFrames) {
        requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        canvas.classList.remove("is-active");
      }
    }
    requestAnimationFrame(tick);
  }
})();
