/* Section Lab — reusable timed-section engine for GMAT-style practice sets.
   Works for any section (Quant, Verbal, Data Insights) and question types:
   mcq (single answer), multi (select all), twopart (two-column selection).      */

(function () {
  "use strict";

  const SETS = [];
  const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

  window.registerSet = function (set) {
    validateSet(set);
    const s = normalizeSet(set);
    SETS.push(s);
    selectedSetId = s.id;
    if (window.__slReady) { renderSetGrid(); updateHint(); }
    return s;
  };

  function validateSet(set) {
    if (!set || typeof set !== "object" || Array.isArray(set)) throw new Error("a set must be a JSON object");
    if (!Array.isArray(set.questions) || !set.questions.length) throw new Error("no questions array found");
    if (set.passages != null && (typeof set.passages !== "object" || Array.isArray(set.passages))) throw new Error("'passages' must be an object of named passages");
    set.questions.forEach(function (q, i) {
      const at = "question " + (i + 1);
      if (!q || typeof q !== "object") throw new Error(at + " is not an object");
      if (q.passage != null && !(set.passages && set.passages[q.passage])) throw new Error(at + " refers to passage '" + q.passage + "', which is not defined in 'passages'");
      const okText = (v) => (typeof v === "string" && v.trim()) || (Array.isArray(v) && v.length && v.every((x) => typeof x === "string"));
      if (!okText(q.stem)) throw new Error(at + " has no stem");
      if (q.stimulus && q.stimulus.text != null && !okText(q.stimulus.text)) throw new Error(at + " has a stimulus.text that is not a string or an array of strings");
      if (!Array.isArray(q.choices) || q.choices.length < 2) throw new Error(at + " needs at least two choices");
      const type = q.type || (Array.isArray(q.answers) ? (q.twoPartHeaders ? "twopart" : "multi") : "mcq");
      const inRange = (v) => Number.isInteger(v) && v >= 0 && v < q.choices.length;
      if (type === "mcq" && !inRange(q.answer)) throw new Error(at + " needs an 'answer' index within its choices");
      if (type !== "mcq") {
        if (!Array.isArray(q.answers) || !q.answers.length || !q.answers.every(inRange)) throw new Error(at + " needs an 'answers' array of valid choice indexes");
        if (type === "twopart" && (!Array.isArray(q.twoPartHeaders) || q.twoPartHeaders.length !== 2 || q.answers.length !== 2)) throw new Error(at + " (two-part) needs two column headers and two answers");
      }
    });
  }

  function normalizeSet(raw) {
    const set = Object.assign({}, raw);
    set.id = set.id || "set-" + (SETS.length + 1);
    set.section = set.section || "Practice Section";
    set.title = set.title || set.section;
    set.questions = (set.questions || []).map(function (q, i) {
      const n = Object.assign({}, q);
      if (n.passage != null && raw.passages && raw.passages[n.passage]) {
        const p = raw.passages[n.passage];
        const base = typeof p === "string" || Array.isArray(p) ? { text: p } : p;
        n.stimulus = Object.assign({}, base, n.stimulus || {});
      }
      n.type = n.type || (Array.isArray(n.answers) && n.twoPartHeaders ? "twopart" : Array.isArray(n.answers) ? "multi" : "mcq");
      n.id = n.id || i + 1;
      n.topic = n.topic || "Untagged";
      n.diff = n.diff || "Medium";
      n.target = n.target || Math.round(((set.minutes || 45) * 60) / Math.max(1, (set.questions || []).length));
      return n;
    });
    set.minutes = set.minutes || Math.max(1, Math.round(set.questions.reduce((a, q) => a + q.target, 0) / 60));
    return set;
  }

  /* ---------------- state ---------------- */
  const S = {
    set: null, order: [], cur: 0,
    answers: {}, times: {}, flags: {},
    total: 0, remaining: 0, paused: false,
    tick: null, lastStamp: 0, qStamp: 0,
    reveal: false, pausable: false, finished: false
  };

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
  /* ---------------- inline text formatting ----------------
     Bold:    **text**  or  \textbf{text}
     Italic:  *text*  or  \emph{text}  or  \textit{text}
     Underline: \underline{text}
     Math spans ($...$, $$...$$, \(...\), \[...\]) are passed through untouched
     so KaTeX still sees them; \textbf inside math is handled by KaTeX itself.
     A literal asterisk pair can be written \*\*. */
  const MATH_DELIMS = [["$$", "$$"], ["\\[", "\\]"], ["\\(", "\\)"], ["$", "$"]];
  const FMT_CMDS = { "\\textbf{": "strong", "\\emph{": "em", "\\textit{": "em", "\\underline{": "u" };
  const FMT_SKIP_TAGS = /^(SCRIPT|STYLE|TEXTAREA|PRE|CODE|OPTION|NOSCRIPT)$/;
  const FMT_TEST = /\*|\\textbf\{|\\emph\{|\\textit\{|\\underline\{|\\\*/;

  function mathEndAt(s, i) {
    if (s[i - 1] === "\\" && s[i] === "$") return -1;           // escaped \$ is a literal dollar
    for (const [l, r] of MATH_DELIMS) {
      if (s.startsWith(l, i)) {
        const j = s.indexOf(r, i + l.length);
        return j === -1 ? -1 : j + r.length;
      }
    }
    return -1;
  }
  // index just past the brace that closes a group opened right before `from`, or -1
  function braceClose(s, from) {
    let depth = 1;
    for (let i = from; i < s.length; i++) {
      const m = mathEndAt(s, i);
      if (m !== -1) { i = m - 1; continue; }
      if (s[i] === "\\" && (s[i + 1] === "{" || s[i + 1] === "}")) { i++; continue; }
      if (s[i] === "{") depth++;
      else if (s[i] === "}" && --depth === 0) return i;
    }
    return -1;
  }
  function nextStars(s, from) {
    for (let i = from; i < s.length; i++) {
      const m = mathEndAt(s, i);
      if (m !== -1) { i = m - 1; continue; }
      if (s[i] === "\\" && s[i + 1] === "*") { i++; continue; }
      if (s.startsWith("**", i)) return i;
    }
    return -1;
  }
  function nextStar(s, from, to) {
    for (let i = from; i < to; i++) {
      const m = mathEndAt(s, i);
      if (m !== -1) { i = m - 1; continue; }
      if (s[i] === "\\" && s[i + 1] === "*") { i++; continue; }
      if (s[i] === "*") {
        if (s[i + 1] === "*") { i++; continue; }
        if (!/\s/.test(s[i - 1]) && !/[A-Za-z0-9]/.test(s[i + 1] || "")) return i;
      }
    }
    return -1;
  }
  // build a fragment for s[from, to)
  function formatRange(s, from, to) {
    const frag = document.createDocumentFragment();
    let buf = "";
    const flush = () => { if (buf) { frag.appendChild(document.createTextNode(buf)); buf = ""; } };
    let i = from;
    while (i < to) {
      const m = mathEndAt(s, i);
      if (m !== -1 && m <= to) { buf += s.slice(i, m); i = m; continue; }
      if (s[i] === "\\" && s[i + 1] === "*") { buf += "*"; i += 2; continue; }
      if (s.startsWith("**", i)) {
        const close = nextStars(s, i + 2);
        if (close !== -1 && close < to && close > i + 2) {
          flush();
          const b = document.createElement("strong");
          b.appendChild(formatRange(s, i + 2, close));
          frag.appendChild(b);
          i = close + 2;
          continue;
        }
      }
      // *italic*: opener not after a letter/digit and not before a space; closer the reverse (so 3*4*5 stays literal)
      if (s[i] === "*" && s[i + 1] !== "*" && s[i + 1] && !/\s/.test(s[i + 1]) && !/[A-Za-z0-9*]/.test(s[i - 1] || "")) {
        const close = nextStar(s, i + 1, to);
        if (close !== -1) {
          flush();
          const n = document.createElement("em");
          n.appendChild(formatRange(s, i + 1, close));
          frag.appendChild(n);
          i = close + 1;
          continue;
        }
      }
      if (s[i] === "\\") {
        const cmd = Object.keys(FMT_CMDS).find((c) => s.startsWith(c, i));
        if (cmd) {
          const close = braceClose(s, i + cmd.length);
          if (close !== -1 && close < to) {
            flush();
            const n = document.createElement(FMT_CMDS[cmd]);
            n.appendChild(formatRange(s, i + cmd.length, close));
            frag.appendChild(n);
            i = close + 1;
            continue;
          }
        }
      }
      buf += s[i]; i++;
    }
    flush();
    return frag;
  }
  function formatText(node) {
    if (!node) return;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
      acceptNode(t) {
        for (let p = t.parentNode; p && p !== node.parentNode; p = p.parentNode) {
          if (p.nodeType !== 1) continue;
          if (FMT_SKIP_TAGS.test(p.tagName)) return NodeFilter.FILTER_REJECT;
          const c = p.classList;
          if (c && (c.contains("katex") || c.contains("export") || c.contains("no-math") || c.contains("no-format"))) return NodeFilter.FILTER_REJECT;
        }
        return FMT_TEST.test(t.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    const hits = [];
    while (walker.nextNode()) hits.push(walker.currentNode);
    for (const t of hits) {
      const s = t.nodeValue;
      t.parentNode.replaceChild(formatRange(s, 0, s.length), t);
    }
  }

  /* ---------------- paragraphs ----------------
     Text fields may hold several paragraphs: separate them with a blank line
     ("\n\n") or pass an array of strings. A single "\n" is a line break. */
  function splitParas(text) {
    if (Array.isArray(text)) return text.flatMap(splitParas);
    if (text == null) return [];
    return String(text).replace(/\r\n?/g, "\n").split(/\n[ \t]*\n+/).map((t) => t.trim()).filter(Boolean);
  }
  function prose(text, cls) {
    const box = el("div", "prose" + (cls ? " " + cls : ""));
    splitParas(text).forEach((t) => box.appendChild(el("p", null, t)));
    return box;
  }
  const flatText = (text) => (Array.isArray(text) ? text.join("\n\n") : text == null ? "" : String(text));

  function typeset(node) {
    if (!node) return;
    formatText(node);
    if (typeof window.renderMathInElement !== "function") return;
    try {
      window.renderMathInElement(node, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "$", right: "$", display: false }
        ],
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
        ignoredClasses: ["export", "no-math"],
        throwOnError: false,
        errorColor: "#b4453c"
      });
    } catch (e) { /* malformed math stays as plain text */ }
  }

  const fmt = (sec) => {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60);
    return m + ":" + String(sec % 60).padStart(2, "0");
  };

  /* ---------------- setup screen ---------------- */
  let selectedSetId = null;

  function renderSetGrid() {
    const grid = $("setGrid");
    grid.innerHTML = "";
    setTimeout(() => typeset(grid), 0);
    $("startBtn").disabled = !SETS.length;
    if (!SETS.length) {
      const empty = el("div", "card empty-state");
      empty.appendChild(el("div", "eyebrow", "No sets loaded"));
      empty.appendChild(el("p", null, "Nothing is timed until a set is loaded. Add a file or paste JSON above and it will appear here, ready to start."));
      grid.appendChild(empty);
      return;
    }
    if (!SETS.some((s) => s.id === selectedSetId)) selectedSetId = SETS[0].id;
    SETS.forEach(function (set) {
      const b = el("button", "card set-card");
      b.type = "button";
      b.setAttribute("aria-pressed", String(set.id === selectedSetId));
      b.appendChild(el("div", "eyebrow", set.section));
      b.appendChild(el("h3", null, set.title));
      const meta = el("div", "meta");
      meta.appendChild(el("span", null, set.questions.length + " questions"));
      meta.appendChild(el("span", null, set.minutes + " minutes"));
      meta.appendChild(el("span", null, fmt((set.minutes * 60) / set.questions.length) + " per question"));
      b.appendChild(meta);
      if (set.note) b.appendChild(el("p", "note", set.note));
      b.addEventListener("click", function () { selectedSetId = set.id; renderSetGrid(); updateHint(); });
      const rm = el("button", "remove-set", "Remove");
      rm.type = "button";
      rm.addEventListener("click", function (e) {
        e.stopPropagation();
        const i = SETS.findIndex((s) => s.id === set.id);
        if (i > -1) SETS.splice(i, 1);
        renderSetGrid(); updateHint();
      });
      const slot = el("div", "set-slot");
      slot.appendChild(b);
      slot.appendChild(rm);
      grid.appendChild(slot);
    });
  }

  function currentSet() { return SETS.find((s) => s.id === selectedSetId) || SETS[0]; }

  function addSetsFromText(text, label) {
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    list.forEach(function (s) {
      try { window.registerSet(s); }
      catch (e) { throw new Error((label ? label + " — " : "") + e.message); }
    });
    return list.length;
  }

  function loadMsg(text, bad) {
    const n = $("loadMsg");
    n.textContent = text;
    n.style.color = bad ? "var(--bad)" : "var(--ok)";
  }

  function updateHint() {
    const set = currentSet();
    $("startHint").textContent = set
      ? set.questions.length + " questions · " + set.minutes + ":00 on the clock"
      : "";
  }

  /* ---------------- exam flow ---------------- */
  function startSection() {
    const set = currentSet();
    if (!set || !set.questions.length) return;
    S.set = set;
    S.order = set.questions.map((_, i) => i);
    if ($("optShuffle").checked) {
      for (let i = S.order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [S.order[i], S.order[j]] = [S.order[j], S.order[i]];
      }
    }
    S.reveal = $("optReveal").checked;
    S.pausable = $("optPausable").checked;
    S.answers = {}; S.times = {}; S.flags = {};
    S.cur = 0; S.finished = false; S.paused = false;
    S.total = set.minutes * 60;
    S.remaining = S.total;
    $("brandSub").textContent = set.section;
    $("screenSetup").classList.add("hidden");
    $("screenReport").classList.add("hidden");
    $("screenExam").classList.remove("hidden");
    $("timer").classList.remove("hidden");
    $("pauseBtn").classList.toggle("hidden", !S.pausable);
    S.lastStamp = performance.now();
    S.qStamp = S.lastStamp;
    if (S.tick) clearInterval(S.tick);
    S.tick = setInterval(loop, 200);
    renderQuestion();
    window.scrollTo({ top: 0 });
  }

  function loop() {
    if (S.paused || S.finished) { S.lastStamp = performance.now(); return; }
    const now = performance.now();
    const d = (now - S.lastStamp) / 1000;
    S.lastStamp = now;
    S.remaining -= d;
    if (S.remaining <= 0) { S.remaining = 0; finish(true); return; }
    paintTimer();
  }

  function paintTimer() {
    $("timeLeft").textContent = fmt(S.remaining);
    const t = $("timer");
    const frac = S.remaining / S.total;
    t.dataset.state = frac <= 0.07 ? "crit" : frac <= 0.2 ? "warn" : "ok";
    const q = curQ();
    const spent = elapsedOnCurrent();
    const qt = $("qTime");
    qt.textContent = fmt(spent) + " / " + fmt(q.target);
    qt.dataset.over = String(spent > q.target);
    $("progressBar").style.width = ((S.total - S.remaining) / S.total) * 100 + "%";
  }

  function curQ() { return S.set.questions[S.order[S.cur]]; }
  function curKey() { return S.order[S.cur]; }
  function elapsedOnCurrent() {
    const banked = S.times[curKey()] || 0;
    return banked + (S.paused || S.finished ? 0 : (performance.now() - S.qStamp) / 1000);
  }
  function bankTime() {
    const k = curKey();
    S.times[k] = (S.times[k] || 0) + (performance.now() - S.qStamp) / 1000;
    S.qStamp = performance.now();
  }

  function goTo(i) {
    if (i < 0 || i >= S.order.length) return;
    bankTime();
    S.cur = i;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderQuestion() {
    const q = curQ();
    const k = curKey();
    $("qCount").textContent = "Question " + (S.cur + 1) + " of " + S.order.length;
    $("qTopic").textContent = q.topic;
    $("qDiff").textContent = q.diff;
    $("prevBtn").disabled = S.cur === 0;
    $("nextBtn").textContent = S.cur === S.order.length - 1 ? "Review" : "Next";
    $("flagBtn").textContent = S.flags[k] ? "Unflag" : "Flag for review";

    const stim = $("qStimulus");
    // keep the reader's place when consecutive questions share a passage
    const prevBox = stim.querySelector(".stimulus");
    const prevKey = stim.dataset.key || "";
    const prevScroll = prevBox ? prevBox.scrollTop : 0;
    const stimKey = q.stimulus ? (q.passage != null ? "p:" + q.passage : "t:" + flatText(q.stimulus.text).slice(0, 200)) : "";
    stim.dataset.key = stimKey;
    stim.innerHTML = "";
    if (q.stimulus) {
      const box = el("div", "stimulus");
      if (q.stimulus.title) box.appendChild(el("div", "eyebrow stim-title", q.stimulus.title));
      if (q.stimulus.text) box.appendChild(prose(q.stimulus.text));
      if (q.stimulus.table) {
        const t = el("table", "data");
        const thead = el("thead"), tr = el("tr");
        q.stimulus.table.headers.forEach((h) => tr.appendChild(el("th", null, h)));
        thead.appendChild(tr); t.appendChild(thead);
        const tb = el("tbody");
        q.stimulus.table.rows.forEach(function (row) {
          const r = el("tr");
          row.forEach((c) => r.appendChild(el("td", null, c)));
          tb.appendChild(r);
        });
        t.appendChild(tb); box.appendChild(t);
      }
      stim.appendChild(box);
    }
    // long single-passage stimuli (reading comprehension) sit beside the question on wide screens
    const st = q.stimulus || {};
    const nParas = splitParas(st.text).length;
    const long = flatText(st.text).length > 900;
    const split = st.layout === "split" || (st.layout !== "stacked" && !st.table && (nParas >= 2 || long));
    $("examCard").classList.toggle("split", !!split);
    const stimBox = stim.querySelector(".stimulus");
    if (stimBox && stimKey && stimKey === prevKey) requestAnimationFrame(() => { stimBox.scrollTop = prevScroll; });

    const stemEl = $("qStem");
    stemEl.innerHTML = "";
    stemEl.appendChild(prose(q.stem));
    const body = $("qBody");
    body.innerHTML = "";
    $("qFeedback").innerHTML = "";

    if (q.type === "twopart") body.appendChild(buildTwoPart(q, k));
    else body.appendChild(buildChoices(q, k));

    typeset(stim);
    typeset($("qStem"));
    typeset(body);
    renderPalette();
    paintTimer();
    if (S.reveal && S.answers[k] !== undefined) showFeedback(q, k);
  }

  function buildChoices(q, k) {
    const wrap = el("div", "choices");
    const multi = q.type === "multi";
    if (multi) {
      const hint = el("div", "qtime", "Select all that apply.");
      hint.style.marginBottom = "var(--space-2)";
      wrap.appendChild(hint);
    }
    q.choices.forEach(function (c, i) {
      const b = el("button", "choice");
      b.type = "button";
      const sel = multi ? (S.answers[k] || []).includes(i) : S.answers[k] === i;
      b.setAttribute("aria-pressed", String(sel));
      b.appendChild(el("span", "key", LETTERS[i]));
      b.appendChild(el("span", null, c));
      b.addEventListener("click", function () {
        if (multi) {
          const cur = new Set(S.answers[k] || []);
          cur.has(i) ? cur.delete(i) : cur.add(i);
          S.answers[k] = Array.from(cur).sort((a, b2) => a - b2);
        } else {
          S.answers[k] = S.answers[k] === i ? undefined : i;
        }
        renderQuestion();
        if (S.reveal) showFeedback(q, k);
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function buildTwoPart(q, k) {
    const t = el("table", "twopart");
    const thead = el("thead"), hr = el("tr");
    hr.appendChild(el("th", null, q.twoPartHeaders[0]));
    hr.appendChild(el("th", null, q.twoPartHeaders[1]));
    hr.appendChild(el("th", null, "Value"));
    thead.appendChild(hr); t.appendChild(thead);
    const tb = el("tbody");
    const cur = S.answers[k] || [undefined, undefined];
    q.choices.forEach(function (c, i) {
      const r = el("tr");
      [0, 1].forEach(function (col) {
        const td = el("td");
        const inp = document.createElement("input");
        inp.type = "radio";
        inp.name = "tp-" + k + "-" + col;
        inp.checked = cur[col] === i;
        inp.addEventListener("change", function () {
          const a = (S.answers[k] || [undefined, undefined]).slice();
          a[col] = i;
          S.answers[k] = a;
          renderPalette();
          if (S.reveal) showFeedback(q, k);
        });
        td.appendChild(inp);
        r.appendChild(td);
      });
      r.appendChild(el("td", null, c));
      tb.appendChild(r);
    });
    t.appendChild(tb);
    return t;
  }

  function showFeedback(q, k) {
    const box = $("qFeedback");
    box.innerHTML = "";
    const good = isCorrect(q, S.answers[k]);
    const d = el("div", "stimulus");
    d.style.borderLeftColor = good ? "var(--ok)" : "var(--bad)";
    d.style.marginTop = "var(--space-5)";
    d.appendChild(el("div", "eyebrow", good ? "Correct" : "Incorrect — correct answer: " + answerLabel(q)));
    d.appendChild(prose(q.why || "", "why"));
    box.appendChild(d);
    typeset(box);
  }

  function answerLabel(q) {
    if (q.type === "twopart") return q.twoPartHeaders[0] + " = " + q.choices[q.answers[0]] + ", " + q.twoPartHeaders[1] + " = " + q.choices[q.answers[1]];
    if (q.type === "multi") return q.answers.map((i) => LETTERS[i]).join(", ");
    return LETTERS[q.answer];
  }

  function hasAnswer(q, a) {
    if (a === undefined || a === null) return false;
    if (q.type === "twopart") return a[0] !== undefined && a[1] !== undefined;
    if (q.type === "multi") return a.length > 0;
    return true;
  }

  function isCorrect(q, a) {
    if (!hasAnswer(q, a)) return false;
    if (q.type === "mcq") return a === q.answer;
    const key = q.answers;
    return a.length === key.length && key.every((v, i) => a[i] === v);
  }

  function renderPalette() {
    const p = $("palette");
    p.innerHTML = "";
    S.order.forEach(function (qi, idx) {
      const q = S.set.questions[qi];
      const b = el("button", "pal", String(idx + 1));
      b.type = "button";
      b.dataset.answered = String(hasAnswer(q, S.answers[qi]));
      b.dataset.flagged = String(!!S.flags[qi]);
      b.dataset.current = String(idx === S.cur);
      b.addEventListener("click", () => goTo(idx));
      p.appendChild(b);
    });
  }

  /* ---------------- report ---------------- */
  function finish(expired) {
    if (S.finished) return;
    bankTime();
    S.finished = true;
    if (S.tick) clearInterval(S.tick);
    $("pauseBtn").classList.add("hidden");
    $("timer").classList.add("hidden");
    $("screenExam").classList.add("hidden");
    $("progressBar").style.width = "100%";
    buildReport(expired);
    $("screenReport").classList.remove("hidden");
    window.scrollTo({ top: 0 });
  }

  function classify(q, a, time) {
    const good = isCorrect(q, a);
    if (!hasAnswer(q, a)) return { tag: "Unanswered", cls: "bad", note: "Never committed an answer — ran the clock out or skipped." };
    if (good && time <= q.target * 1.15) return { tag: "Clean", cls: "ok", note: "Right answer, on pace." };
    if (good && time <= q.target * 1.5) return { tag: "Slow solve", cls: "neutral", note: "Right, but " + Math.round(time - q.target) + "s over target — method was longer than needed." };
    if (good) return { tag: "Time sink", cls: "neutral", note: "Right, but cost " + fmt(time) + ". On the real section this is what forces guesses later." };
    if (time < q.target * 0.5) return { tag: "Careless", cls: "bad", note: "Wrong in only " + fmt(time) + " — a rushed read or arithmetic slip, not a content gap." };
    if (time > q.target * 1.5) return { tag: "Content gap + sink", cls: "bad", note: "Wrong after " + fmt(time) + ". This is the highest-value topic to drill." };
    return { tag: "Content gap", cls: "bad", note: "Wrong at roughly normal pace — the concept, not the clock." };
  }

  function buildReport(expired) {
    const root = $("screenReport");
    root.innerHTML = "";
    const rows = S.order.map(function (qi, idx) {
      const q = S.set.questions[qi];
      const a = S.answers[qi];
      const time = S.times[qi] || 0;
      return { pos: idx + 1, q: q, a: a, time: time, correct: isCorrect(q, a), answered: hasAnswer(q, a), diag: classify(q, a, time) };
    });
    const n = rows.length;
    const correct = rows.filter((r) => r.correct).length;
    const pct = Math.round((correct / n) * 100);
    const used = S.total - S.remaining;
    const blanks = rows.filter((r) => !r.answered).length;
    const careless = rows.filter((r) => r.diag.tag === "Careless").length;
    const overTarget = rows.filter((r) => r.time > r.q.target * 1.15).length;
    const est = 60 + Math.round((correct / n) * 30);

    // head
    const head = el("div", "report-head");
    const left = el("div");
    left.appendChild(el("div", "eyebrow", S.set.section + " · " + S.set.title));
    left.appendChild(el("h1", "score-big", correct + " of " + n + " correct (" + pct + "%)"));
    left.appendChild(el("p", "why", expired
      ? "Time expired with " + blanks + " question" + (blanks === 1 ? "" : "s") + " unanswered. On the real section an unanswered question is a guaranteed miss, so pacing is the first thing to fix below."
      : "Submitted with " + fmt(S.remaining) + " left on the clock."));
    head.appendChild(left);
    root.appendChild(head);

    // KPIs
    const kpis = el("div", "kpis");
    const addKpi = (k, v, sub) => {
      const c = el("div", "kpi");
      c.appendChild(el("div", "k", k));
      c.appendChild(el("div", "v", v));
      if (sub) c.appendChild(el("div", "sub", sub));
      kpis.appendChild(c);
    };
    addKpi("Estimated band", (est - 2) + "–" + (est + 2), "Rough, non-adaptive estimate");
    addKpi("Time used", fmt(used), "of " + fmt(S.total));
    addKpi("Avg per question", fmt(used / n), "target " + fmt(S.total / n));
    addKpi("Over target", overTarget + " / " + n, "spent >15% over pace");
    addKpi("Careless misses", String(careless), "wrong in under half the target time");
    addKpi("Unanswered", String(blanks), blanks ? "pure pacing loss" : "nothing left blank");
    root.appendChild(kpis);

    root.appendChild(bandSection(rows));
    root.appendChild(paceSection(rows));
    root.appendChild(groupSection("Accuracy by topic", rows, (r) => r.q.topic));
    root.appendChild(groupSection("Accuracy by difficulty", rows, (r) => r.q.diff));
    root.appendChild(reviewSection(rows));
    root.appendChild(exportSection(rows, { correct: correct, n: n, pct: pct, used: used, blanks: blanks, careless: careless, overTarget: overTarget, est: est, expired: !!expired }));

    const again = el("div");
    again.style.display = "flex";
    again.style.gap = "var(--space-3)";
    again.style.flexWrap = "wrap";
    const back = el("button", "btn btn-primary", "Back to sets");
    back.type = "button";
    back.addEventListener("click", function () {
      $("screenReport").classList.add("hidden");
      $("screenSetup").classList.remove("hidden");
      $("progressBar").style.width = "0%";
      $("brandSub").textContent = "Timed GMAT section trainer";
    });
    const retry = el("button", "btn", "Retake this set");
    retry.type = "button";
    retry.addEventListener("click", function () { $("screenReport").classList.add("hidden"); startSection(); });
    again.appendChild(back); again.appendChild(retry);
    root.appendChild(again);
    typeset(root);
  }

  function bandSection(rows) {
    const s = el("section", "block");
    s.appendChild(el("h2", null, "What actually cost you points"));
    const order = ["Careless", "Content gap", "Content gap + sink", "Unanswered", "Time sink", "Slow solve", "Clean"];
    const counts = {};
    rows.forEach((r) => { counts[r.diag.tag] = (counts[r.diag.tag] || 0) + 1; });
    const bars = el("div", "bars");
    order.forEach(function (tag) {
      if (!counts[tag]) return;
      const row = el("div", "bar-row");
      row.appendChild(el("div", null, tag));
      const track = el("div", "track");
      const i = el("i");
      i.style.width = (counts[tag] / rows.length) * 100 + "%";
      if (tag === "Clean") i.style.background = "var(--ok)";
      else if (tag.indexOf("Slow") === 0 || tag === "Time sink") i.style.background = "var(--warn)";
      else i.style.background = "var(--bad)";
      track.appendChild(i);
      row.appendChild(track);
      row.appendChild(el("div", "num", counts[tag] + " q"));
      bars.appendChild(row);
    });
    s.appendChild(bars);
    return s;
  }

  function paceSection(rows) {
    const s = el("section", "block");
    s.appendChild(el("h2", null, "Pacing curve"));
    const wrap = el("div", "pace-wrap");
    const cv = document.createElement("canvas");
    cv.style.width = "100%";
    cv.style.height = "220px";
    wrap.appendChild(cv);
    const legend = el("div", "legend");
    const mk = (color, label) => {
      const sp = el("span");
      const sw = el("span", "swatch");
      sw.style.background = color;
      sp.appendChild(sw); sp.appendChild(document.createTextNode(label));
      return sp;
    };
    legend.appendChild(mk("var(--accent)", "Your cumulative time"));
    legend.appendChild(mk("var(--ink-3)", "Even-pace benchmark"));
    legend.appendChild(mk("var(--bad)", "Missed question"));
    wrap.appendChild(legend);
    s.appendChild(wrap);
    requestAnimationFrame(() => drawPace(cv, rows));
    return s;
  }

  function drawPace(cv, rows) {
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth || 600, h = 220;
    cv.width = w * dpr; cv.height = h * dpr;
    const c = cv.getContext("2d");
    c.scale(dpr, dpr);
    const css = getComputedStyle(document.body);
    const ink3 = css.getPropertyValue("--ink-3") || "#888";
    const accent = css.getPropertyValue("--accent") || "#0aa";
    const bad = css.getPropertyValue("--bad") || "#c33";
    const border = css.getPropertyValue("--border") || "#ddd";
    const pad = { l: 44, r: 12, t: 12, b: 26 };
    const n = rows.length;
    const cum = []; let t = 0;
    rows.forEach((r) => { t += r.time; cum.push(t); });
    const maxY = Math.max(S.total, t) * 1.02;
    const X = (i) => pad.l + ((w - pad.l - pad.r) * i) / n;
    const Y = (v) => h - pad.b - ((h - pad.t - pad.b) * v) / maxY;

    c.strokeStyle = border; c.lineWidth = 1;
    c.fillStyle = ink3; c.font = "11px ui-monospace, monospace";
    for (let g = 0; g <= 4; g++) {
      const v = (maxY / 4) * g;
      c.beginPath(); c.moveTo(pad.l, Y(v)); c.lineTo(w - pad.r, Y(v)); c.stroke();
      c.fillText(fmt(v), 6, Y(v) + 3);
    }
    // benchmark
    c.strokeStyle = ink3; c.setLineDash([4, 4]); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(n), Y(S.total)); c.stroke();
    c.setLineDash([]);
    // actual
    c.strokeStyle = accent; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(X(0), Y(0));
    cum.forEach((v, i) => c.lineTo(X(i + 1), Y(v)));
    c.stroke();
    rows.forEach(function (r, i) {
      c.beginPath();
      c.arc(X(i + 1), Y(cum[i]), 3.5, 0, Math.PI * 2);
      c.fillStyle = r.correct ? accent : bad;
      c.fill();
    });
    c.fillStyle = ink3;
    c.fillText("Q1", X(1) - 8, h - 8);
    c.fillText("Q" + n, X(n) - 14, h - 8);
  }

  function groupSection(title, rows, keyFn) {
    const s = el("section", "block");
    s.appendChild(el("h2", null, title));
    const map = new Map();
    rows.forEach(function (r) {
      const k = keyFn(r);
      if (!map.has(k)) map.set(k, { n: 0, c: 0, t: 0 });
      const g = map.get(k);
      g.n++; g.t += r.time; if (r.correct) g.c++;
    });
    const bars = el("div", "bars");
    Array.from(map.entries())
      .sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n)
      .forEach(function ([k, g]) {
        const row = el("div", "bar-row");
        row.appendChild(el("div", null, k));
        const track = el("div", "track");
        const i = el("i");
        const acc = g.c / g.n;
        i.style.width = Math.max(acc * 100, 1.5) + "%";
        i.style.background = acc >= 0.8 ? "var(--ok)" : acc >= 0.5 ? "var(--warn)" : "var(--bad)";
        track.appendChild(i);
        row.appendChild(track);
        row.appendChild(el("div", "num", g.c + "/" + g.n + " · avg " + fmt(g.t / g.n)));
        bars.appendChild(row);
      });
    s.appendChild(bars);
    return s;
  }

  function userAnswerText(q, a) {
    if (!hasAnswer(q, a)) return "—";
    if (q.type === "twopart") return q.choices[a[0]] + " / " + q.choices[a[1]];
    if (q.type === "multi") return a.map((i) => LETTERS[i]).join(", ");
    return LETTERS[a];
  }

  function reviewSection(rows) {
    const s = el("section", "block");
    s.appendChild(el("h2", null, "Question-by-question review"));
    const t = el("table", "review");
    const thead = el("thead"), hr = el("tr");
    ["#", "Topic", "Time", "You", "Key", "Diagnosis", ""].forEach((x) => hr.appendChild(el("th", null, x)));
    thead.appendChild(hr); t.appendChild(thead);
    const tb = el("tbody");
    rows.forEach(function (r) {
      const tr = el("tr");
      tr.appendChild(el("td", "mono", String(r.pos)));
      const tdTopic = el("td");
      tdTopic.appendChild(document.createTextNode(r.q.topic));
      tdTopic.appendChild(el("div", "num", r.q.diff));
      tr.appendChild(tdTopic);
      const tdT = el("td", "mono", fmt(r.time));
      if (r.time > r.q.target * 1.15) tdT.style.color = "var(--warn)";
      tdT.appendChild(el("div", "num", "target " + fmt(r.q.target)));
      tr.appendChild(tdT);
      tr.appendChild(el("td", "mono", userAnswerText(r.q, r.a)));
      tr.appendChild(el("td", "mono", answerLabel(r.q)));
      const tdD = el("td");
      tdD.appendChild(el("span", "tag " + r.diag.cls, r.diag.tag));
      tdD.appendChild(el("div", "num", r.diag.note));
      tr.appendChild(tdD);
      const tdW = el("td");
      const det = el("details", "q-detail");
      det.appendChild(el("summary", null, "Solution"));
      det.appendChild(prose(r.q.stem, "why"));
      det.appendChild(prose(r.q.why || "", "why"));
      tdW.appendChild(det);
      tr.appendChild(tdW);
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    const scroll = el("div", "table-scroll");
    scroll.appendChild(t);
    s.appendChild(scroll);
    return s;
  }

  function localDate() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function buildLogObject(rows, sum) {
    const flagged = rows.filter((r) => !r.correct || r.time > r.q.target * 1.15);
    return {
      exportedAt: new Date().toISOString(),
      date: localDate(),
      section: S.set.section,
      set: S.set.title,
      setId: S.set.id,
      sectionMinutes: S.set.minutes,
      timeExpired: sum.expired,
      summary: {
        questions: sum.n,
        correct: sum.correct,
        accuracyPercent: sum.pct,
        estimatedBand: (sum.est - 2) + "-" + (sum.est + 2),
        secondsUsed: Math.round(sum.used),
        secondsAvailable: S.total,
        avgSecondsPerQuestion: Math.round(sum.used / sum.n),
        targetSecondsPerQuestion: Math.round(S.total / sum.n),
        unanswered: sum.blanks,
        carelessMisses: sum.careless,
        overTargetCount: sum.overTarget
      },
      topicBreakdown: Array.from(rows.reduce(function (m, r) {
        const g = m.get(r.q.topic) || { topic: r.q.topic, attempted: 0, correct: 0, totalSeconds: 0 };
        g.attempted++; g.totalSeconds += r.time; if (r.correct) g.correct++;
        m.set(r.q.topic, g);
        return m;
      }, new Map()).values()).map(function (g) {
        return { topic: g.topic, attempted: g.attempted, correct: g.correct, avgSeconds: Math.round(g.totalSeconds / g.attempted) };
      }).sort((a, b) => a.correct / a.attempted - b.correct / b.attempted),
      errorLog: flagged.map(function (r) {
        return {
          question: r.pos,
          topic: r.q.topic,
          difficulty: r.q.diff,
          type: r.q.type,
          yourAnswer: hasAnswer(r.q, r.a) ? userAnswerText(r.q, r.a) : null,
          correctAnswer: answerLabel(r.q),
          wasCorrect: r.correct,
          seconds: Math.round(r.time),
          targetSeconds: r.q.target,
          secondsOverTarget: Math.round(r.time - r.q.target),
          errorType: r.diag.tag,
          diagnosis: r.diag.note,
          stem: flatText(r.q.stem),
          takeaway: flatText(r.q.why).replace(/\s+/g, " ")
        };
      })
    };
  }

  function exportSection(rows, sum) {
    const s = el("section", "block");
    s.appendChild(el("h2", null, "Error log export"));
    s.appendChild(el("p", "why", "Download the JSON file to hand back for error-log updates, or copy the tab-separated version straight into the workbook. Both cover every missed or off-pace question."));
    const lines = ["Date\tSection\tSet\tQ#\tTopic\tDifficulty\tYour answer\tCorrect\tTime\tTarget\tError type\tTakeaway"];
    const today = localDate();
    rows.filter((r) => !r.correct || r.time > r.q.target * 1.15).forEach(function (r) {
      lines.push([today, S.set.section, S.set.title, r.pos, r.q.topic, r.q.diff,
        userAnswerText(r.q, r.a), answerLabel(r.q), fmt(r.time), fmt(r.q.target),
        r.diag.tag, flatText(r.q.why).replace(/\s+/g, " ")].join("\t"));
    });
    const logObj = buildLogObject(rows, sum);
    const jsonText = JSON.stringify(logObj, null, 2);
    const slug = (S.set.title || "section").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const fileName = logObj.date + "-" + slug + "-error-log.json";

    const tabs = el("div", "export-tabs");
    const jsonPre = el("pre", "export", jsonText);
    const tsvPre = el("pre", "export hidden", lines.join("\n"));
    const mkTab = (label, on) => {
      const b = el("button", "tab", label);
      b.type = "button";
      b.addEventListener("click", function () {
        jsonPre.classList.toggle("hidden", !on);
        tsvPre.classList.toggle("hidden", on);
        Array.from(tabs.children).forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
      });
      return b;
    };
    const tJson = mkTab("JSON", true), tTsv = mkTab("Tab-separated", false);
    tJson.setAttribute("aria-pressed", "true");
    tTsv.setAttribute("aria-pressed", "false");
    tabs.appendChild(tJson); tabs.appendChild(tTsv);
    s.appendChild(tabs);
    s.appendChild(jsonPre);
    s.appendChild(tsvPre);

    const row = el("div", "export-actions");

    const dl = el("button", "btn btn-primary", "Download JSON");
    dl.type = "button";
    dl.addEventListener("click", function () {
      try {
        const blob = new Blob([jsonText], { type: "application/json" });
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = fileName;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(href), 4000);
        note("Saved as " + fileName);
      } catch (e) {
        note("Download blocked here — use Copy JSON instead.", true);
      }
    });

    const cpJson = el("button", "btn", "Copy JSON");
    cpJson.type = "button";
    cpJson.addEventListener("click", () => copyText(jsonText, cpJson, "Copy JSON"));

    const cpTsv = el("button", "btn", "Copy tab-separated");
    cpTsv.type = "button";
    cpTsv.addEventListener("click", () => copyText(lines.join("\n"), cpTsv, "Copy tab-separated"));

    const msg = el("span", "hint");
    function note(text, bad) {
      msg.textContent = text;
      msg.style.color = bad ? "var(--bad)" : "var(--ok)";
    }

    row.appendChild(dl); row.appendChild(cpJson); row.appendChild(cpTsv); row.appendChild(msg);
    s.appendChild(row);
    s.appendChild(el("p", "why", "The JSON file carries the section summary, topic breakdown, and one entry per flagged question — attach it in chat and the error log can be updated from it directly."));
    return s;
  }

  function copyText(text, btn, label) {
    const done = () => { btn.textContent = "Copied"; setTimeout(() => (btn.textContent = label), 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  /* ---------------- chrome wiring ---------------- */
  function initTheme() {
    const dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    paintThemeIcon();
    $("themeBtn").addEventListener("click", function () {
      document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      paintThemeIcon();
    });
  }
  function paintThemeIcon() {
    const d = document.documentElement.dataset.theme === "dark";
    $("themeIcon").innerHTML = d
      ? '<path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" stroke-linecap="round"/>'
      : '<circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" stroke-linecap="round" />';
  }

  window.bootSectionLab = function () {
    window.__slReady = true;
    initTheme();
    renderSetGrid();
    updateHint();
    $("startBtn").addEventListener("click", startSection);
    $("nextBtn").addEventListener("click", function () {
      if (S.cur === S.order.length - 1) finish(false); else goTo(S.cur + 1);
    });
    $("prevBtn").addEventListener("click", () => goTo(S.cur - 1));
    $("flagBtn").addEventListener("click", function () {
      S.flags[curKey()] = !S.flags[curKey()];
      renderQuestion();
    });
    $("submitBtn").addEventListener("click", function () {
      const unanswered = S.order.filter((qi) => !hasAnswer(S.set.questions[qi], S.answers[qi])).length;
      if (unanswered && !confirm(unanswered + " question(s) are still unanswered. Submit anyway?")) return;
      finish(false);
    });
    $("pauseBtn").addEventListener("click", function () {
      S.paused = !S.paused;
      if (!S.paused) { S.lastStamp = performance.now(); S.qStamp = performance.now(); }
      else bankTime();
      $("pauseBtn").textContent = S.paused ? "Resume" : "Pause";
    });
    $("loadSetBtn").addEventListener("click", function () {
      const raw = $("setJson").value.trim();
      if (!raw) { loadMsg("Paste a set first.", true); return; }
      try {
        const n = addSetsFromText(raw);
        loadMsg(n === 1 ? "Set added and selected." : n + " sets added.", false);
        $("setJson").value = "";
      } catch (e) {
        loadMsg("Could not load that: " + e.message, true);
      }
    });

    Array.from(document.querySelectorAll("[data-sample]")).forEach(function (b) {
      b.addEventListener("click", function () {
        const path = b.dataset.sample;
        const label = b.textContent.split("\u00b7")[0].trim();
        b.disabled = true;
        loadMsg("Loading " + label + "\u2026", false);
        fetch(path)
          .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
          .then(function (text) {
            const n = addSetsFromText(text, path);
            loadMsg(label + " loaded and selected.", false);
            return n;
          })
          .catch(function (e) {
            const local = location.protocol === "file:";
            loadMsg(local
              ? "Samples need a web server \u2014 open the file with Choose file instead."
              : "Could not fetch that sample (" + e.message + "). Use Choose file instead.", true);
          })
          .then(function () { b.disabled = false; });
      });
    });

    const fileInput = $("fileInput");
    const dz = $("dropzone");
    $("browseBtn").addEventListener("click", () => fileInput.click());
    dz.addEventListener("click", function (e) { if (e.target === dz || e.target.closest(".dz-main, .dz-sub, svg")) fileInput.click(); });
    fileInput.addEventListener("change", function () { readFiles(fileInput.files); fileInput.value = ""; });
    ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, function (e) { e.preventDefault(); dz.dataset.active = "true"; }));
    ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, function (e) { e.preventDefault(); dz.dataset.active = "false"; }));
    dz.addEventListener("drop", function (e) {
      if (e.dataTransfer) readFiles(e.dataTransfer.files);
    });

    function readFiles(files) {
      const list = Array.from(files || []);
      if (!list.length) return;
      let added = 0;
      let pending = list.length;
      const problems = [];
      list.forEach(function (f) {
        const reader = new FileReader();
        reader.onload = function () {
          try { added += addSetsFromText(String(reader.result), f.name); }
          catch (err) { problems.push(err.message); }
          if (--pending === 0) report();
        };
        reader.onerror = function () {
          problems.push(f.name + " could not be read");
          if (--pending === 0) report();
        };
        reader.readAsText(f);
      });
      function report() {
        if (problems.length) loadMsg(problems.join(" · "), true);
        else loadMsg(added === 1 ? "Set added and selected." : added + " sets added.", false);
      }
    }
    document.addEventListener("keydown", function (e) {
      if ($("screenExam").classList.contains("hidden")) return;
      const q = curQ();
      if (/^[a-eA-E]$/.test(e.key) && q.type === "mcq") {
        const i = LETTERS.indexOf(e.key.toUpperCase());
        if (i > -1 && i < q.choices.length) { S.answers[curKey()] = i; renderQuestion(); if (S.reveal) showFeedback(q, curKey()); }
      }
      if (e.key === "ArrowRight" && S.cur < S.order.length - 1) goTo(S.cur + 1);
      if (e.key === "ArrowLeft") goTo(S.cur - 1);
      if (e.key.toLowerCase() === "f") { S.flags[curKey()] = !S.flags[curKey()]; renderQuestion(); }
    });
  };
})();
