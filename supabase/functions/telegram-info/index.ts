// Returns the public bot username so the client can build a t.me deep link.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  let username = Deno.env.get("TELEGRAM_BOT_USERNAME") || "";
  if (!username) {
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (token) {
      try {
        const r = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const j = await r.json();
        if (j?.ok && j?.result?.username) username = j.result.username;
      } catch (e) {
        console.error("getMe failed", e);
      }
    }
  }
  return new Response(JSON.stringify({ username }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
