/* ============================================================
   Five Letter Words — extra mini-games, daily/weekly rotation,
   stats, streaks, XP, achievements, show-more and reveal FX.
   Self-contained: reads game.js's own state for the main Wordle
   streak, never modifies it.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------------------------------------------------
     Small deterministic word pool for the mini-games (kept
     separate from game.js's dictionary so this file has no
     dependency on it).
     --------------------------------------------------------- */
  var WORDS = [
    "apple","brave","chair","dance","eager","flame","grape","house","input","joker",
    "knife","level","mango","noble","ocean","piano","query","river","stone","tiger",
    "unity","vivid","water","xenon","yield","zesty","bread","cloud","dream","earth",
    "fable","glory","heart","ivory","jelly","kayak","light","music","nurse","olive",
    "power","quiet","robin","smile","trust","urban","value","world","abide","charm",
    "delta","essay","field","grasp","honey","index","judge","known","lucky","medal",
    "novel","ounce","proud","quilt","reach","spark","total","usage","vocal","wagon"
  ];
  var HARD_WORDS = [
    "abyss","crypt","glyph","lymph","nymph","tryst","pygmy","fjord","qualm","zesty",
    "whisk","vexed","jumbo","fuzzy","quirk","waltz","brisk","gawky","vixen","zonal"
  ];

  function seededPick(pool, seed) {
    var n = pool.length;
    var i = ((seed * 2654435761) % n + n) % n;
    return pool[i];
  }

  var EPOCH = new Date(2024, 0, 1); // a Monday — anchors weeks to Mon-Sun
  function dayIndex() {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.floor((today - EPOCH) / 86400000);
  }
  function weekIndex() { return Math.floor(dayIndex() / 7); }

  /* The week the visitor is actually looking at right now, vs. the
     real current week. They differ only while replaying a Past
     Challenge, and that's the flag every mini-game and the progress
     store checks before persisting XP, streaks or "solved" state. */
  var CURRENT_WEEK = weekIndex();
  var viewingWeek = CURRENT_WEEK;
  function isLiveWeek() { return viewingWeek === CURRENT_WEEK; }

  var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function weekStartDate(wIndex) {
    return new Date(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate() + wIndex * 7);
  }
  function weekRangeLabel(wIndex) {
    var start = weekStartDate(wIndex);
    var end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    var thisYear = new Date().getFullYear();
    var yearSuffix = (start.getFullYear() !== thisYear || end.getFullYear() !== thisYear) ? (", " + end.getFullYear()) : "";
    if (start.getMonth() === end.getMonth()) {
      return MONTH_NAMES[start.getMonth()] + " " + start.getDate() + "–" + end.getDate() + yearSuffix;
    }
    return MONTH_NAMES[start.getMonth()] + " " + start.getDate() + " – " + MONTH_NAMES[end.getMonth()] + " " + end.getDate() + yearSuffix;
  }

  function weekWord(offset, wIndex) { return seededPick(WORDS, (wIndex === undefined ? viewingWeek : wIndex) * 13 + offset); }
  function hardWordForWeek(wIndex) { return seededPick(HARD_WORDS, wIndex === undefined ? viewingWeek : wIndex); }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------------------------------------------------------
     Progress store: XP, level, per-day challenge completion,
     lifetime totals, achievements. Persisted independently of
     game.js's own daily-puzzle state.
     --------------------------------------------------------- */
  var PROGRESS_KEY = "ftw_progress_v1";

  function defaultProgress() {
    return {
      weekIndex: CURRENT_WEEK,
      done: { today: false, unscramble: false, missing: false, speed: false },
      totalXp: 0,
      gamesPlayed: 0,
      wordsSolved: 0,
      wins: 0,
      streak: 0,
      maxStreak: 0,
      streakDay: -1,
      weeklyDone: false,
      bestSpeedScore: 0,
      achievements: []
    };
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return defaultProgress();
      var p = JSON.parse(raw);
      return Object.assign(defaultProgress(), p);
    } catch (e) { return defaultProgress(); }
  }

  function saveProgress() {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch (e) {}
  }

  /* Every reload starts each mini-game fresh — solving one just
     locks it for the rest of that visit, not for the whole week —
     so returning visitors always have something to play again.
     Streak, XP, achievements and lifetime totals still persist;
     only the "done" flags reset. Word content still rotates
     weekly regardless (see weekWord()/hardWordForWeek()). */
  var progress = loadProgress();
  progress.weekIndex = CURRENT_WEEK;
  progress.done = { today: false, unscramble: false, missing: false, speed: false };
  progress.weeklyDone = false;
  saveProgress();

  function registerDailyActivity() {
    var di = dayIndex();
    if (progress.streakDay === di) return;
    progress.streak = (progress.streakDay === di - 1) ? (progress.streak || 0) + 1 : 1;
    progress.streakDay = di;
    progress.maxStreak = Math.max(progress.maxStreak || 0, progress.streak);
    saveProgress();
    updateStreakUI();
  }

  function levelFor(xp) { return Math.floor(xp / 150) + 1; }

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function challengeLabel(key) {
    return { today: "Today's Challenge", unscramble: "Unscramble", missing: "Missing Letter", speed: "Speed Round" }[key] || key;
  }

  /* ---------------------------------------------------------
     XP toast + achievement unlock feedback
     --------------------------------------------------------- */
  var xpToastTimer = null;
  function showXpToast(html) {
    var el = qs("#xp-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "xp-toast";
      el.className = "xp-toast";
      document.body.appendChild(el);
    }
    el.innerHTML = html;
    el.classList.add("is-visible");
    clearTimeout(xpToastTimer);
    xpToastTimer = setTimeout(function () { el.classList.remove("is-visible"); }, 2400);
  }

  function awardXP(amount, label) {
    if (!amount) return;
    progress.totalXp += amount;
    saveProgress();
    updateStatsUI();
    showXpToast('<span class="xp-amt">+' + amount + " XP</span>" + (label ? " &middot; " + label : ""));
  }

  /* ---------------------------------------------------------
     Challenges tracker
     --------------------------------------------------------- */
  function completeChallenge(key, won, xpOverride) {
    if (!isLiveWeek()) return; // Past Challenges are practice-only — never persisted
    if (!(key in progress.done)) return;
    if (progress.done[key]) return;
    progress.done[key] = true;
    progress.gamesPlayed++;
    if (won) { progress.wordsSolved++; progress.wins++; }
    saveProgress();
    registerDailyActivity();
    renderChallenges();
    updateStatsUI();
    var amt = (typeof xpOverride === "number") ? xpOverride : (won ? 100 : 25);
    if (amt > 0) awardXP(amt, challengeLabel(key) + (won ? " complete" : " attempted"));
    checkAchievements();
    maybeSuggestNext(key);
  }

  function completeWeekly(won) {
    if (!isLiveWeek()) return; // Past Challenges are practice-only — never persisted
    if (progress.weeklyDone) return;
    progress.weeklyDone = true;
    progress.gamesPlayed++;
    if (won) { progress.wordsSolved++; progress.wins++; }
    saveProgress();
    registerDailyActivity();
    updateStatsUI();
    if (won) awardXP(150, "Weekly Challenge complete");
    checkAchievements();
  }

  var CHALLENGE_ORDER = ["today", "unscramble", "missing", "speed"];
  function maybeSuggestNext(key) {
    var idx = CHALLENGE_ORDER.indexOf(key);
    var next = CHALLENGE_ORDER[idx + 1];
    if (!next) return;
    setTimeout(function () {
      showXpToast("Next up: <strong>" + challengeLabel(next) + "</strong> &rarr;");
    }, 2600);
  }

  function renderChallenges() {
    var doneCount = 0;
    CHALLENGE_ORDER.forEach(function (key) {
      var chip = qs('.challenge-chip[data-challenge="' + key + '"]');
      var isDone = !!progress.done[key];
      if (isDone) doneCount++;
      if (chip) chip.setAttribute("data-done", String(isDone));
    });
    var doneEl = qs("#challenges-done");
    if (doneEl) doneEl.textContent = doneCount;
  }

  /* ---------------------------------------------------------
     Achievements
     --------------------------------------------------------- */
  var ACHIEVEMENTS = [
    { id: "first-win", icon: "ph-fill ph-medal", name: "First Word", desc: "Solved your first challenge.",
      test: function (p) { return p.wins >= 1; } },
    { id: "streak-3", icon: "ph-fill ph-fire", name: "3-Day Streak", desc: "Play three days running.",
      test: function (p) { return p.streak >= 3; } },
    { id: "streak-7", icon: "ph-fill ph-fire", name: "7-Day Streak", desc: "Play seven days running.",
      test: function (p) { return p.streak >= 7; } },
    { id: "full-house", icon: "ph-fill ph-trophy", name: "Full House", desc: "Complete all 4 challenges in one day.",
      test: function (p) { return p.done.today && p.done.unscramble && p.done.missing && p.done.speed; } },
    { id: "level-5", icon: "ph-fill ph-star", name: "Level 5", desc: "Reach level 5 by earning XP.",
      test: function (p) { return levelFor(p.totalXp) >= 5; } },
    { id: "word-master", icon: "ph-fill ph-books", name: "Word Master", desc: "Solve 20 words across every game.",
      test: function (p) { return p.wordsSolved >= 20; } },
    { id: "speed-solver", icon: "ph-fill ph-lightning", name: "Speed Solver", desc: "Score 5 or more in one Speed Round.",
      test: function (p) { return p.bestSpeedScore >= 5; } }
  ];

  function checkAchievements() {
    var changed = false;
    ACHIEVEMENTS.forEach(function (a) {
      if (progress.achievements.indexOf(a.id) === -1 && a.test(progress)) {
        progress.achievements.push(a.id);
        changed = true;
        setTimeout(function () {
          showXpToast('<i class="ph-fill ph-medal"></i> Achievement unlocked: <strong>' + a.name + "</strong>");
          launchConfetti();
        }, 400);
      }
    });
    if (changed) saveProgress();
    renderAchievements();
  }

  function renderAchievements() {
    var grid = qs("#achv-grid");
    if (!grid) return;
    grid.innerHTML = "";
    ACHIEVEMENTS.forEach(function (a) {
      var unlocked = progress.achievements.indexOf(a.id) !== -1;
      var card = document.createElement("div");
      card.className = "achv-card";
      card.setAttribute("data-unlocked", String(unlocked));
      card.innerHTML =
        '<div class="achv-icon"><i class="' + a.icon + '"></i></div>' +
        '<p class="achv-name">' + a.name + "</p>" +
        '<p class="achv-desc">' + a.desc + "</p>";
      grid.appendChild(card);
    });
  }

  /* ---------------------------------------------------------
     Stat strip (real, local, honest numbers — no fabricated
     global counters)
     --------------------------------------------------------- */
  var statsAnimated = false;
  function combinedStats() {
    var gamesPlayed = progress.gamesPlayed;
    var wordsSolved = progress.wordsSolved;
    var successRate = gamesPlayed ? Math.round((progress.wins / gamesPlayed) * 100) : 0;
    return {
      gamesPlayed: gamesPlayed,
      wordsSolved: wordsSolved,
      successRate: successRate,
      xp: progress.totalXp,
      level: levelFor(progress.totalXp)
    };
  }

  function updateStatsUI() {
    var s = combinedStats();
    setStatValue("stat-games", s.gamesPlayed);
    setStatValue("stat-words", s.wordsSolved);
    setStatValue("stat-success", s.successRate, "%");
    setStatValue("stat-xp", s.xp);
    setStatValue("stat-level", s.level);
    setStatValue("stat-played-modal", s.gamesPlayed);
    setStatValue("stat-winpct-modal", s.successRate, "%");
    setStatValue("stat-streak-modal", progress.streak);
    setStatValue("stat-max-modal", progress.maxStreak);
    renderDist();
  }

  function renderDist() {
    var wrap = qs("#dist-wrap");
    if (!wrap) return;
    var unlocked = progress.achievements.length;
    var total = ACHIEVEMENTS.length;
    var pct = total ? Math.round((unlocked / total) * 100) : 0;
    wrap.innerHTML =
      '<div class="dist-row"><span class="dist-label"><i class="ph-fill ph-medal"></i></span>' +
      '<div class="dist-bar-track"><div class="dist-bar" style="width:' + Math.max(6, pct) + '%">' +
      '<span class="dist-count">' + unlocked + " / " + total + "</span></div></div></div>";
  }

  function updateStreakUI() {
    var el = qs("#streak-val");
    if (el) el.textContent = progress.streak;
  }

  function setStatValue(id, value, suffix) {
    var el = document.getElementById(id);
    if (!el) return;
    el.setAttribute("data-count-target", value);
    if (suffix) el.setAttribute("data-suffix", suffix);
    if (statsAnimated) {
      el.textContent = value + (suffix || "");
    }
  }

  function animateStatEls() {
    qsa(".stat-num[data-count-target]").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count-target"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var start = 0, dur = 900, t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var val = Math.round(start + p * (target - start));
        el.textContent = val + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
    statsAnimated = true;
  }

  /* ---------------------------------------------------------
     Scroll reveal (IntersectionObserver) — hero entrance +
     section-by-section reveals throughout the page.
     --------------------------------------------------------- */
  function initReveal() {
    var targets = qsa("[data-reveal-item],[data-hero-in]");
    if (!("IntersectionObserver" in window) || !targets.length) {
      targets.forEach(function (t) { t.classList.add("is-visible"); });
      animateStatEls();
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
        if (entry.target.id === "stat-strip" || entry.target.closest("#stat-strip")) {
          animateStatEls();
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(function (t) { io.observe(t); });

    var stripObserved = qs("#stat-strip");
    if (stripObserved) {
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animateStatEls(); io2.disconnect(); }
        });
      }, { threshold: 0.3 });
      io2.observe(stripObserved);
    }
  }

  /* ---------------------------------------------------------
     Hero CTAs: smooth-scroll data-scroll-to buttons
     --------------------------------------------------------- */
  var GAME_SECTION_SELECTORS = ["#today-game", "#unscramble-game", "#missing-letter-game", "#speed-round-game", "#weekly-challenge-game"];
  function initCtaScroll() {
    qsa("[data-scroll-to]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var sel = btn.getAttribute("data-scroll-to");
        if (GAME_SECTION_SELECTORS.indexOf(sel) !== -1 && !isLiveWeek()) {
          backToCurrentWeek();
        }
        var target = qs(sel);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  /* ---------------------------------------------------------
     Today / weekly labels
     --------------------------------------------------------- */
  function initLabels() {
    var todayEl = qs("#today-label");
    if (todayEl) {
      todayEl.textContent = "Week of " + weekRangeLabel(CURRENT_WEEK) + " · new set every Monday";
    }
    var weekRangeEl = qs("#week-range-label");
    if (weekRangeEl) {
      weekRangeEl.textContent = "Week of " + weekRangeLabel(CURRENT_WEEK) + " · play all four, keep the streak alive.";
    }
    var weeklyEl = qs("#weekly-label");
    if (weeklyEl) {
      var span = weeklyEl.querySelector("span");
      var w = hardWordForWeek(CURRENT_WEEK);
      var text = progress.weeklyDone
        ? "Weekly Challenge solved — reload the page for another shot."
        : "Weekly Challenge: a " + w.length + "-letter word starting with “" + w[0].toUpperCase() + "” is waiting below.";
      if (span) span.textContent = text;
    }
  }

  /* ---------------------------------------------------------
     Feedback helper shared by the mini-games
     --------------------------------------------------------- */
  function setFeedback(id, text, good) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.classList.remove("is-good", "is-bad");
    if (good === true) el.classList.add("is-good");
    if (good === false) el.classList.add("is-bad");
  }

  /* ============================================================
     Mini-game 2: Unscramble
     ============================================================ */
  var usWord = "";
  var usLetters = [];
  var usSelected = null;
  var usSwaps = 0;
  var MAX_SWAPS = 16;

  function usIsLocked() { return isLiveWeek() && progress.done.unscramble; }

  function setupUnscramble() {
    usWord = weekWord(1);
    usSwaps = 0;
    usSelected = null;
    var solvedAlready = usIsLocked();
    usLetters = solvedAlready ? usWord.split("") : shuffle(usWord.split(""));
    if (!solvedAlready) {
      var tries = 0;
      while (usLetters.join("") === usWord && tries < 5) { usLetters = shuffle(usLetters); tries++; }
    }
    renderUnscramble(solvedAlready);
    setFeedback("unscramble-feedback", solvedAlready
      ? "Solved! The word was “" + usWord.toUpperCase() + "”."
      : "Drag a tile onto another to swap them.", solvedAlready ? true : null);
  }

  function initUnscramble() {
    var wrap = qs("#unscramble-tiles");
    if (!wrap) return;
    setupUnscramble();
    qs("#unscramble-shuffle").addEventListener("click", function (btn) {
      if (usIsLocked()) return;
      this.classList.add("is-spinning");
      var self = this;
      setTimeout(function () { self.classList.remove("is-spinning"); }, 420);
      usLetters = shuffle(usLetters);
      usSelected = null;
      renderUnscramble(false);
    });
    qs("#unscramble-reset").addEventListener("click", function () {
      if (usIsLocked()) return;
      usLetters = shuffle(usWord.split(""));
      usSwaps = 0;
      usSelected = null;
      setFeedback("unscramble-feedback", "Reset. Tap a tile, then tap another to swap them.", null);
      renderUnscramble(false);
    });
    qs("#unscramble-submit").addEventListener("click", function () {
      if (usIsLocked()) return;
      checkUnscramble();
    });
  }

  function renderUnscramble(solved) {
    var wrap = qs("#unscramble-tiles");
    wrap.innerHTML = "";
    usLetters.forEach(function (ch, i) {
      var t = document.createElement("button");
      t.type = "button";
      t.className = "us-tile" + (solved ? " is-correct" : "");
      t.textContent = ch.toUpperCase();
      t.setAttribute("data-i", i);
      t.disabled = solved;
      if (!solved) {
        initDrag(t, {
          onOver: function (target) { highlightUsTarget(target); },
          onDrop: function (target) { handleUsDrop(i, target); },
          onTap: function () { onUnscrambleTap(i, t); }
        });
      }
      wrap.appendChild(t);
    });
    var clue = qs("#unscramble-clue");
    if (clue) {
      clue.textContent = "A " + usWord.length + "-letter word · starts with “" + usWord[0].toUpperCase() + "”";
    }
    if (solved) setFeedback("unscramble-feedback", "Solved! The word was “" + usWord.toUpperCase() + "”.", true);
  }

  function highlightUsTarget(target) {
    qsa(".us-tile.is-target").forEach(function (t) { t.classList.remove("is-target"); });
    var tile = target && target.closest ? target.closest(".us-tile") : null;
    if (tile) tile.classList.add("is-target");
  }

  function handleUsDrop(sourceIndex, target) {
    qsa(".us-tile.is-target").forEach(function (t) { t.classList.remove("is-target"); });
    var targetTile = target && target.closest ? target.closest(".us-tile") : null;
    if (!targetTile) return;
    var targetIndex = parseInt(targetTile.getAttribute("data-i"), 10);
    if (targetIndex === sourceIndex) return;
    swapUs(sourceIndex, targetIndex);
  }

  function onUnscrambleTap(i, btn) {
    if (usIsLocked()) return;
    if (usSelected === null) {
      usSelected = i;
      btn.classList.add("is-selected");
      return;
    }
    if (usSelected === i) {
      btn.classList.remove("is-selected");
      usSelected = null;
      return;
    }
    swapUs(usSelected, i);
    usSelected = null;
  }

  function swapUs(a, b) {
    var tmp = usLetters[a]; usLetters[a] = usLetters[b]; usLetters[b] = tmp;
    usSwaps++;
    renderUnscramble(false);
    checkUnscramble();
  }

  function checkUnscramble() {
    var joined = usLetters.join("");
    if (joined === usWord) {
      renderUnscramble(true);
      if (!isLiveWeek()) setFeedback("unscramble-feedback", "Solved! The word was “" + usWord.toUpperCase() + "”. (Archived challenge — practice only.)", true);
      completeChallenge("unscramble", true);
    } else if (usSwaps >= MAX_SWAPS) {
      qsa("#unscramble-tiles .us-tile").forEach(function (t) { t.disabled = true; });
      setFeedback("unscramble-feedback", "Out of swaps — the word was “" + usWord.toUpperCase() + "”.", false);
      completeChallenge("unscramble", false);
    } else {
      setFeedback("unscramble-feedback", "Keep going — " + (MAX_SWAPS - usSwaps) + " swaps left.", null);
    }
  }

  /* ============================================================
     Mini-game 3: Missing Letter
     ============================================================ */
  var mlWord = "";
  var mlIndex = 0;
  var mlTriesLeft = 3;

  function setupMissing() {
    mlWord = weekWord(2);
    mlIndex = Math.max(1, Math.min(mlWord.length - 2, Math.floor(mlWord.length / 2)));
    mlTriesLeft = 3;
    renderMissing();
    var input = qs("#missing-input");
    var btn = qs("#missing-submit");
    var solved = isLiveWeek() && progress.done.missing;
    input.value = "";
    input.disabled = solved;
    btn.disabled = solved;
    if (solved) {
      revealMissing(true);
      setFeedback("missing-feedback", "Correct! The word was “" + mlWord.toUpperCase() + "”.", true);
    } else {
      setFeedback("missing-feedback", "You have 3 tries.", null);
    }
  }

  function initMissingLetter() {
    var wrap = qs("#missing-tiles");
    if (!wrap) return;
    setupMissing();
    var input = qs("#missing-input");
    var btn = qs("#missing-submit");
    btn.addEventListener("click", submitMissing);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") submitMissing(); });
    input.addEventListener("input", function () {
      input.value = input.value.replace(/[^a-zA-Z]/g, "").slice(0, 1);
    });
  }

  function renderMissing() {
    var wrap = qs("#missing-tiles");
    wrap.innerHTML = "";
    mlWord.split("").forEach(function (ch, i) {
      var t = document.createElement("div");
      t.className = "ml-tile" + (i === mlIndex ? " is-blank" : "");
      t.textContent = i === mlIndex ? "" : ch.toUpperCase();
      wrap.appendChild(t);
    });
  }

  function revealMissing(correct) {
    var tile = qsa("#missing-tiles .ml-tile")[mlIndex];
    if (!tile) return;
    tile.textContent = mlWord[mlIndex].toUpperCase();
    tile.setAttribute("data-state", correct ? "correct" : "incorrect");
  }

  function submitMissing() {
    if (isLiveWeek() && progress.done.missing) return;
    var input = qs("#missing-input");
    var val = (input.value || "").toLowerCase();
    if (!val) return;
    var tile = qsa("#missing-tiles .ml-tile")[mlIndex];
    if (val === mlWord[mlIndex]) {
      tile.textContent = val.toUpperCase();
      tile.setAttribute("data-state", "correct");
      setFeedback("missing-feedback", "Correct! The word was “" + mlWord.toUpperCase() + "”." + (isLiveWeek() ? "" : " (Archived challenge — practice only.)"), true);
      input.disabled = true;
      qs("#missing-submit").disabled = true;
      completeChallenge("missing", true);
    } else {
      mlTriesLeft--;
      tile.setAttribute("data-state", "incorrect");
      (function (t) { setTimeout(function () { t.removeAttribute("data-state"); }, 500); })(tile);
      if (mlTriesLeft <= 0) {
        revealMissing(false);
        setFeedback("missing-feedback", "Out of tries — it was “" + mlWord.toUpperCase() + "”.", false);
        input.disabled = true;
        qs("#missing-submit").disabled = true;
        completeChallenge("missing", false);
      } else {
        setFeedback("missing-feedback", mlTriesLeft + (mlTriesLeft === 1 ? " try" : " tries") + " left.", false);
      }
    }
    input.value = "";
  }

  /* ============================================================
     Mini-game 4: Speed round
     ============================================================ */
  var SPEED_DURATION = 60;
  var speedPool = [];
  var speedPoolIdx = 0;
  var speedWord = null;
  var speedIndex = null;
  var speedTimerId = null;
  var speedTimeLeft = SPEED_DURATION;
  var speedScore = 0;

  function initSpeedRound() {
    var wrap = qs("#speed-tiles");
    if (!wrap) return;
    qs("#speed-start").addEventListener("click", startSpeed);
    var input = qs("#speed-input");
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") submitSpeed(); });
    input.addEventListener("input", function () {
      input.value = input.value.replace(/[^a-zA-Z]/g, "").slice(0, 1);
      if (input.value) submitSpeed();
    });
  }

  function resetSpeedRound() {
    if (speedTimerId) { clearInterval(speedTimerId); speedTimerId = null; }
    var wrap = qs("#speed-tiles");
    if (!wrap) return;
    speedScore = 0;
    speedTimeLeft = SPEED_DURATION;
    wrap.innerHTML = "";
    var input = qs("#speed-input");
    input.disabled = true;
    input.value = "";
    qs("#speed-start").textContent = "Challenge Yourself";
    qs("#speed-score").textContent = "0";
    qs("#speed-timer").textContent = String(SPEED_DURATION);
    qs("#speed-timer").classList.remove("is-low");
    setFeedback("speed-feedback", "Press start when you're ready — the clock starts immediately.", null);
  }

  function startSpeed() {
    if (speedTimerId) clearInterval(speedTimerId);
    speedPool = [3, 4, 5, 6, 7, 8, 9, 10].map(function (o) { return weekWord(o); });
    speedScore = 0;
    speedTimeLeft = SPEED_DURATION;
    speedPoolIdx = 0;
    qs("#speed-score").textContent = "0";
    qs("#speed-timer").textContent = String(speedTimeLeft);
    qs("#speed-timer").classList.remove("is-low");
    var input = qs("#speed-input");
    input.disabled = false;
    input.value = "";
    input.focus();
    qs("#speed-start").textContent = "Restart";
    setFeedback("speed-feedback", "Go! Type the missing letter for each word.", null);
    nextSpeedWord();
    speedTimerId = setInterval(tickSpeed, 1000);
  }

  function tickSpeed() {
    speedTimeLeft--;
    var t = qs("#speed-timer");
    t.textContent = String(Math.max(0, speedTimeLeft));
    t.classList.toggle("is-low", speedTimeLeft <= 10);
    if (speedTimeLeft <= 0) endSpeed();
  }

  function nextSpeedWord() {
    speedWord = speedPool[speedPoolIdx % speedPool.length];
    speedPoolIdx++;
    speedIndex = Math.floor(Math.random() * speedWord.length);
    var wrap = qs("#speed-tiles");
    wrap.innerHTML = "";
    speedWord.split("").forEach(function (ch, i) {
      var t = document.createElement("div");
      t.className = "ml-tile" + (i === speedIndex ? " is-blank" : "");
      t.textContent = i === speedIndex ? "" : ch.toUpperCase();
      wrap.appendChild(t);
    });
  }

  function submitSpeed() {
    if (!speedTimerId) return;
    var input = qs("#speed-input");
    var val = (input.value || "").toLowerCase();
    input.value = "";
    if (!val || !speedWord) return;
    if (val === speedWord[speedIndex]) {
      speedScore++;
      qs("#speed-score").textContent = String(speedScore);
      if (isLiveWeek()) {
        progress.totalXp += 20;
        saveProgress();
        updateStatsUI();
      }
    }
    nextSpeedWord();
  }

  function endSpeed() {
    clearInterval(speedTimerId);
    speedTimerId = null;
    var input = qs("#speed-input");
    input.disabled = true;
    qs("#speed-start").textContent = "Challenge Yourself Again";
    setFeedback("speed-feedback", "Time! You solved " + speedScore + (speedScore === 1 ? " word." : " words.") + (isLiveWeek() ? "" : " (Archived challenge — practice only.)"), speedScore > 0);
    if (isLiveWeek()) {
      progress.bestSpeedScore = Math.max(progress.bestSpeedScore || 0, speedScore);
      saveProgress();
      completeChallenge("speed", speedScore > 0, 0);
      checkAchievements();
    }
  }

  /* ============================================================
     Shared drag engine — Pointer Events, works for mouse, touch
     and pen alike. A tap (no meaningful movement) fires onTap;
     a real drag fires onStart/onOver/onDrop. Used by both the
     Today's Challenge board and the Unscramble tiles.
     ============================================================ */
  function pointFromEvent(e) {
    return { x: e.clientX, y: e.clientY };
  }

  function initDrag(el, handlers) {
    var sx, sy, dragging;
    function move(e) {
      var p = pointFromEvent(e);
      var dx = p.x - sx, dy = p.y - sy;
      if (!dragging && Math.hypot(dx, dy) > 6) {
        dragging = true;
        el.classList.add("is-dragging");
        el.setPointerCapture && el.releasePointerCapture && (function(){}());
        handlers.onStart && handlers.onStart();
      }
      if (dragging) {
        el.style.transform = "translate(" + dx + "px," + dy + "px) rotate(0deg) scale(1.06)";
        el.style.pointerEvents = "none";
        var target = document.elementFromPoint(p.x, p.y);
        el.style.pointerEvents = "";
        handlers.onOver && handlers.onOver(target);
        e.preventDefault();
      }
    }
    function up(e) {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      el.classList.remove("is-dragging");
      var wasDragging = dragging;
      var target = null;
      if (wasDragging) {
        var p = pointFromEvent(e);
        el.style.pointerEvents = "none";
        target = document.elementFromPoint(p.x, p.y);
        el.style.pointerEvents = "";
      }
      el.style.transform = "";
      dragging = false;
      if (wasDragging) {
        handlers.onDrop && handlers.onDrop(target);
      } else {
        handlers.onTap && handlers.onTap();
      }
    }
    el.addEventListener("pointerdown", function (e) {
      if (el.disabled) return;
      if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
      var p = pointFromEvent(e);
      sx = p.x; sy = p.y; dragging = false;
      document.addEventListener("pointermove", move, { passive: false });
      document.addEventListener("pointerup", up);
      document.addEventListener("pointercancel", up);
    });
  }

  /* ============================================================
     Mini-game 1: Today's Challenge — drag Scrabble tiles from
     the tray into the answer row. Real drag-and-drop, plus a
     tap-to-place fallback for reliability.
     ============================================================ */
  var todayWord = "";
  var todayTiles = [];
  var todayTray = [];
  var todaySlots = [];
  var todayLocked = false;

  function tileById(id) {
    for (var i = 0; i < todayTiles.length; i++) if (todayTiles[i].id === id) return todayTiles[i];
    return null;
  }

  function setupTodayGame() {
    todayWord = weekWord(0).toUpperCase();
    todayTiles = todayWord.split("").map(function (ch, i) { return { id: "tt" + i, letter: ch }; });
    todayLocked = isLiveWeek() && !!progress.done.today;
    todaySlots = todayLocked ? todayTiles.map(function (t) { return t.id; }) : new Array(todayTiles.length).fill(null);
    todayTray = todayLocked ? [] : shuffle(todayTiles.map(function (t) { return t.id; }));
    renderToday();
    setFeedback("drag-feedback", todayLocked
      ? "CORRECT! 🎉 The word was “" + todayWord + "”."
      : "Fill all five slots, then submit your answer.", todayLocked ? true : null);
  }

  function initTodayGame() {
    var answerRow = qs("#answer-row");
    if (!answerRow) return;
    setupTodayGame();

    qs("#drag-shuffle").addEventListener("click", function () {
      if (todayLocked) return;
      this.classList.add("is-spinning");
      var self = this;
      setTimeout(function () { self.classList.remove("is-spinning"); }, 420);
      todayTray = shuffle(todayTray);
      renderToday();
    });
    qs("#drag-clear").addEventListener("click", function () {
      if (todayLocked) return;
      todaySlots.forEach(function (id) { if (id) todayTray.push(id); });
      todaySlots = new Array(todayTiles.length).fill(null);
      renderToday();
    });
    qs("#drag-submit").addEventListener("click", submitToday);
  }

  function renderToday() {
    var answerRow = qs("#answer-row");
    var trayRow = qs("#tray-row");
    answerRow.innerHTML = "";
    todaySlots.forEach(function (tileId, i) {
      var slot = document.createElement("div");
      slot.className = "slot";
      slot.setAttribute("data-slot-i", i);
      if (tileId) slot.appendChild(buildDragTile(tileById(tileId), "slot", i));
      answerRow.appendChild(slot);
    });
    trayRow.innerHTML = "";
    todayTray.forEach(function (id) {
      trayRow.appendChild(buildDragTile(tileById(id), "tray"));
    });
    var submit = qs("#drag-submit");
    submit.disabled = todayLocked || todaySlots.some(function (s) { return !s; });
    if (todayLocked) submit.textContent = "Solved";
  }

  function buildDragTile(t, source, slotIndex) {
    var el = document.createElement("button");
    el.type = "button";
    el.className = "tile-drag" + (todayLocked ? " is-correct" : "");
    el.textContent = t.letter;
    el.disabled = todayLocked;
    if (!todayLocked) {
      initDrag(el, {
        onOver: function (target) { highlightSlot(target); },
        onDrop: function (target) { handleTodayDrop(t.id, source, slotIndex, target); },
        onTap: function () { handleTodayTap(t.id, source, slotIndex); }
      });
    }
    return el;
  }

  function highlightSlot(target) {
    qsa(".slot.is-target").forEach(function (s) { s.classList.remove("is-target"); });
    var slotEl = target && target.closest ? target.closest(".slot") : null;
    if (slotEl) slotEl.classList.add("is-target");
  }

  function placeInSlot(tileId, source, sourceSlotIndex, targetIndex) {
    var displaced = todaySlots[targetIndex];
    if (displaced === tileId) return;
    if (source === "tray") {
      todayTray = todayTray.filter(function (id) { return id !== tileId; });
      if (displaced) todayTray.push(displaced);
      todaySlots[targetIndex] = tileId;
    } else {
      if (sourceSlotIndex === targetIndex) return;
      todaySlots[sourceSlotIndex] = displaced || null;
      todaySlots[targetIndex] = tileId;
    }
  }

  function handleTodayDrop(tileId, source, sourceSlotIndex, target) {
    qsa(".slot.is-target").forEach(function (s) { s.classList.remove("is-target"); });
    var targetSlot = target && target.closest ? target.closest(".slot") : null;
    if (targetSlot) {
      placeInSlot(tileId, source, sourceSlotIndex, parseInt(targetSlot.getAttribute("data-slot-i"), 10));
    } else if (source === "slot") {
      todaySlots[sourceSlotIndex] = null;
      if (todayTray.indexOf(tileId) === -1) todayTray.push(tileId);
    }
    renderToday();
  }

  function handleTodayTap(tileId, source, sourceSlotIndex) {
    if (todayLocked) return;
    if (source === "tray") {
      var emptyIndex = todaySlots.indexOf(null);
      if (emptyIndex === -1) { setFeedback("drag-feedback", "All slots are full — tap a placed tile to return it.", null); return; }
      placeInSlot(tileId, "tray", null, emptyIndex);
    } else {
      todaySlots[sourceSlotIndex] = null;
      todayTray.push(tileId);
    }
    renderToday();
  }

  function submitToday() {
    if (todaySlots.some(function (s) { return !s; })) return;
    var guess = todaySlots.map(function (id) { return tileById(id).letter; }).join("");
    if (guess === todayWord) {
      todayLocked = true;
      renderToday();
      setFeedback("drag-feedback", "CORRECT! 🎉 The word was “" + todayWord + "”." + (isLiveWeek() ? "" : " (Archived challenge — practice only.)"), true);
      completeChallenge("today", true, 100);
      launchConfetti();
    } else {
      var row = qs("#answer-row");
      row.classList.remove("is-shaking");
      void row.offsetWidth;
      row.classList.add("is-shaking");
      setFeedback("drag-feedback", "Not quite — rearrange the letters and try again.", false);
    }
  }

  /* ============================================================
     Show more / show less on the long reference sections
     ============================================================ */
  function initShowMore() {
    qsa(".sec").forEach(function (sec) {
      var children = Array.prototype.slice.call(sec.children);
      var firstProseIdx = children.findIndex(function (c) { return c.classList.contains("prose"); });
      if (firstProseIdx === -1) return;
      var rest = children.slice(firstProseIdx + 1);
      if (!rest.length) return;

      var wrap = document.createElement("div");
      wrap.className = "expandable";
      wrap.setAttribute("data-collapsed", "true");
      rest.forEach(function (node) { wrap.appendChild(node); });

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "show-more-btn";
      btn.setAttribute("aria-expanded", "false");
      btn.innerHTML = '<span class="label">Show more</span><span class="chev" aria-hidden="true">&#9660;</span>';

      sec.appendChild(wrap);
      sec.appendChild(btn);

      btn.addEventListener("click", function () {
        var collapsed = wrap.getAttribute("data-collapsed") === "true";
        wrap.setAttribute("data-collapsed", collapsed ? "false" : "true");
        btn.setAttribute("aria-expanded", collapsed ? "true" : "false");
        btn.querySelector(".label").textContent = collapsed ? "Show less" : "Show more";
        if (collapsed) {
          setTimeout(function () { wrap.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 80);
        }
      });
    });
  }

  /* ============================================================
     Reference-content interactivity: shuffle word-tile grids, fill
     the inline finder from a clicked word chip, the Wordle opener
     demo board, draggable anagram tiles, and a small typewriter-
     style "searching…" pattern cycler.
     ============================================================ */
  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function initWordShuffle() {
    qsa("[data-shuffle]").forEach(function (btn) {
      var list = document.getElementById(btn.getAttribute("data-shuffle"));
      if (!list) return;
      btn.addEventListener("click", function () {
        var items = shuffle(qsa("li", list));
        items.forEach(function (li) { list.appendChild(li); });
        var svg = btn.querySelector("svg");
        if (svg) {
          btn.classList.remove("is-spinning");
          void btn.offsetWidth;
          btn.classList.add("is-spinning");
        }
      });
    });
  }

  function initWordChipFill() {
    var target = qs("#finder-input-2");
    qsa(".word-chip[data-fill]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        chip.classList.remove("is-picked");
        void chip.offsetWidth;
        chip.classList.add("is-picked");
        if (!target) return;
        target.value = chip.getAttribute("data-fill");
        target.focus();
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  function flipTiles(tiles, applyState, stagger) {
    tiles.forEach(function (tile, i) {
      var delay = prefersReducedMotion() ? 0 : (stagger || 90) * i;
      setTimeout(function () {
        if (!prefersReducedMotion()) {
          tile.classList.remove("is-flipping");
          void tile.offsetWidth;
          tile.classList.add("is-flipping");
        }
        setTimeout(function () { applyState(tile, i); }, prefersReducedMotion() ? 0 : 190);
      }, delay);
    });
  }

  function initWordleDemo() {
    var board = qs("#wordle-board");
    var openers = qs("#wordle-openers");
    if (!board || !openers) return;
    var tiles = qsa(".letter", board);

    qsa(".opener-chip", openers).forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (chip.classList.contains("is-active")) return;
        qsa(".opener-chip", openers).forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        var word = (chip.getAttribute("data-word") || "").split("");
        var colors = (chip.getAttribute("data-colors") || "").split(",");
        flipTiles(tiles, function (tile, i) {
          tile.textContent = word[i] || "";
          tile.classList.remove("correct", "wrong-position", "incorrect");
          if (colors[i]) tile.classList.add(colors[i]);
        }, 80);
      });
    });

    if (!("IntersectionObserver" in window)) return;
    var revealed = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || revealed) return;
        revealed = true;
        io.disconnect();
        if (prefersReducedMotion()) return;
        tiles.forEach(function (tile) { tile.classList.add("is-flipping"); });
        tiles.forEach(function (tile, i) {
          setTimeout(function () {
            tile.classList.remove("is-flipping");
            void tile.offsetWidth;
            tile.classList.add("is-flipping");
          }, i * 110);
        });
      });
    }, { threshold: 0.5 });
    io.observe(board);
  }

  /* ---------------------------------------------------------
     Draggable anagram tiles (with-letters section) — same
     pointer-based drag engine as the Unscramble tiles, with a
     tap-to-swap fallback so dragging is never required.
     --------------------------------------------------------- */
  function initAnagramDrag() {
    var wrap = qs("#anagram-tiles");
    if (!wrap) return;
    var tiles = qsa(".letter", wrap);
    var selected = null;

    function highlightTarget(target) {
      qsa(".letter.is-drag-target", wrap).forEach(function (t) { t.classList.remove("is-drag-target"); });
      var tile = target && target.closest ? target.closest(".letter") : null;
      if (tile && wrap.contains(tile)) tile.classList.add("is-drag-target");
    }

    function clearSelection() {
      if (selected) selected.classList.remove("is-drag-selected");
      selected = null;
    }

    function swap(a, b) {
      if (a === b) return;
      var A = tiles[a], B = tiles[b];
      var tmp = A.textContent;
      A.textContent = B.textContent;
      B.textContent = tmp;
      if (!prefersReducedMotion()) {
        [A, B].forEach(function (t) {
          t.classList.remove("is-flipping");
          void t.offsetWidth;
          t.classList.add("is-flipping");
        });
      }
    }

    tiles.forEach(function (tile, i) {
      tile.classList.add("is-draggable");
      initDrag(tile, {
        onOver: function (target) { highlightTarget(target); },
        onDrop: function (target) {
          qsa(".letter.is-drag-target", wrap).forEach(function (t) { t.classList.remove("is-drag-target"); });
          var targetTile = target && target.closest ? target.closest(".letter") : null;
          if (!targetTile || !wrap.contains(targetTile)) return;
          var j = tiles.indexOf(targetTile);
          if (j !== -1) swap(i, j);
        },
        onTap: function () {
          if (!selected) {
            selected = tile;
            tile.classList.add("is-drag-selected");
            return;
          }
          if (selected === tile) { clearSelection(); return; }
          var a = tiles.indexOf(selected), b = i;
          clearSelection();
          swap(a, b);
        }
      });
    });
  }

  /* ---------------------------------------------------------
     Pattern cycler — a small "Searching…" typewriter-style demo
     that builds a pattern, then flips through matching words.
     Decorative only; paused under reduced motion.
     --------------------------------------------------------- */
  function initPatternCycler() {
    var row = qs("#pattern-cycler-row");
    if (!row || prefersReducedMotion()) return;
    var CYCLES = [
      { pattern: "c?a?e", words: ["crane", "crate", "crave"] },
      { pattern: "t????", words: ["today", "toxic", "tours"] },
      { pattern: "?l??t", words: ["plant", "blast", "float"] }
    ];
    var cells = [];
    for (var i = 0; i < 5; i++) {
      var span = document.createElement("span");
      span.className = "letter wildcard";
      span.textContent = "?";
      row.appendChild(span);
      cells.push(span);
    }

    var cycleIndex = 0, wordIndex = 0, current = null;
    var timer = null;
    var paused = false;

    function setCells(text, isWildcardMask) {
      var chars = text.split("");
      cells.forEach(function (cell, i) {
        var ch = chars[i] || "?";
        var isBlank = ch === "?";
        setTimeout(function () {
          cell.classList.remove("is-cycling");
          void cell.offsetWidth;
          cell.classList.add("is-cycling");
          setTimeout(function () {
            cell.textContent = ch;
            cell.classList.toggle("wildcard", isBlank);
            cell.classList.toggle("correct", !isBlank && !isWildcardMask);
          }, 170);
        }, i * 70);
      });
    }

    function step() {
      if (paused) { timer = setTimeout(step, 400); return; }
      var cycle = CYCLES[cycleIndex];
      if (current === null) {
        setCells(cycle.pattern, true);
        current = "pattern";
        timer = setTimeout(step, 900);
        return;
      }
      if (wordIndex < cycle.words.length) {
        setCells(cycle.words[wordIndex], false);
        wordIndex++;
        current = "word";
        timer = setTimeout(step, 1500);
        return;
      }
      wordIndex = 0;
      current = null;
      cycleIndex = (cycleIndex + 1) % CYCLES.length;
      timer = setTimeout(step, 500);
    }

    var wrapEl = qs("#pattern-cycler");
    if (wrapEl && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { paused = !entry.isIntersecting; });
      }, { threshold: 0.2 });
      io.observe(wrapEl);
    }
    document.addEventListener("visibilitychange", function () {
      paused = document.hidden || paused;
    });

    step();
  }

  /* ---------------------------------------------------------
     Scroll-triggered motion for the reference-content sections:
     headings ease in, card/tile grids stagger, supporting
     visuals drift slightly on scroll. GSAP + ScrollTrigger only;
     content is fully visible and static without it.
     --------------------------------------------------------- */
  function initContentMotion() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    if (prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);

    function revealOnce(target, fromVars, triggerEl) {
      var els = target && target.length !== undefined ? target : [target];
      if (!els.length) return;
      gsap.from(els, Object.assign({
        scrollTrigger: { trigger: triggerEl || els[0], start: "top 88%", once: true },
        onComplete: function () { gsap.set(els, { clearProps: "all" }); }
      }, fromVars));
    }

    qsa(".content .sec-head").forEach(function (h) {
      revealOnce(h, { opacity: 0, y: 18, duration: .55, ease: "power2.out" });
    });

    qsa(".content .how-grid, .content .icon-cards").forEach(function (grid) {
      revealOnce(grid.children, { opacity: 0, y: 20, duration: .45, stagger: .08, ease: "power2.out" }, grid);
    });

    qsa(".content .word-tiles").forEach(function (list) {
      revealOnce(list.children, { opacity: 0, y: 10, scale: .85, duration: .32, stagger: .035, ease: "back.out(1.8)" }, list);
    });

    qsa(".content .tile-row:not(.anatomy-row)").forEach(function (row) {
      revealOnce(row.children, { opacity: 0, y: 14, duration: .4, stagger: .07, ease: "back.out(1.7)" }, row);
    });

    qsa([
      ".content .mini-card", ".content .demo-card", ".content .mock-finder",
      ".content .mock-narrow", ".content .wordle-demo", ".content .letter-strip-wrap",
      ".content .chip-panel", ".content .table-scroll", ".content .anatomy-card"
    ].join(",")).forEach(function (el) {
      revealOnce(el, { opacity: 0, y: 18, duration: .5, ease: "power2.out" });
    });

    qsa(".content .split-aside").forEach(function (aside) {
      gsap.to(aside, {
        y: -20, ease: "none",
        scrollTrigger: { trigger: aside, start: "top bottom", end: "bottom top", scrub: .6 }
      });
    });
  }

  /* ============================================================
     Mini-game 5: Weekly Challenge — a tougher word, missing-
     letter mechanic, resettable once a week for bonus XP.
     ============================================================ */
  var wkWord = "";
  var wkIndex = 0;
  var wkTriesLeft = 3;

  function setupWeeklyChallenge() {
    wkWord = hardWordForWeek();
    wkIndex = Math.max(1, Math.min(wkWord.length - 2, Math.floor(wkWord.length / 2)));
    wkTriesLeft = 3;
    renderWeekly();
    var input = qs("#weekly-input");
    var btn = qs("#weekly-submit");
    var solved = isLiveWeek() && progress.weeklyDone;
    input.value = "";
    input.disabled = solved;
    btn.disabled = solved;
    btn.textContent = solved ? "Solved!" : "Take the Weekly Challenge";
    if (solved) {
      revealWeekly(true);
      setFeedback("weekly-feedback", "Correct! The word was “" + wkWord.toUpperCase() + "”. +150 XP banked.", true);
    } else {
      setFeedback("weekly-feedback", "You have 3 tries. Solve it for +150 XP.", null);
    }
  }

  function initWeeklyChallenge() {
    var wrap = qs("#weekly-tiles");
    if (!wrap) return;
    setupWeeklyChallenge();
    var input = qs("#weekly-input");
    var btn = qs("#weekly-submit");
    btn.addEventListener("click", submitWeekly);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") submitWeekly(); });
    input.addEventListener("input", function () {
      input.value = input.value.replace(/[^a-zA-Z]/g, "").slice(0, 1);
    });
  }

  function renderWeekly() {
    var wrap = qs("#weekly-tiles");
    wrap.innerHTML = "";
    wkWord.split("").forEach(function (ch, i) {
      var t = document.createElement("div");
      t.className = "ml-tile" + (i === wkIndex ? " is-blank" : "");
      t.textContent = i === wkIndex ? "" : ch.toUpperCase();
      wrap.appendChild(t);
    });
  }

  function revealWeekly(correct) {
    var tile = qsa("#weekly-tiles .ml-tile")[wkIndex];
    if (!tile) return;
    tile.textContent = wkWord[wkIndex].toUpperCase();
    tile.setAttribute("data-state", correct ? "correct" : "incorrect");
  }

  function submitWeekly() {
    if (isLiveWeek() && progress.weeklyDone) return;
    var input = qs("#weekly-input");
    var val = (input.value || "").toLowerCase();
    if (!val) return;
    var tile = qsa("#weekly-tiles .ml-tile")[wkIndex];
    if (val === wkWord[wkIndex]) {
      tile.textContent = val.toUpperCase();
      tile.setAttribute("data-state", "correct");
      setFeedback("weekly-feedback", "Correct! The word was “" + wkWord.toUpperCase() + "”." + (isLiveWeek() ? " +150 XP banked." : " (Archived challenge — practice only.)"), true);
      input.disabled = true;
      qs("#weekly-submit").disabled = true;
      qs("#weekly-submit").textContent = "Solved!";
      completeWeekly(true);
      launchConfetti();
    } else {
      wkTriesLeft--;
      tile.setAttribute("data-state", "incorrect");
      (function (t) { setTimeout(function () { t.removeAttribute("data-state"); }, 500); })(tile);
      if (wkTriesLeft <= 0) {
        revealWeekly(false);
        setFeedback("weekly-feedback", "Out of tries — it was “" + wkWord.toUpperCase() + "”. Back next week.", false);
        input.disabled = true;
        qs("#weekly-submit").disabled = true;
        completeWeekly(false);
      } else {
        setFeedback("weekly-feedback", wkTriesLeft + (wkTriesLeft === 1 ? " try" : " tries") + " left.", false);
      }
    }
    input.value = "";
  }

  /* ============================================================
     Week switching — reloads every mini-game's word set for a
     given week index. Used to jump back to the live week or to
     drop into a Past Challenge for practice.
     ============================================================ */
  function loadWeek(wIndex) {
    viewingWeek = wIndex;
    setupTodayGame();
    setupUnscramble();
    setupMissing();
    resetSpeedRound();
    setupWeeklyChallenge();
    updateArchiveBar();
  }

  function backToCurrentWeek() {
    if (isLiveWeek()) return;
    loadWeek(CURRENT_WEEK);
  }

  function updateArchiveBar() {
    var bar = qs("#archive-bar");
    if (!bar) return;
    if (isLiveWeek()) { bar.hidden = true; return; }
    bar.hidden = false;
    var textEl = qs("#archive-bar-text");
    if (textEl) textEl.textContent = "Replaying archived challenges — Week of " + weekRangeLabel(viewingWeek) + ". Results here aren't saved.";
  }

  function initArchiveBar() {
    var backBtn = qs("#archive-bar-back");
    if (backBtn) backBtn.addEventListener("click", backToCurrentWeek);
  }

  /* ============================================================
     Past Challenges — an archive of previous weeks. Picking a
     challenge from a past week loads that week's words into the
     matching mini-game and scrolls to it; solving it there is
     practice only (see isLiveWeek() gates above).
     ============================================================ */
  var PAST_WEEKS_COUNT = 8;
  var PAST_CHALLENGE_TARGETS = [
    { label: "Today's Challenge", target: "#today-game" },
    { label: "Unscramble", target: "#unscramble-game" },
    { label: "Missing Letter", target: "#missing-letter-game" },
    { label: "Speed Round", target: "#speed-round-game" },
    { label: "Weekly Challenge", target: "#weekly-challenge-game" }
  ];

  function buildPastWeekRow(wIndex, container) {
    var row = document.createElement("div");
    row.className = "past-week-row";

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "past-week-toggle";
    toggle.innerHTML =
      '<span class="past-week-range">Week of ' + weekRangeLabel(wIndex) + "</span>" +
      '<i class="ph-bold ph-caret-down" aria-hidden="true"></i>';

    var body = document.createElement("div");
    body.className = "past-week-body";
    body.hidden = true;

    PAST_CHALLENGE_TARGETS.forEach(function (c) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "past-week-chip";
      chip.textContent = c.label;
      chip.addEventListener("click", function () {
        closeAllModals();
        loadWeek(wIndex);
        var target = qs(c.target);
        if (target) setTimeout(function () { target.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
      });
      body.appendChild(chip);
    });

    toggle.addEventListener("click", function () {
      var willOpen = body.hidden;
      qsa(".past-week-body", container).forEach(function (b) { b.hidden = true; });
      qsa(".past-week-toggle", container).forEach(function (b) { b.classList.remove("is-open"); });
      body.hidden = !willOpen;
      toggle.classList.toggle("is-open", willOpen);
    });

    row.appendChild(toggle);
    row.appendChild(body);
    return row;
  }

  function renderPastWeeks() {
    var wrap = qs("#past-weeks-list");
    if (!wrap) return;
    wrap.innerHTML = "";
    for (var i = 1; i <= PAST_WEEKS_COUNT; i++) {
      var wIndex = CURRENT_WEEK - i;
      if (wIndex < 0) break;
      wrap.appendChild(buildPastWeekRow(wIndex, wrap));
    }
    if (!wrap.children.length) {
      wrap.innerHTML = '<p class="past-week-empty">No past weeks yet — check back after this week ends.</p>';
    }
  }

  function initPastChallenges() {
    qsa("[data-open-past-challenges]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        renderPastWeeks();
        openModal(qs("#past-challenges-modal"));
      });
    });
  }

  /* ============================================================
     Marquee — repeats its one phrase-set enough times that the
     track always spans well past any viewport width (no trailing
     blank gap on wide screens), then duplicates that whole run
     once more so a plain -50% translate loops seamlessly. Speed
     is derived from the built width so it reads the same pace
     regardless of how many repeats that took.
     ============================================================ */
  function initMarquee() {
    var track = qs("#marquee-track");
    if (!track) return;
    var setHtml = track.innerHTML;
    var minWidth = Math.max(window.innerWidth, document.documentElement.clientWidth) * 2.2;

    track.innerHTML = setHtml;
    var setWidth = track.scrollWidth || 1;
    var repeats = Math.max(1, Math.ceil(minWidth / setWidth));

    var run = "";
    for (var i = 0; i < repeats; i++) run += setHtml;
    track.innerHTML = run + run;

    var runWidth = track.scrollWidth / 2;
    var duration = Math.max(12, runWidth / 70);
    track.style.animationDuration = duration + "s";
  }

  /* ============================================================
     Accordion (How to Play) — generic grid-rows expand/collapse
     ============================================================ */
  function initAccordion() {
    qsa(".accordion-trigger").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        var panel = document.getElementById(btn.getAttribute("aria-controls"));
        if (panel) panel.setAttribute("data-open", String(!open));
      });
    });
  }

  /* ============================================================
     Game-modes carousel — swipeable, arrow-driven, and loops
     forever in both directions. The illusion: a couple of cards
     from each end are cloned onto the opposite end of the track,
     so there's always another card to scroll to; once a clone
     settles into view we teleport (no animation) to the identical
     real card at the same visual position, which is imperceptible.
     Only 2 dots are shown — five cards isn't enough to need one
     per card, so each dot just jumps to a half of the set.
     ============================================================ */
  function initCarousel() {
    var track = qs("#modes-track");
    if (!track) return;
    var realCards = qsa(".carousel-card:not(.is-clone)", track);
    var total = realCards.length;
    if (!total) return;

    var dotsWrap = qs("#modes-dots");
    var prev = qs(".carousel-arrow--prev");
    var next = qs(".carousel-arrow--next");

    var stepPx = realCards[0].offsetWidth + 14; // card width + track gap
    function step() { return stepPx; }
    function indexAll() { return Math.round(track.scrollLeft / stepPx); }

    /* Clone enough cards on each side to cover whatever is visible
       at once, plus one — otherwise on a wide viewport the track's
       real scroll range never reaches the clone "jump zone" and
       the loop hits a hard stop instead of wrapping. */
    var CLONE_COUNT = Math.min(total, Math.ceil(track.clientWidth / stepPx) + 1);

    function makeClone(card) {
      var clone = card.cloneNode(true);
      clone.classList.add("is-clone");
      clone.setAttribute("aria-hidden", "true");
      qsa("button,a", clone).forEach(function (el) { el.tabIndex = -1; });
      return clone;
    }

    qsa(".carousel-card.is-clone", track).forEach(function (c) { c.remove(); });
    for (var h = CLONE_COUNT - 1; h >= 0; h--) {
      track.insertBefore(makeClone(realCards[(total - CLONE_COUNT + h) % total]), track.firstChild);
    }
    for (var t = 0; t < CLONE_COUNT; t++) {
      track.appendChild(makeClone(realCards[t % total]));
    }

    /* Two dots only: each jumps to the start of one half of the
       real (non-cloned) cards. */
    var HALF = Math.ceil(total / 2);
    dotsWrap.innerHTML = "";
    [0, HALF].forEach(function (realIdx, i) {
      var d = document.createElement("button");
      d.type = "button";
      d.className = "carousel-dot";
      d.setAttribute("aria-label", "Go to slide group " + (i + 1));
      d.addEventListener("click", function () {
        track.scrollTo({ left: (CLONE_COUNT + realIdx) * stepPx, behavior: "smooth" });
      });
      dotsWrap.appendChild(d);
    });
    var dots = qsa(".carousel-dot", dotsWrap);

    function updateDots() {
      var realIdx = ((indexAll() - CLONE_COUNT) % total + total) % total;
      var active = realIdx < HALF ? 0 : 1;
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === active); });
    }

    function loopIfNeeded() {
      var idx = indexAll();
      if (idx < CLONE_COUNT) {
        track.scrollLeft += total * stepPx;
      } else if (idx >= CLONE_COUNT + total) {
        track.scrollLeft -= total * stepPx;
      }
    }

    var scrollTimer = null;
    track.addEventListener("scroll", function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        loopIfNeeded();
        updateDots();
      }, 120);
    });
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -stepPx, behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: stepPx, behavior: "smooth" }); });

    track.scrollLeft = CLONE_COUNT * stepPx;
    updateDots();
  }

  /* ============================================================
     Topbar: streak chip, stats/help modals, confetti. Owns the
     UI that used to belong to the removed daily-guess game.
     ============================================================ */
  function isModalOpen() {
    return qsa(".modal-backdrop").some(function (m) { return !m.hidden; });
  }
  function openModal(m) { if (m) m.hidden = false; }
  function closeAllModals() {
    qsa(".modal-backdrop").forEach(function (m) { m.hidden = true; });
  }

  function initTopbar() {
    updateStreakUI();
    var statsBtn = qs("#stats-btn");
    var helpBtn = qs("#help-btn");
    if (statsBtn) statsBtn.addEventListener("click", function () { openModal(qs("#stats-modal")); updateStatsUI(); });
    if (helpBtn) helpBtn.addEventListener("click", function () { openModal(qs("#help-modal")); });
    qsa("[data-close]").forEach(function (b) { b.addEventListener("click", closeAllModals); });
    qsa(".modal-backdrop").forEach(function (bd) {
      bd.addEventListener("click", function (e) { if (e.target === bd) closeAllModals(); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isModalOpen()) closeAllModals();
    });
  }

  /* ---------------------------------------------------------
     Lightweight canvas confetti burst — celebration for a
     correct Today's Challenge / Weekly Challenge answer or a
     freshly unlocked achievement.
     --------------------------------------------------------- */
  function launchConfetti() {
    var canvas = qs("#confetti");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.scale(dpr, dpr);
    canvas.classList.add("is-active");

    var colors = ["#0e4076", "#4d97c0", "#2e9e63", "#e0a53c", "#ffffff"];
    var pieces = [];
    for (var i = 0; i < 110; i++) {
      pieces.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 140,
        y: window.innerHeight * 0.3,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 9 - 4,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3
      });
    }
    var gravity = 0.28, frame = 0, maxFrames = 120;
    function tick() {
      frame++;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      pieces.forEach(function (p) {
        p.vy += gravity; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
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

  /* ============================================================
     Scroll FX: GSAP ScrollTrigger reveal when available, with a
     plain IntersectionObserver fallback so nothing breaks if the
     CDN is blocked.
     ============================================================ */
  function initScrollFX() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      initReveal();
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    qsa("[data-reveal-item],[data-hero-in]").forEach(function (t) {
      gsap.fromTo(t, { opacity: 0, y: 16 }, {
        opacity: 1, y: 0, duration: 0.6, ease: "power2.out",
        scrollTrigger: { trigger: t, start: "top 90%", once: true }
      });
    });
    var strip = qs("#stat-strip");
    if (strip) {
      ScrollTrigger.create({ trigger: strip, start: "top 85%", once: true, onEnter: animateStatEls });
    }
  }

  /* ============================================================
     Boot
     ============================================================ */
  document.addEventListener("DOMContentLoaded", function () {
    initLabels();
    initCtaScroll();
    initTopbar();
    initArchiveBar();
    initPastChallenges();
    initTodayGame();
    initUnscramble();
    initMissingLetter();
    initSpeedRound();
    initWeeklyChallenge();
    initAccordion();
    initCarousel();
    initMarquee();
    renderChallenges();
    renderAchievements();
    updateStatsUI();
    checkAchievements();
    initShowMore();
    initWordShuffle();
    initWordChipFill();
    initWordleDemo();
    initAnagramDrag();
    initPatternCycler();
    initContentMotion();
    initScrollFX();

    var marqueeResize = null;
    window.addEventListener("resize", function () {
      clearTimeout(marqueeResize);
      marqueeResize = setTimeout(initMarquee, 200);
    });
  });
})();
