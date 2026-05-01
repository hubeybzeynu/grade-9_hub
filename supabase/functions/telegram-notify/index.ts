// Sends a Telegram message to the admin chat.
// Used by the frontend for: ratings, feedback, support, and "new visitor" pings.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const kind: string = body?.kind || "feedback";
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 100) : "";
    const email = typeof body?.email === "string" ? body.email.trim().slice(0, 255) : "";
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 2000) : "";
    const rating = typeof body?.rating === "number"
      ? Math.max(1, Math.min(5, Math.round(body.rating)))
      : null;

    const TG_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const TG_CHAT = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
    if (!TG_TOKEN || !TG_CHAT) {
      return new Response(JSON.stringify({ error: "Telegram not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ts = new Date().toLocaleString("en-US", {
      month: "numeric", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
    });

    let text = "";
    if (kind === "rating" && rating) {
      const stars = "⭐️".repeat(rating);
      text =
        `📝 <b>New App Rating</b>\n\n` +
        `${stars}  (${rating}/5)\n\n` +
        `👤 <b>From:</b> ${escapeHtml(name || "Anonymous")}\n` +
        `📧 <b>Email:</b> ${escapeHtml(email || "—")}\n` +
        (message ? `💬 ${escapeHtml(message)}\n` : "") +
        `\n🕐 ${escapeHtml(ts)}`;
    } else if (kind === "visitor") {
      text =
        `🟢 <b>New Visitor</b>\n\n` +
        (name ? `👤 ${escapeHtml(name)}\n` : "") +
        `🕐 ${escapeHtml(ts)}`;
    } else {
      text =
        `🆕 <b>${escapeHtml(kind === "support" ? "Support request" : "Feedback")}</b>\n` +
        (name ? `👤 <b>Name:</b> ${escapeHtml(name)}\n` : "") +
        (email ? `✉️ <b>Email:</b> ${escapeHtml(email)}\n` : "") +
        `💬 ${escapeHtml(message || "(no message)")}\n` +
        `🕐 ${escapeHtml(ts)}`;
    }

    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("Telegram failed:", r.status, t);
      return new Response(JSON.stringify({ error: "Telegram send failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("telegram-notify error:", e);
    return new Response(JSON.stringify({ error: "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
