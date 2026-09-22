# How to use Section Lab

A complete walkthrough, from opening the app to logging your errors. No setup, no account, no install.

## 1. Open the app

Pick whichever is easiest:

- **Download the repo** — click Code → Download ZIP on GitHub, unzip it, and double-click `index.html`. It runs straight from your file system, offline included.
- **Clone it**
  ```bash
  git clone https://github.com/bdas123/section-lab.git
  cd section-lab
  open index.html          # macOS. Linux: xdg-open index.html. Windows: double-click the file.
  ```
- **Host it** — it is plain static files, so GitHub Pages, Netlify, or `python3 -m http.server 8000` all work.

Everything happens in your browser. Nothing is uploaded and nothing is stored on a server.

## 2. Load a question set

The app starts empty by design — you bring the questions. Three ways to load a set:

1. **Drag and drop** a `.json` file onto the dashed panel.
2. **Choose file** to pick one or several files at once.
3. **Paste JSON** into the box on the right and press Add set.

Start with the samples in `example-sets/`:

| File | What it is |
| --- | --- |
| `quant-01.json` | 21 Problem Solving questions, 45 minutes — a full quant section |
| `di-demo.json` | 4 Data Insights questions in 10 minutes, showing tables, multi-select, and two-part |
| `latex-sample.json` | 3 questions demonstrating LaTeX math rendering |

Each loaded set shows as a card with its question count, time limit, and average seconds per question. Click a card to select it. Remove clears it. Sets live in the tab only, so reload the page and you start clean.

If a file is malformed, the app tells you exactly what is wrong ("question 4 needs an 'answer' index within its choices") and refuses to load it, so you never discover a broken question 20 minutes into a timed section.

## 3. Choose your mode

Three checkboxes above the Start button:

- **Shuffle question order** — different sequence each attempt, so retakes are not muscle memory.
- **Practice mode (allow pausing)** — enables the Pause button. Leave it off for a real timed rehearsal.
- **Show answer after each question** — immediate feedback. Useful for learning a new topic, useless for pacing practice.

Then press **Start section**.

## 4. Take the section

- One countdown runs for the entire section. It turns amber at 20% remaining and red at 7%. At zero the section submits itself, exactly like the real exam.
- The small clock above each question shows your time on that question versus its target.
- **Keyboard shortcuts:** `A`–`E` select a choice, `←` / `→` move between questions, `F` flags the current question.
- The number palette at the bottom shows answered, flagged, and unanswered questions. Click any number to jump.
- **Submit section** ends early. If anything is unanswered you get one confirmation.

Work it like the real thing: do not look anything up, and do not pause on a timed run. The value of the report comes entirely from honest timing data.

## 5. Read the report

The report is built to answer one question — where did the points actually go?

- **Headline** — raw correct count and percentage, plus a rough score band. The band is a non-adaptive approximation, so use it to track your own trend, not to predict an official score.
- **Six cards** — time used, average per question versus target, questions over target, careless misses, and unanswered.
- **What actually cost you points** — every miss and slow solve grouped by cause, so you can see at a glance whether the section was a knowledge problem or a clock problem.
- **Pacing curve** — your cumulative time against an even-pace benchmark. Above the dashed line means you are behind schedule. Red dots mark misses, which usually cluster right after a time sink.
- **Accuracy by topic and by difficulty** — weakest topic first, with average time per topic.
- **Question-by-question review** — your answer, the key, a diagnosis, and a collapsible full solution for each question.

Diagnoses come from correctness plus time against target:

| Label | Meaning |
| --- | --- |
| Clean | Correct, on pace |
| Slow solve | Correct, 15–50% over target |
| Time sink | Correct, more than 50% over target |
| Careless | Wrong in under half the target time — you knew it and rushed |
| Content gap | Wrong at normal pace — you did not know it |
| Content gap + sink | Wrong and slow — the worst combination |
| Unanswered | Ran out of clock |

The distinction matters because the fixes are opposite. Careless misses need a process change; content gaps need study time.

## 6. Export your error log

At the bottom of the report:

- **Download JSON** saves a file named like `2026-09-22-quant-section-1-error-log.json` with the section summary, topic breakdown, and one entry per missed or off-pace question (topic, difficulty, your answer, the key, seconds, target, seconds over target, error type, diagnosis, and takeaway).
- **Copy tab-separated** puts the same rows on your clipboard ready to paste into a spreadsheet error log.

Do this before closing the tab — nothing is saved anywhere else.

## 7. Write your own sets

A set is one JSON object. The complete schema is in [SET-FORMAT.md](SET-FORMAT.md), but this is the shape:

```json
{
  "id": "verbal-01",
  "title": "Verbal Section 1 — CR Focus",
  "section": "Verbal Reasoning",
  "minutes": 45,
  "note": "One line shown on the set card.",
  "questions": [
    {
      "topic": "Critical Reasoning",
      "diff": "Hard",
      "target": 105,
      "stem": "The question text.",
      "choices": ["First", "Second", "Third", "Fourth", "Fifth"],
      "answer": 2,
      "why": "Explanation shown in review."
    }
  ]
}
```

- `answer` is a zero-based index, so `2` means choice C.
- Set `"type": "multi"` with an `answers` array for select-all questions, or `"type": "twopart"` with `twoPartHeaders` and a two-element `answers` array for two-part analysis.
- Add `stimulus` with `text` and/or `table` for a passage or data set.
- `topic`, `diff`, and `target` drive all the analysis. If you leave targets out, the pacing diagnosis is meaningless — set them to what a strong test-taker should need.
- A file can hold one set object or an array of sets.

**LaTeX** works in every text field: `$ ... $` or `\( ... \)` inline, `$$ ... $$` or `\[ ... \]` for display. Inside JSON, backslashes double up: `"$\\frac{3}{4}$"`, `"$\\sqrt{x^3}$"`. Broken math shows as red plain text rather than breaking the question.

### Generating sets with an LLM

Sets are just JSON, so an assistant can write them. A prompt that works:

> Write a Section Lab question set as a single JSON object with `id`, `title`, `section`, `minutes`, and a `questions` array. Give me 21 GMAT Focus-style Problem Solving questions in 45 minutes, spread across percents, number properties, algebra, rates, ratios, statistics, exponents, and probability. Each question needs `topic`, `diff` (Easy/Medium/Hard), `target` in seconds, `stem`, five `choices`, a zero-based `answer`, and a `why` explanation. Use LaTeX for all math with doubled backslashes for JSON. Return only the JSON.

Then drop the result into the app. If anything is malformed, the loader names the offending question.

## Suggested routine

1. Run one timed section cold, no notes, no pausing.
2. Export the error log immediately.
3. Review the pacing curve first, then the per-question diagnoses.
4. Log content gaps into whatever study system you use, and write a one-line takeaway for every careless miss.
5. Retake the same set a week later with shuffle on, and compare the pacing curves.

The report is more useful than the score. A 70% section where every miss was a content gap and pacing was even is a much better position than an 85% held together by two rushed guesses and a 4-minute time sink.
