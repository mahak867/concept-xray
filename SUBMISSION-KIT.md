# Submission kit: Concept X-Ray

## One-line pitch
Marks tell a student what is wrong. Concept X-Ray reads their reasoning and tells them why, then fixes the root cause.

## Live pitch (90 seconds, then the demo)
1. **Hook (15 s):** "Two students both answer 12 Ω. One added wrong. The other believes parallel resistors add up. Every tutor marks them identically. That's the problem."
2. **Who (15 s):** Class 10 CBSE students preparing for boards, and a teacher with 40 notebooks and no time to read the working in each one.
3. **Demo (as much time as you have):** use Start Demo, or drive it yourself: answer d1 wrong with reasoning → X-Ray → concept map root cause → practice trace → teacher "assign".
4. **Why it's real AI, not a wrapper (20 s):** Gemini reads the reasoning or notebook photo. A probabilistic learner model (BKT) and a prerequisite graph decide what comes next. SM-2 schedules reviews. Every decision is visible in the trace.
5. **Honesty slide (10 s):** "Our offline rules recall only 28% from reasoning text alone on held-out data. That's exactly why the live product uses Gemini." Judges trust teams that measure.

## Likely judge questions
- **"Isn't this just ChatGPT?"** No. The LLM does one narrow job: classifying the reasoning against our list. Mastery, selection, root cause and scheduling are deterministic models you can inspect.
- **"How do you know the diagnosis is right?"** It always shows the quoted evidence and a confidence score. Our labelled eval set is in `eval/`, and teachers can override.
- **"Why Class 10 physics?"** It's high-stakes (board exams). The misconceptions are well documented, and the concepts form a clear prerequisite chain.
- **"What's next?"** Run the held-out eval through Gemini, add the remaining chapters, and pilot with one school's Class 10 section.

## Before you submit (do these yourself)
- [ ] Talk to 3–5 Class 10 students or juniors. Add one real quote and one number to the pitch. This is worth up to 20 points.
- [ ] Deploy to Vercel with `GEMINI_API_KEY` and check that the pill reads "● Gemini live".
- [ ] Try the photo upload once with a real handwritten working.

## LinkedIn posts (rewrite in your own voice and tag @Product Space)

**Post 1: You're in**
Building today at the @Product Space Agentic AI Hackathon.
I picked the adaptive exam-prep tutor problem. In Class 10, I lost marks for reasoning nobody ever looked at: the answer was wrong, so the working didn't matter.
My idea: Concept X-Ray. It reads a student's reasoning (or a photo of their notebook), names the exact misconception, and traces it back to the concept that's actually broken.
Wish me luck. Updates through the day.
#AIHackathon #ProductSpace #BuildInPublic #EdTech

**Post 2: Progress (attach a screenshot of the Reasoning X-Ray)**
Mid-build update. A student writes "the first bulb uses up some of the current." Concept X-Ray flags *current is used up*, quotes those exact words, drops their mastery of the concept and schedules a review.
Something I learned: my keyword rules recall only 28% of misconceptions on phrasings they weren't written for. That's exactly why the reasoning step needs an LLM, and why I measured it before claiming anything.
#BuildInPublic #ProductSpace

**Post 3: Shipped (attach the demo video)**
Shipped: Concept X-Ray 🎯
- Diagnoses why a student is wrong, from their reasoning or a notebook photo
- A live learner model across a 15-concept physics graph, with root-cause tracing
- Spaced-repetition plan and a teacher dashboard that turns shared misconceptions into a 10-minute lesson fix
My key takeaway: the AI matters most where it's narrowest. One sharp job, with evidence shown.
What's one physics misconception you had in school? 👇 (Replies boost reach. Answer every comment.)
#AIHackathon #ProductSpace #EdTech
