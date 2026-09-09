export type NouraAiProvider = "vercel-ai-gateway" | "openai" | "local";

type AiConfig = {
  endpoint: string;
  token: string;
  model: string;
  provider: Exclude<NouraAiProvider, "local">;
};

export function getNouraAiConfig(): AiConfig | null {
  const gatewayToken = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (gatewayToken) {
    return {
      endpoint: "https://ai-gateway.vercel.sh/v1/responses",
      token: gatewayToken,
      model: process.env.NOURA_GATEWAY_MODEL || "openai/gpt-5.6-luna",
      provider: "vercel-ai-gateway",
    };
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    return {
      endpoint: "https://api.openai.com/v1/responses",
      token: openAiKey,
      model: process.env.NOURA_AI_MODEL || "gpt-5.6-luna",
      provider: "openai",
    };
  }

  return null;
}

export function getNouraAiStatus() {
  const config = getNouraAiConfig();
  return {
    aiReady: Boolean(config),
    aiProvider: config?.provider || "local",
    aiModel: config?.model || null,
  };
}

export function extractNouraAiText(body: any) {
  if (typeof body?.output_text === "string") return body.output_text;
  const chunks = Array.isArray(body?.output)
    ? body.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : [])
    : [];
  return chunks.map((item: any) => item?.text || "").filter(Boolean).join("\n");
}

export async function generateNouraText(prompt: string, maxOutputTokens = 220) {
  const config = getNouraAiConfig();
  if (!config) return null;

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      input: prompt,
      max_output_tokens: maxOutputTokens,
    }),
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message || body?.message || `${config.provider} ${response.status}`;
    throw new Error(message);
  }

  const text = extractNouraAiText(body).trim();
  if (!text) throw new Error("Empty AI response");
  return { text, provider: config.provider, model: config.model };
}
