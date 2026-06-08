# EthosGuard SAI Demo

## What this is
A three-column customer-discovery demo:

- Column one: the polished mainstream model answer being evaluated, such as a ChatGPT, Claude, or Gemini response.
- Column two: Sefirotic diagnosis, risk, dimension scores, analysis, and flags.
- Column three: the SAI-refined positive response and a short synthesis of what changed.

## Public GitHub Pages mode
GitHub Pages can host the static demo publicly for prospects.

In this mode, users can:

- View the curated showcase rows.
- Use the Custom test row.
- Paste an original prompt and a mainstream AI answer.
- See the rule-based Sefirotic diagnosis and SAI-refined output.

GitHub Pages cannot securely run live OpenAI, Claude, or Gemini API calls because it is static hosting.

## Showcase rows
The demo includes four curated rows:

- Wellness chatbot crisis language.
- Automated loan denial letter.
- Hallucinated legal citations.
- Bereaved customer retention message.

## SAI model
The working SAI chain is captured in `SAI_MODEL.md`.

Dion / Dejan's foundation is captured in `DION_FOUNDATION.md`.

The MVP model is:

1. Diagnose what the situation requires before scoring the answer.
2. Score the mainstream answer against that Sefirotic prescription.
3. Retrieve the relevant SAI principles for the imbalance.
4. Generate the refined answer that reflects tikkun rather than tohu.
5. Explain what changed in plain language for the demo buyer.

## Local live mode
For live model generation and the stronger `/api/refine` chain, run the local backend instead:

1. Copy `.env.example` to `.env.local`.
2. Add at least one provider key, such as `OPENAI_API_KEY`.
3. Run `npm start`.
4. Open `http://localhost:4173`.

The live path is:

Original prompt -> selected mainstream model API -> column one model answer -> EthosGuard SAI five-step chain -> column two diagnosis -> column three SAI-refined response.

## Vercel live hosting
Vercel is the right public hosting target for the live version because it can serve `index.html` and run the private API routes in `api/generate.js` and `api/refine.js`.

Deploy flow:

1. Import this GitHub repo into Vercel: `Amichai770/ethosguard-sai-demo`.
2. Use the default framework preset, or choose Other.
3. Add environment variables such as `OPENAI_API_KEY` and `OPENAI_MODEL` in the Vercel project dashboard.
4. Deploy or redeploy.

Without environment variables, the public Vercel page still loads, but live model calls return a key-missing message and the UI falls back to local demo logic.

## Next build step
Build a curated gold set of 20 to 50 scenarios, compare the SAI chain outputs against Rabbi-reviewed answers, then turn the strongest examples and source principles into a source-grounded retrieval library. Full fine-tuning comes later, after hundreds or thousands of high-quality pairs exist.
