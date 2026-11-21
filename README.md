# Concept X-Ray

**Marks tell a student *what* is wrong. Concept X-Ray tells them *why*.**

An adaptive exam-prep tutor for CBSE Class 10 Physics (Electricity + Light). It reads a student's **reasoning**, typed or as a photo of their notebook, names the exact misconception, traces it back through a prerequisite graph to its root cause, and rebuilds the student's plan and the teacher's next lesson around it.

**Live app:** https://concept-xray.vercel.app (Gemini on)
**Demo video (3 min, captioned):** `demo/concept-xray-demo.mp4`. In the app, click **Start Demo** for a guided, captioned 21-step walkthrough, or **▶ Demo video**.

## Problem-statement coverage

| Required | How Concept X-Ray does it |
|---|---|
| Diagnostic test | 10 questions across both chapters. Each one collects the option, one line of reasoning and the student's confidence |
| Concept graph for one syllabus | 15 concepts with 14 prerequisite edges (Class 10 Electricity + Light), drawn live with mastery rings |
| Learner model updated after every answer | Bayesian Knowledge Tracing per concept, with guess and slip rates that depend on difficulty |
| Question generation for weak concepts, with difficulty calibration | Targets the weakest concept, or its weaker prerequisite (root-cause tracing). Difficulty is set from mastery to aim for about 70% success. Gemini generates new questions that include a distractor for the student's active misconception |
| Misconception detection from reasoning | Gemini 2.5 Flash classifies typed reasoning or a notebook photo into a 12-item misconception list, quoting the evidence. An offline rule engine using the same list is the fallback |
| Spaced repetition | SM-2 with confidence-weighted quality (being confidently wrong resets a card hardest) and a 15-day timeline |
| Teacher dashboard | Class heatmap, shared misconceptions, students needing attention, a suggested lesson fix, one-click remedial assignment, CSV export |

Beyond the brief:
- **Agent decision trace**: why this question was chosen, step by step
- **Closed loop**: a misconception is marked *Fixed ✅* after two correct, hint-free answers in a row
- **Hint ladder** (nudge → trap warning → method). Each hint lowers the mastery credit, so answers are earned.
- **Proof of Learning report**: before vs now, learning gain, misconception evidence, downloadable for the teacher
- **AI Lab**: runs the held-out answers through live Gemini in the browser, plus a list of the guardrails
- **Verified question generation**: a second, independent Gemini call solves each generated question, and it's discarded if the answers disagree
- **Recall-today %** (FSRS-style retrievability) in the review plan
- **Photo** of handwritten working, **voice** input (en-IN), Hinglish-tolerant reasoning

## Ideas we built on
We studied well-known open-source tutoring projects and implemented their ideas in our own code. No code was copied.

| Project | Idea |
|---|---|
| CAHLR/OATutor, Li-Evan/BloomTutor | Hint ladders, mastery per skill |
| CAHLR/pyBKT, pykt-toolkit | Bayesian Knowledge Tracing |
| open-spaced-repetition/fsrs4anki | Recall probability |
| Eedi "Mining Misconceptions" (Kaggle) | Answer options mapped to misconceptions |
| Cognitive-tutor research (model tracing) | Checking the AI's output rather than trusting it |

## Architecture

```
Browser (vanilla JS, no build)               Serverless (/api, Vercel)
 ├─ data.js    syllabus graph, taxonomy, bank  ├─ analyze.js  → Gemini: reasoning/photo → misconception JSON
 ├─ engine.js  BKT · SM-2 · root cause ·       ├─ generate.js → Gemini: targeted MCQ with a misconception trap
 │             selection · local fallback      └─ health.js   → reports whether AI is live
 ├─ app.js     6 views + teacher analytics     The API key lives only on the server.
 └─ tour.js    guided demo with captions       Every AI call has a timeout and falls back to the local engine.
```

## Evaluation (honest numbers)

`npm run eval` scores the **offline** engine on hand-labelled student responses:

| Set | n | Full engine accuracy | Recall from reasoning text alone |
|---|---|---|---|
| Development (rules written against it) | 40 | 100% | 86% |
| Held-out (new phrasings, rules not tuned on it) | 20 | 100% | **28%** |
| **Gemini, same held-out set, text only** (live, 21 Nov 2026) | 18 with a misconception | — | **78% (14/18)** |

The full engine scores 100% partly because each wrong option is pre-mapped to a misconception. On reasoning text alone, keyword rules don't generalise to new wording (28%). **That is why the live product uses Gemini** for reasoning, and why the rule engine is only an offline fallback. Gemini recalls **78%** of held-out misconceptions from text alone, nearly 3× the rules. Its 4 misses: three phrasings where it returned no misconception, and one it labelled as a sign-convention error instead of a mirror/lens mix-up. We did not tune the prompt on this set. The same held-out set can be re-run through live Gemini from the app's **AI Lab** page. In a spot check on the deployed site, Gemini correctly diagnosed "after passing through a bulb the current reduces" as *current is used up*, with 95% confidence and quoted evidence. That phrasing is one the rules miss.

## Run it

Run the dev server (opens on http://localhost:3000):

```bash
npm run dev
```

To use Gemini, set the key first:

```bash
GEMINI_API_KEY=... npm run dev
```

To deploy, push the folder to Vercel and set `GEMINI_API_KEY` in the project's environment variables.

Re-record the demo video (needs the dev server running):

```bash
node record/record.js
```

## Guardrails
- Hints and explanations come after the attempt. It never just hands over the answer.
- Learner data stays in the browser's localStorage. No accounts are needed for minors.
- AI diagnoses always show their evidence and confidence, so a teacher can override them.
