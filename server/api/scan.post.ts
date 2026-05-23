// 墨甲编排器 · 自主代理扫描引擎
// 每一步基于前一步结果自动决策，链式执行直到完成

import { execSync } from "node:child_process";

function exec(cmd: string, timeout = 8000): string {
  try { return execSync(cmd + " 2>&1 | head -20", { timeout, encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }).trim(); }
  catch (e: any) { return e.stdout || e.stderr || `[ERR] ${e.message}`; }
}
function has(cmd: string): boolean {
  try { execSync(`which ${cmd} 2>/dev/null || command -v ${cmd} 2>/dev/null`, { timeout: 2000 }); return true; }
  catch { return false; }
}

// 工具注册表: [名称, 命令模板, 前置条件, 触发条件正则]
interface StepDef { tool: string; cmd: (host: string) => string; requires: string; trigger?: RegExp; category: string }
const STEPS: StepDef[] = [
  { tool: "DNS Lookup", cmd: h => `dig +short A ${h} && dig +short MX ${h}`, requires: "dig", trigger: /.*/, category: "recon" },
  { tool: "WHOIS", cmd: h => `whois ${h} | head -25`, requires: "whois", trigger: /.*/, category: "recon" },
  { tool: "HTTP Probe", cmd: h => `curl -sI -m 10 http://${h}/ 2>&1; curl -sI -m 10 https://${h}/ 2>&1`, requires: "curl", trigger: /.*/, category: "recon" },
  { tool: "Nmap Fast", cmd: h => `nmap -T4 -F --open ${h} 2>/dev/null`, requires: "nmap", trigger: /.*/, category: "recon" },
  { tool: "SSL Cert", cmd: h => `echo | openssl s_client -servername ${h} -connect ${h}:443 2>/dev/null | openssl x509 -noout -text 2>/dev/null | grep -E 'Issuer:|Not After|DNS:' | head -8`, requires: "openssl", trigger: /443|https/i, category: "recon" },
  { tool: "WhatWeb", cmd: h => `whatweb ${h} --no-errors 2>/dev/null | head -5`, requires: "whatweb", trigger: /http|80|443|8080/i, category: "recon" },
  { tool: "Nmap Full", cmd: h => `nmap -T4 -sV -p- --script=vuln ${h} 2>/dev/null | head -60`, requires: "nmap", trigger: /open|ssh|http|mysql/i, category: "vuln" },
  { tool: "Nikto", cmd: h => `nikto -h ${h} -Tuning 123 -timeout 30 2>/dev/null | head -30`, requires: "nikto", trigger: /http|80|443|8080|nginx|apache/i, category: "vuln" },
  { tool: "SQLMap Probe", cmd: h => `sqlmap -u "http://${h}/" --batch --level=1 --risk=1 --timeout=30 2>/dev/null | head -20`, requires: "sqlmap", trigger: /http|80|443|8080|mysql|3306|php/i, category: "exploit" },
  { tool: "Dirsearch", cmd: h => `dirsearch -u http://${h}/ -e php,html,js --timeout=30 2>/dev/null | head -15`, requires: "dirsearch", trigger: /http|80|443|8080/i, category: "exploit" },
  { tool: "Subfinder", cmd: h => `subfinder -d ${h} -silent 2>/dev/null | head -10`, requires: "subfinder", trigger: /\.(com|org|net|cn|io)/i, category: "recon" },
];

export default defineEventHandler(async (event) => {
  const apiKey = useRuntimeConfig(event).deepseekApiKey;
  if (!apiKey || apiKey === "sk-your-key-here") throw createError({ statusCode: 401, statusMessage: "请配置 NUXT_DEEPSEEK_API_KEY" });

  const { url: rawUrl } = await readBody(event) as { url: string; template?: string; skills?: string[] };
  if (!rawUrl) throw createError({ statusCode: 400, statusMessage: "缺少 URL" });

  let host = rawUrl.trim();
  if (!/^https?:\/\//i.test(host)) host = "https://" + host;
  const target = new URL(host).hostname;

  const toolsAvailable: string[] = [];
  const log: { step: number; tool: string; action: string; output: string; decision: string }[] = [];
  let allFindings = "";
  let stepNum = 0;

  // ── AUTONOMOUS AGENT LOOP ──
  let context = `目标: ${target}\n`;

  for (const step of STEPS) {
    // Decision: should we run this step?
    const installed = has(step.requires);
    if (!installed) continue;

    const triggered = step.trigger ? step.trigger.test(context) : true;
    if (!triggered) continue;

    toolsAvailable.push(step.tool);
    stepNum++;

    const decision = stepNum <= 2 ? "基础侦察 — 必须执行"
      : step.trigger?.test(allFindings) ? `检测到匹配条件 "${step.trigger.source.slice(1, -1)}" — 自动触发`
      : "基于上下文跳过";

    log.push({ step: stepNum, tool: step.tool, action: decision, output: "", decision });

    // Execute
    const cmd = step.cmd(target);
    const output = exec(cmd);
    log[log.length - 1].output = output.slice(0, 3000);

    allFindings += `\n--- ${step.tool} ---\n${output.slice(0, 1000)}\n`;
    context = allFindings.slice(-3000);

    // If we have enough data, break early
    if (stepNum >= 6 && allFindings.length > 5000) break;
  }

  // ── AI Final Analysis ──
  const aiPrompt = `你是墨甲编排器自主安全扫描代理。以下是对 ${target} 的完整自主扫描结果。
代理自动决策并执行了 ${stepNum} 个步骤: ${log.map(l => l.tool).join(" → ")}。

扫描数据:\n${allFindings.slice(0, 6000)}

请生成最终安全评估报告。每条以 [分类] 开头，包含风险等级(🔴严重/🟠高危/🟡中危/🟢低危/🔵信息)和建议。基于真实数据，不编造。`;

  let analysis = "";
  try {
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: aiPrompt }], temperature: 0.3, max_tokens: 4096 }),
    });
    if (resp.ok) {
      const data = await resp.json();
      analysis = data.choices?.[0]?.message?.content || "";
    }
  } catch { analysis = "AI 分析暂时不可用"; }

  return {
    target, steps: stepNum,
    pipeline: log.map(l => `[${l.tool}] ${l.action}`).join(" → "),
    toolsUsed: [...new Set(toolsAvailable)],
    findings: allFindings,
    agentLog: log,
    analysis,
  };
});
