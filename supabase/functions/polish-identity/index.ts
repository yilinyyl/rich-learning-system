import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type PolishRequest = {
  target?: "action" | "evidence" | "future";
  sentence?: string;
  action?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function cleanSecret(value: string | undefined) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function isSafeHeaderValue(value: string) {
  return /^[\x20-\x7E]+$/.test(value);
}

function allowedEmails() {
  return cleanSecret(Deno.env.get("ALLOWED_EMAILS"))
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function outputText(data: any) {
  if (typeof data?.choices?.[0]?.message?.content === "string") {
    return data.choices[0].message.content;
  }

  if (typeof data?.output_text === "string") return data.output_text;

  return (data?.output || [])
    .flatMap((item: any) => item?.content || [])
    .map((content: any) => content?.text || "")
    .filter(Boolean)
    .join("\n");
}

function extractJson(text: string) {
  const direct = text.trim();
  try {
    return JSON.parse(direct);
  } catch {
    const match = direct.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI response was not JSON.");
    return JSON.parse(match[0]);
  }
}

function extractIdentityLines(text: string) {
  return String(text || "")
    .split(/\r?\n|(?=我是)/)
    .map((line) =>
      line
        .replace(/^[-*\d.、\s]+/, "")
        .replace(/^["“”']+|["“”']+$/g, "")
        .trim()
    )
    .filter((line) => line.startsWith("我是"));
}

function normalizeSuggestions(items: unknown[], original: string, target: "action" | "evidence" | "future") {
  const seen = new Set<string>();

  return items
    .map((item) => String(item || "").replace(/\s+/g, " ").trim())
    .filter((item) => (target === "action" ? !item.startsWith("我是") : item.startsWith("我是")))
    .filter((item) => item.length >= (target === "action" ? 6 : 8) && item.length <= 180)
    .filter((item) => {
      const key = item.replace(/[，。,.!?！？\s]/g, "");
      if (!key || key === original.replace(/[，。,.!?！？\s]/g, "") || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const openRouterKey = cleanSecret(Deno.env.get("OPENROUTER_API_KEY"));
    if (!openRouterKey) {
      return jsonResponse({ error: "OPENROUTER_API_KEY is not configured." });
    }
    if (!isSafeHeaderValue(openRouterKey)) {
      return jsonResponse({ error: "OPENROUTER_API_KEY contains invalid characters. Please reset the secret with only the sk-or-... key text." });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization") || "";

    if (!supabaseUrl || !supabaseAnonKey || !authHeader) {
      return jsonResponse({ error: "Login is required for AI polishing." });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: "Login is required for AI polishing." });
    }

    const allowlist = allowedEmails();
    const userEmail = String(userData.user.email || "").toLowerCase();
    if (!allowlist.length) {
      return jsonResponse({ error: "AI polishing is locked. Please set ALLOWED_EMAILS in Supabase secrets." });
    }
    if (!allowlist.includes(userEmail)) {
      return jsonResponse({ error: "This account is not allowed to use AI polishing." });
    }

    const body = (await req.json().catch(() => ({}))) as PolishRequest;
    const sentence = String(body.sentence || "").replace(/\s+/g, " ").trim();
    const action = String(body.action || "").replace(/\s+/g, " ").trim();
    const target = body.target === "action" ? "action" : body.target === "future" ? "future" : "evidence";

    if (!sentence || sentence.length > 180) {
      return jsonResponse({ error: "Please send one short sentence." });
    }

    if (target !== "action" && !sentence.startsWith("我是")) {
      return jsonResponse({ error: "Please send one short sentence starting with 我是." });
    }

    const task =
      target === "action"
        ? "把这句第一步行动优化成更清楚、更具体、更容易执行的中文句子。"
        : target === "future"
        ? "把这句未来身份显化句优化成更自然、更贴近原意、更容易想象的中文句子。"
        : "把这句行动证据优化成更自然、更贴近原意、更具体的中文句子。";

    const formatRule =
      target === "action"
        ? "- 第一结果必须是行动句，不要以“我是”开头。\n- 每一句都要说清楚用户刚刚做了什么，适合放在“第一步”。"
        : "- 每一句都必须以“我是”开头。";

    const prompt = `
你是一个中文写作助手，任务是优化用户写下的一句成长记录。

规则：
- 必须保留用户原意，不要换主题，不要硬套模板。
${formatRule}
- 不要提到 AI、模型、prompt、系统、资料来源。
- 不要夸张承诺，不要写玄学保证，不要写“一定会发财”。
- 语气：温柔、清楚、有力量、适合个人成长和显化练习。
- 返回 4 句，每句 35-95 个中文字。
- 优先只返回 JSON：{"suggestions":["...","...","...","..."]}
- 如果模型不能返回 JSON，就每行返回一句，不要加解释。

任务：${task}
用户原句：${sentence}
第一步行动：${action || "未填写"}
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENROUTER_MODEL") || "openrouter/free",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 700
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return jsonResponse({ error: data?.error?.message || "OpenRouter request failed." });
    }

    const text = outputText(data);
    let rawSuggestions: unknown[] = [];
    try {
      const parsed = extractJson(text);
      rawSuggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
    } catch {
      rawSuggestions = extractIdentityLines(text);
    }

    const suggestions = normalizeSuggestions(rawSuggestions, sentence, target);

    if (!suggestions.length) {
      return jsonResponse({ error: "AI did not return usable suggestions." });
    }

    return jsonResponse({ suggestions });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "AI polishing failed." });
  }
});
