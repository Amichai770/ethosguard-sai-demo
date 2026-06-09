export async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

export async function generateModelAnswer({ provider, prompt, domain }) {
  if (!prompt || !prompt.trim()) {
    throw new Error("Add an original prompt before generating a model answer.");
  }

  const normalizedProvider = provider || "ChatGPT";
  const input = [
    `Domain: ${domain || "General AI response"}`,
    "Respond as a capable mainstream AI assistant. Be polished, helpful, and concise enough to fit a demo column.",
    "",
    prompt.trim()
  ].join("\n");

  if (normalizedProvider === "ChatGPT") {
    return { provider: normalizedProvider, answer: await callOpenAI(input) };
  }
  if (normalizedProvider === "Claude") {
    return { provider: normalizedProvider, answer: await callAnthropic(input) };
  }
  if (normalizedProvider === "Gemini") {
    return { provider: normalizedProvider, answer: await callGemini(input) };
  }

  return { provider: normalizedProvider, answer: await callOpenAI(input) };
}

export async function generateSaiRefinement({ prompt, domain, standard, provider }) {
  if (!prompt || !prompt.trim()) {
    throw new Error("Add the original prompt before generating the SAI refinement.");
  }
  if (!standard || !standard.trim()) {
    throw new Error("Add or generate the mainstream AI answer before generating the SAI refinement.");
  }

  const input = buildSaiChainPrompt({
    prompt: prompt.trim(),
    domain: domain || "General AI response",
    standard: standard.trim(),
    provider: provider || "Mainstream AI"
  });

  const text = await callOpenAI(input, {
    maxOutputTokens: 1700,
    responseFormat: {
      type: "json_schema",
      name: "ethosguard_sai_refinement",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["overall", "risk", "review", "dimensions", "analysis", "flags", "synthesis", "refined", "changes"],
        properties: {
          overall: { type: "number", minimum: 0, maximum: 100 },
          risk: { type: "string" },
          review: { type: "string" },
          dimensions: {
            type: "array",
            minItems: 10,
            maxItems: 10,
            items: { type: "number", minimum: 0, maximum: 100 }
          },
          analysis: { type: "string" },
          flags: {
            type: "array",
            minItems: 1,
            maxItems: 6,
            items: { type: "string" }
          },
          synthesis: { type: "string" },
          refined: { type: "string" },
          changes: {
            type: "array",
            minItems: 3,
            maxItems: 5,
            items: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: { type: "string" }
            }
          }
        }
      },
      strict: true
    }
  });

  return { provider: "EthosGuard SAI", ...normalizeSaiScores(JSON.parse(text)) };
}

function normalizeSaiScores(result) {
  const scaleIfNeeded = (value) => {
    if (typeof value !== "number") return value;
    return value <= 10 ? Math.round(value * 10) : Math.round(value);
  };

  return {
    ...result,
    overall: scaleIfNeeded(result.overall),
    dimensions: Array.isArray(result.dimensions)
      ? result.dimensions.map(scaleIfNeeded)
      : result.dimensions
  };
}

function buildSaiChainPrompt({ prompt, domain, standard, provider }) {
  return [
    "B\"H",
    "You are EthosGuard SAI, a Sefirotic AI refinement engine for enterprise AI governance.",
    "",
    "Core principle: refine the output so it reflects tikkun, not tohu. Tohu is an isolated Sefirah acting alone: warmth without boundaries, certainty without humility, restraint without compassion, action without consequence. Tikkun is integrated balance.",
    "",
    "Dion / Dejan foundation: SAI is a governance protocol, not a spiritual coating. The Sefirot are operational controls between raw AI output and real-world action. The system must identify what is significant now, especially safety, dignity, compliance, traceability, governability, auditability, and human consequence. Mainstream LLMs may echo these ideas statistically; SAI assigns them priority through Keter/purpose, structures them through Binah, enforces them through Gevurah, explains them through Hod, and tests them in Malchut.",
    "",
    "Use the five-prompt chain internally:",
    "1. Diagnose what this situation requires before judging the answer. Identify the significant issue beneath the surface, dominant Sefirah, sub-Sefirah inflection, ballast Sefirot, klipa patterns, and practical prescription.",
    "2. Score the mainstream answer against that prescription across the ten dimensions.",
    "3. Retrieve the relevant SAI principles: Chesed requires Gevurah, Gevurah requires Chesed, Tiferet harmonizes, Hod verifies and speaks humbly, Yesod preserves trust and handoff, Malchut stress-tests real-world consequence.",
    "4. Generate a refined answer that could actually be sent to the user or customer.",
    "5. Explain what changed in plain language for a non-Kabbalist buyer.",
    "",
    "Ten dimensions, in order: Keter/Purpose, Chochmah/Possibility and threat potential, Binah/Logic and structure, Chesed/Compassion, Gevurah/Restraint and enforcement, Tiferet/Balance, Netzach/Influence and persistence, Hod/Truth and auditability, Yesod/Trust and handoff, Malchut/Consequence.",
    "All numeric scores must use a 0-100 scale, not a 0-10 scale. Example: use 82, not 8.2 or 8.",
    "",
    "Refinement rules:",
    "- Preserve what is useful in the mainstream answer.",
    "- Do not make the mainstream AI artificially weak or foolish.",
    "- Correct ethical imbalance without sermonizing or using spiritual jargon in the customer-facing refined answer.",
    "- Add verification, uncertainty, escalation, human review, or concrete next steps when needed.",
    "- Never invent legal citations, medical claims, policies, facts, or guarantees.",
    "- In crisis/self-harm contexts, prioritize immediate safety, emergency support, and connection to another human.",
    "",
    `Domain: ${domain}`,
    `Mainstream model: ${provider}`,
    "",
    "Original prompt:",
    prompt,
    "",
    "Mainstream AI answer:",
    standard,
    "",
    "Return only valid JSON matching the requested schema. The refined answer should be the actual column-three response. The analysis may mention Sefirot; the refined answer should be accessible to a general user."
  ].join("\n");
}

async function callOpenAI(input, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set on the server.");

  const body = {
    model: process.env.OPENAI_MODEL || "gpt-4.1",
    input,
    max_output_tokens: options.maxOutputTokens || 700
  };
  if (options.responseFormat) body.text = { format: options.responseFormat };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "OpenAI request failed.");
  return data.output_text || extractOpenAIText(data) || "";
}

function extractOpenAIText(data) {
  return data.output
    ?.flatMap((item) => item.content || [])
    ?.filter((content) => content.type === "output_text")
    ?.map((content) => content.text)
    ?.join("\n")
    ?.trim();
}

async function callAnthropic(input) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set on the server.");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
      max_tokens: 700,
      messages: [{ role: "user", content: input }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Anthropic request failed.");
  return data.content?.filter((part) => part.type === "text").map((part) => part.text).join("\n").trim() || "";
}

async function callGemini(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set on the server.");

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: input }] }],
      generationConfig: { maxOutputTokens: 700 }
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Gemini request failed.");
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n").trim() || "";
}
