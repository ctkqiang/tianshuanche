// DeepSeek API 代理 — 接收前端技能模板 + URL，注入 prompt 后返回 AI 分析结果
export default defineEventHandler(async (event) => {
  const apiKey = useRuntimeConfig(event).deepseekApiKey;
  if (!apiKey || apiKey === "sk-your-key-here") {
    throw createError({ statusCode: 401, statusMessage: "请在 .env 中配置 NUXT_DEEPSEEK_API_KEY" });
  }

  const body = await readBody(event);
  const { url, template, skills } = body as { url: string; template: string; skills: string[] };

  if (!url) throw createError({ statusCode: 400, statusMessage: "缺少目标 URL" });

  const templateLabels: Record<string, string> = {
    full: "全面合规审计 (Full Security Audit)",
    static: "静态代码风险查杀 (Static Code Review)",
    recon: "资产情报搜集 (Reconnaissance Mode)",
  };

  const systemPrompt = `你是一个网络安全专家 AI 代理，名为"墨甲编排器"(Mojia Orchestrator)。
你正在对目标 URL "${url}" 执行「${templateLabels[template] || template}」扫描。

请根据以下技能清单，逐步分析目标的安全性，输出结构化的漏洞评估报告：

${(skills || []).map((s, i) => `${i + 1}. ${s}`).join("\n")}

请用中文回复，格式为 [模块名] 分析结果，每条包含风险等级（严重/高危/中危/低危/信息）和建议修复方案。`;

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `请开始对 ${url} 进行安全扫描分析。` },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      stream: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw createError({ statusCode: response.status, statusMessage: `DeepSeek API 错误: ${err}` });
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "无响应";

  return { result: content, model: data.model, usage: data.usage };
});
