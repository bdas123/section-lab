# Question set format (Section Lab)

No sets ship with the app. Any section works — Quant, Verbal, Data Insights — as long as the set follows this shape. On the setup screen, drop a `.json` file onto the loader (or pick it with Choose file), or paste the JSON and press Add set. A file may hold one set object or an array of sets. Two ready-made sets are in `example-sets/`.

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
| `stimulus` | no | `{ text: "...", table: { headers: [...], rows: [[...]] } }` — reading passage, prompt, or data table |
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
