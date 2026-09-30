# Question set format (Section Lab)

No sets ship with the app. Any section works — Quant, Verbal, Data Insights — as long as the set follows this shape. On the setup screen, drop a `.json` file onto the loader (or pick it with Choose file), or paste the JSON and press Add set. A file may hold one set object or an array of sets. Ready-made sets are in `example-sets/`.

```json
{
  "id": "verbal-01",
  "title": "Verbal Section 1 — CR Focus",
  "section": "Verbal Reasoning",
  "minutes": 45,
  "note": "Optional one-line description shown on the set card.",
  "questions": [ ... ]
}
```

`minutes` is the whole-section countdown. Anything malformed is rejected on load with the reason, so a bad set never starts a timed section.

`section` also picks the percentile table the report uses: a name containing "Quant", "Verbal", or "Data Insights" maps to that section's official distribution. To override, add `"percentileTable": "quant"`, `"verbal"`, `"di"`, or `"none"` (hides the percentile panel, e.g. for mixed drills).

Difficulty drives the score calibration. `diff` labels containing Easy, Medium, Hard, or Very hard (or 500/600/700/800-level) map to levels 67, 75, 82, and 86 on the section scale. To use your own labels or levels, add a set-level map such as `"difficultyLevels": {"Foundation": 66, "Core": 74, "Stretch": 83}`, or give a single question a numeric `"level": 80`. Unrecognised labels count as 75.

## Score context (where you stand coming in)

Add `scoreContext` to a set to record your current score range for all three sections on the day you take it. After the section, the report adds **Effect on your overall score**: the projected total coming in, the projected total with this section's new estimate swapped in (the other two held), the change in points, and both percentiles. In a full three-section exam all three sections are swapped in; the first set with a `scoreContext` supplies the starting point.

```json
"scoreContext": {
  "week": 3,
  "day": 2,
  "date": "2026-09-30",
  "basedOn": "4 Section Lab sessions, Sep 28–30",
  "average": { "quant": 80.5, "verbal": 81.0, "di": 82.3, "total": 625 },
  "quant": [78, 82],
  "verbal": [79, 83],
  "di": [80, 84]
}
```

- Each range is `[low, high]`, `{"low": 78, "high": 82}`, or a single score, all whole numbers from 60 to 90. The width of the range is treated as its uncertainty.
- Include the section you're about to take as well, so the report can show that section's own change.
- `week`, `day`, `date`, and an optional `label` (e.g. `"Week 3 · Day 2"`) are shown on the set card and in the report.
- `average` (optional) holds this week's average section scores (60–90, decimals allowed) and `total` (205–805). The report adds a Week average column and compares this session's estimate with it.
- `basedOn` (optional) is a one-line note on where the numbers came from, shown in the report.
- If a section is missing, the report still shows the section change but can't project the "coming in" total.
- The exported JSON carries the result under `summary.overallImpact` (or top-level `overallImpact` for a full exam).

## Question fields

| Field | Required | Notes |
|---|---|---|
| `stem` | yes | The question itself |
| `choices` | yes | Array of answer options (any length) |
| `answer` | mcq | Index of the correct choice |
| `answers` | multi / twopart | Array of correct indices |
| `type` | no | `mcq` (default), `multi` (select all), `twopart` (two columns) |
| `topic` | recommended | Drives the accuracy-by-topic breakdown |
| `diff` | recommended | `Easy` / `Medium` / `Hard` |
| `target` | no | Target seconds; defaults to section time ÷ question count |
| `why` | recommended | Explanation shown in review and pushed to the error-log export |
| `stimulus` | no | `{ title?, text: "..." or ["para 1", "para 2"], table?: { headers: [...], rows: [[...]] }, layout?: "split" \| "stacked" }` — reading passage, argument, or data table |
| `passage` | no | name of a shared passage in the set's top-level `passages` object (see Multiple paragraphs) |
| `twoPartHeaders` | twopart | `["Column A label", "Column B label"]` |

## Diagnosis rules

Each question is tagged automatically from accuracy plus time against its target: Clean, Slow solve (>15% over), Time sink (>50% over), Careless (wrong in under half the target), Content gap, Content gap + sink, Unanswered. Those tags are what feed the error-log export.

## LaTeX

Math is rendered with KaTeX (bundled in `vendor/katex/`, so it works offline). Every text field accepts LaTeX: `stem`, `choices`, `why`, `twoPartHeaders`, `stimulus.text`, and `stimulus.table` headers and cells.

| Delimiter | Mode |
| --- | --- |
| `$ ... $` | inline |
| `\( ... \)` | inline |
| `$$ ... $$` | display block |
| `\[ ... \]` | display block |

Because sets are JSON, backslashes must be escaped: write `"$\\frac{3}{4}$"` to get \(\frac{3}{4}\), and `"$\\sqrt{x^3}$"` for a root. Literal dollar amounts inside math should use `\\$`, or keep them outside the math delimiters. Malformed expressions render in red as plain text instead of breaking the section, so a typo never blocks a timed run.

## Bold, italics, and underline

Every text field that accepts LaTeX also accepts inline formatting:

| You write (in the JSON string) | Renders as |
| --- | --- |
| `**text**` | bold |
| `\\textbf{text}` | bold |
| `\\emph{text}` or `\\textit{text}` | italic |
| `\\underline{text}` | underline |
| `\\*\\*` | literal `**` |

- Formatting can wrap math: `"**the greatest value of $x$**"` bolds the sentence and still renders `$x$`.
- Math spans are passed to KaTeX untouched, so `**` inside `$...$` is not treated as bold, and `\\textbf{}` inside math is KaTeX's own bold.
- Unclosed markers (a lone `**` or a `\\textbf{` with no closing brace) are left as plain text rather than bolding the rest of the question.
- Critical Reasoning boldface questions: put the argument in `stimulus.text` with the two portions wrapped in `**...**`, and ask about their roles in `stem`. See `example-sets/boldface-demo.json`.
- The exported error log keeps the raw markers, so a stem round-trips unchanged.

## Multiple paragraphs and shared passages

`stimulus.text`, `stem`, and `why` can hold several paragraphs:

- Separate paragraphs with a blank line: `"First paragraph.\n\nSecond paragraph."`
- Or pass an array of strings, one per paragraph: `"text": ["First paragraph.", "Second paragraph."]`
- A single `\n` inside a paragraph is a line break (useful for dialogue-style CR arguments).

Reading comprehension sets usually ask 3–4 questions about one passage. Instead of repeating it, define it once at the top level and reference it by name:

```json
{
  "title": "RC Drill 1",
  "section": "Verbal Reasoning",
  "minutes": 7,
  "passages": {
    "coral": { "title": "Passage", "text": ["Paragraph one...", "Paragraph two...", "Paragraph three..."] }
  },
  "questions": [
    { "passage": "coral", "topic": "RC · Main idea", "stem": "The primary purpose of the passage is to", "choices": ["..."], "answer": 1, "why": "..." },
    { "passage": "coral", "topic": "RC · Detail", "stem": "According to the passage, ...", "choices": ["..."], "answer": 2, "why": "..." }
  ]
}
```

A passage entry can also be a plain string or array. Anything in a question's own `stimulus` overrides the shared passage's fields.

**Layout.** When a stimulus has two or more paragraphs (or runs past about 900 characters) and no table, it sits in a scrollable column beside the question on screens 960px and wider, like the real exam; on narrow screens it stacks above. Set `"layout": "split"` or `"layout": "stacked"` on the stimulus to override. See `example-sets/rc-demo.json`.
