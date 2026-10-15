import { COMPONENT_ROLE_ORDER, type AiSuggestion, type ComponentRole } from "./rule-based";

export const LLM_SOURCE = "llm";

/**
 * Real LLM integration via an OpenAI-compatible /chat/completions endpoint.
 * The response is expected to be JSON in the shape { items: [{ name, quantity, reason, role }] }.
 */
export async function resolveWithLlm(idea: string, maxItems = 12): Promise<AiSuggestion[]> {
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!apiKey) throw new Error("LLM_API_KEY is not configured");

  const baseUrl = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  const system = `You are an assistant for a university IoT lab. Given a student's project idea, suggest the COMPLETE hardware kit needed to build it.
Return ONLY valid JSON matching this shape (no extra text):
{"items":[{ "name": "exact hardware component", "quantity": 1, "reason": "short reason", "role": "controller" }]}
- Always include: exactly one controller board, every sensor/actuator/module/display the idea needs, plus essentials ("Breadboard + Jumper Wires" and a power source).
- Use real, buyable component names (e.g. "Arduino Uno R3", "ESP32 Dev Board", "DHT22 Temperature & Humidity Sensor", "HC-SR04 Ultrasonic Sensor").
- Choose the controller sensibly: ESP32 when Wi-Fi/Bluetooth/cloud is needed, Raspberry Pi 4 for camera/vision, otherwise Arduino Uno R3.
- "role" must be one of: ${COMPONENT_ROLE_ORDER.join(", ")}.
- Quantities must be positive integers matching what the build actually needs.
- At most ${maxItems} items.`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: idea },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM returned an empty response");

  return parseLlmItems(content, maxItems);
}

export function parseLlmItems(content: string, maxItems = 12): AiSuggestion[] {
  const jsonBlock = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(jsonBlock) as unknown;
  const raw = Array.isArray(parsed) ? parsed : (parsed as { items?: unknown[] })?.items;
  if (!Array.isArray(raw)) throw new Error("LLM response did not contain an items array");

  const items: AiSuggestion[] = [];
  for (const entry of raw.slice(0, maxItems)) {
    const obj = entry as { name?: unknown; quantity?: unknown; reason?: unknown; role?: unknown };
    const name = typeof obj?.name === "string" ? obj.name.trim() : "";
    if (!name) continue;
    const quantity = Math.max(1, Math.floor(Number(obj.quantity) || 1));
    const role = COMPONENT_ROLE_ORDER.includes(obj.role as ComponentRole) ? (obj.role as ComponentRole) : "module";
    items.push({
      name,
      quantity: Math.min(quantity, 999),
      reason: typeof obj.reason === "string" ? obj.reason : "Recommended for your idea",
      role,
    });
  }
  if (items.length === 0) throw new Error("LLM response contained no usable items");
  return items;
}