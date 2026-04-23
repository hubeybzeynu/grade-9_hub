// Edge function: AI math / physics / chemistry / trigonometry tutor.
// Calls Lovable AI Gateway and returns a structured JSON answer.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a Grade 9 STEM tutor. The user will ask math, physics, chemistry, or trigonometry questions.
Respond with a SINGLE JSON object (no markdown, no code fences) of this shape:
{
  "answer": "short plain-text final answer",
  "steps": ["step 1", "step 2", "..."],
  "plot": null
        | { "type": "quadratic", "a": number, "b": number, "c": number, "roots": number[] }
        | { "type": "function", "expr": "math.js expression in x", "xmin": number, "xmax": number }
        | { "type": "triangle", "angleA": number, "opposite"?: string, "adjacent"?: string, "hypotenuse"?: string, "caption"?: string }
}
Rules:
- For quadratic equations or y = ax^2+bx+c, include plot.type = "quadratic" with numeric a,b,c and roots.
- For "graph", "plot", or "draw f(x)=…", include plot.type = "function" using a math.js expression in x.
- For trigonometry questions involving a right-angled triangle (sin/cos/tan, finding a side/angle, SOH-CAH-TOA), ALWAYS:
  * Show the answer with units.
  * In "steps", explicitly write SOH-CAH-TOA, identify opposite/adjacent/hypotenuse, set up the equation, solve.
  * Include plot.type = "triangle" with the relevant angle (degrees) and labelled side strings (e.g. "20", "x", "√3").
- Otherwise plot is null.
- Keep steps concise, one logical step per item, plain unicode (no LaTeX).
- Output JSON only, no prose around it.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'question'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: question },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("Gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content: string = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { answer: content, steps: [], plot: null };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-solve error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
