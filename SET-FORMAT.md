# Question set format (Section Lab)

Any section works — Quant, Verbal, Data Insights — as long as the set follows this shape. Add a file in `sets/` and a `<script>` tag in `index.html`, or paste the JSON into "Load a new question set" on the setup screen.

```js
window.registerSet({
  id: "verbal-01",
  title: "Verbal Section 1 — CR Focus",
  section: "Verbal Reasoning",
  minutes: 45,                 // whole-section countdown
  note: "Optional one-line description shown on the set card.",
  questions: [ /* see below */ ]
});
```

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
