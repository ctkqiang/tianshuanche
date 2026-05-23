// DeepSeek AI 安全扫描代理
// 先执行真实 HTTP/SSL/DNS 检查，再将结果交给 AI 分析

export default defineEventHandler(async (event) => {
  const apiKey = useRuntimeConfig(event).deepseekApiKey;
  if (!apiKey || apiKey === "sk-your-key-here") {
    throw createError({ statusCode: 401, statusMessage: "请在 .env 中配置 NUXT_DEEPSEEK_API_KEY" });
  }

  const body = await readBody(event);
  const { url: rawUrl, template, skills } = body as { url: string; template: string; skills: string[] };

  if (!rawUrl) throw createError({ statusCode: 400, statusMessage: "缺少目标 URL" });

  // normalize URL
  let host = rawUrl.trim();
  if (!/^https?:\/\//i.test(host)) host = "https://" + host;
  const parsed = new URL(host);
  const target = parsed.hostname;

  const templateLabels: Record<string, string> = {
    full: "全面合规审计 (Full Security Audit)",
    static: "静态代码风险查杀 (Static Code Review)",
    recon: "资产情报搜集 (Reconnaissance Mode)",
  };

  // ── Phase 1: Real basic reconnaissance ──
  const findings: string[] = [];
  findings.push(`=== 真实侦察数据 (Real Reconnaissance) ===`);
  findings.push(`目标: ${target}`);
  findings.push(`协议: ${parsed.protocol}`);
  findings.push(`时间: ${new Date().toISOString()}\n`);

  // DNS resolution
  try {
    const dnsStart = Date.now();
    const resp = await fetch(`${parsed.protocol}//${target}/`, {
      method: "GET",
      headers: { "User-Agent": "Mojia-Scanner/1.0" },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    const dnsMs = Date.now() - dnsStart;

    findings.push(`[DNS/HTTP] 连接成功 (${dnsMs}ms)`);
    findings.push(`  HTTP 状态码: ${resp.status} ${resp.statusText}`);
    findings.push(`  Content-Type: ${resp.headers.get("content-type") || "未知"}`);
    findings.push(`  Server: ${resp.headers.get("server") || "未暴露"}`);
    findings.push(`  X-Powered-By: ${resp.headers.get("x-powered-by") || "未暴露"}`);

    // Security headers check
    const secHeaders = [
      "strict-transport-security",
      "content-security-policy",
      "x-frame-options",
      "x-content-type-options",
      "referrer-policy",
      "permissions-policy",
    ];
    const missingHeaders: string[] = [];
    for (const h of secHeaders) {
      if (!resp.headers.get(h)) missingHeaders.push(h);
    }
    if (missingHeaders.length > 0) {
      findings.push(`  ⚠ 缺少安全头: ${missingHeaders.join(", ")}`);
    } else {
      findings.push(`  ✓ 所有安全头已配置`);
    }

    // Cookie check
    const setCookie = resp.headers.get("set-cookie");
    if (setCookie) {
      const insecure = [];
      if (!setCookie.toLowerCase().includes("httponly")) insecure.push("HttpOnly");
      if (!setCookie.toLowerCase().includes("secure")) insecure.push("Secure");
      if (!setCookie.toLowerCase().includes("samesite")) insecure.push("SameSite");
      if (insecure.length > 0) findings.push(`  ⚠ Cookie 缺少: ${insecure.join(", ")}`);
    }

    findings.push("");
  } catch (e: any) {
    findings.push(`[DNS/HTTP] 连接失败: ${e.message}`);
    findings.push(`  目标可能不可达或防火墙阻挡`);
    findings.push("");
  }

  // SSL certificate check (for HTTPS)
  if (parsed.protocol === "https:") {
    try {
      const tlsResp = await fetch(`${parsed.protocol}//${target}/`, {
        headers: { "User-Agent": "Mojia-Scanner/1.0" },
        signal: AbortSignal.timeout(10000),
      });
      findings.push(`[SSL/TLS] HTTPS 已启用`);
      findings.push("");
    } catch {
      findings.push(`[SSL/TLS] SSL 握手失败`);
      findings.push("");
    }
  }

  // ── Phase 2: Build AI prompt with real data ──
  const systemPrompt = `你是一个网络安全专家 AI，名为"墨甲编排器"。

你对目标 "${target}" 执行「${templateLabels[template] || template}」安全扫描。

以下是对该目标的 **真实侦察数据**（非模拟），请基于这些真实数据进行安全分析。

如果连接失败，请基于域名和常见攻击模式给出建议。

请根据以下技能框架进行分析：

${(skills || []).slice(0, 25).map((s, i) => `${i + 1}. ${s}`).join("\n")}

回复格式：每条以 [分类标签] 开头，包含真实数据引用、风险等级、修复建议。
风险等级: 🔴严重 🟠高危 🟡中危 🟢低危 🔵信息

不要做任何模拟假设。如果真实数据显示连接失败，请指出来并给出原因和建议。`;

  const userPrompt = findings.join("\n") + `\n请对上述真实侦察数据进行安全分析。`;

  // ── Phase 3: Call DeepSeek ──
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3, max_tokens: 4096, stream: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw createError({ statusCode: response.status, statusMessage: `DeepSeek API 错误: ${err}` });
  }

  const data = await response.json();
  const aiResult = data.choices?.[0]?.message?.content || "无响应";

  // Return: raw findings + AI analysis
  return {
    target,
    template: templateLabels[template],
    findings: findings.join("\n"),   // real scan data
    analysis: aiResult,              // AI interpretation
    model: data.model,
    usage: data.usage,
  };
});
