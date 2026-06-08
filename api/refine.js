import { generateSaiRefinement, readJson } from "./shared.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJson(req);
    const result = await generateSaiRefinement(body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "SAI refinement failed." });
  }
}
