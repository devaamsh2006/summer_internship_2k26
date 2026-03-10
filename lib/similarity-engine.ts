// ─── Sentence Transformer Similarity Engine ─────────────────────────────────
// Uses all-MiniLM-L6-v2 via @xenova/transformers for semantic matching.
// All similarity scoring is deterministic — no LLM involvement.

import type { Pipeline } from "@xenova/transformers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipeline: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipelineLoading: Promise<any> | null = null;

/**
 * Get or initialize the embedding pipeline (singleton with lazy loading).
 */
async function getEmbeddingPipeline(): Promise<Pipeline> {
  if (pipeline) return pipeline;
  if (pipelineLoading) return pipelineLoading;

  pipelineLoading = (async () => {
    const { pipeline: createPipeline, env } = await import(
      "@xenova/transformers"
    );

    // Configure for server-side usage
    env.allowLocalModels = false;
    env.useBrowserCache = false;

    const pipe = await createPipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    pipeline = pipe;
    return pipe;
  })();

  return pipelineLoading;
}

/**
 * Compute embedding for a text string.
 * Returns a 384-dimensional vector.
 */
export async function computeEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    return new Array(384).fill(0);
  }

  // Truncate long text to fit model context (128 tokens ~ 512 chars)
  const truncated = text.slice(0, 2000);

  const pipe = await getEmbeddingPipeline();
  const output = await pipe(truncated, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data as Float32Array);
}

/**
 * Compute cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Compute similarity between two text passages.
 */
export async function computeTextSimilarity(
  textA: string,
  textB: string
): Promise<number> {
  const [embA, embB] = await Promise.all([
    computeEmbedding(textA),
    computeEmbedding(textB),
  ]);
  return cosineSimilarity(embA, embB);
}

/**
 * Compute similarity between a skill name and a text passage.
 * Used for semantic skill matching.
 */
export async function computeSkillSimilarity(
  skill: string,
  targetSkill: string
): Promise<number> {
  const [embA, embB] = await Promise.all([
    computeEmbedding(skill),
    computeEmbedding(targetSkill),
  ]);
  return cosineSimilarity(embA, embB);
}

/**
 * Batch compute similarities for multiple skill pairs.
 * More efficient than computing one at a time.
 */
export async function batchComputeSkillSimilarities(
  resumeSkills: string[],
  jdSkills: string[]
): Promise<
  Array<{
    resumeSkill: string;
    jdSkill: string;
    similarity: number;
  }>
> {
  // Compute all embeddings in parallel
  const allSkills = [...new Set([...resumeSkills, ...jdSkills])];
  const embeddings = new Map<string, number[]>();

  const embeddingPromises = allSkills.map(async (skill) => {
    const emb = await computeEmbedding(skill);
    embeddings.set(skill, emb);
  });

  await Promise.all(embeddingPromises);

  // Compute all pairwise similarities
  const results: Array<{
    resumeSkill: string;
    jdSkill: string;
    similarity: number;
  }> = [];

  for (const rSkill of resumeSkills) {
    const rEmb = embeddings.get(rSkill);
    if (!rEmb) continue;

    for (const jSkill of jdSkills) {
      const jEmb = embeddings.get(jSkill);
      if (!jEmb) continue;

      const similarity = cosineSimilarity(rEmb, jEmb);
      results.push({
        resumeSkill: rSkill,
        jdSkill: jSkill,
        similarity,
      });
    }
  }

  return results;
}

/**
 * Check if the similarity engine is ready.
 */
export async function isEngineReady(): Promise<boolean> {
  try {
    await getEmbeddingPipeline();
    return true;
  } catch {
    return false;
  }
}
