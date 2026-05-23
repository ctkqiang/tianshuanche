<template>
  <div class="h-screen bg-zinc-950 text-zinc-300 flex flex-col font-mono overflow-hidden">
    <!-- ═══ TOP HEADER: Input + AI Strategy Badge ═══ -->
    <header class="border-b border-zinc-800 px-6 py-4 shrink-0">
      <div class="max-w-full flex items-end gap-4">
        <div class="flex items-center gap-2.5 shrink-0">
          <span class="text-emerald-400 text-lg">◈</span>
          <span class="text-white font-bold text-base tracking-tight">墨甲<span class="text-emerald-400">编排器</span></span>
        </div>
        <div class="flex-1">
          <label class="block text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-1.5">Target Asset URL</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs">$></span>
            <input v-model="targetUrl" placeholder="https://example.com" class="w-full bg-transparent border-b border-zinc-700 py-1.5 pl-8 pr-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors" @keyup.enter="execute" />
          </div>
        </div>
        <div class="w-52">
          <label class="block text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-1.5">Template</label>
          <select v-model="template" class="w-full bg-transparent border-b border-zinc-700 py-1.5 pr-3 text-sm text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer">
            <option value="full" class="bg-zinc-950">全面合规审计</option>
            <option value="static" class="bg-zinc-950">静态代码风险查杀</option>
            <option value="recon" class="bg-zinc-950">资产情报搜集</option>
          </select>
        </div>
        <button :disabled="running" @click="execute" class="px-5 py-1.5 text-sm font-bold rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-zinc-950 transition-colors shrink-0 h-[34px] flex items-center gap-2">
          <span v-if="running" class="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          {{ running ? '扫描中...' : '执行编排任务' }}
        </button>
      </div>
      <div class="mt-3 flex items-center gap-2">
        <span class="text-[10px] text-zinc-600 uppercase tracking-wider">AI Strategy</span>
        <span class="text-xs px-2.5 py-1 rounded-full font-medium transition-all duration-300 border" :class="strategy.color">{{ strategy.label }}</span>
        <span v-if="activeSkills.length > 0" class="text-[10px] text-zinc-600 ml-2">{{ activeSkills.length }} tools auto-selected</span>
      </div>
    </header>

    <!-- ═══ MAIN: Sidebar + Split Workspace ═══ -->
    <div class="flex-1 flex overflow-hidden">
      <!-- LEFT SIDEBAR -->
      <aside class="w-64 shrink-0 border-r border-zinc-800 overflow-y-auto">
        <div class="px-4 py-2.5 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest sticky top-0 bg-zinc-950">Tool Inventory</div>
        <div v-for="(group, gi) in toolGroups" :key="gi">
          <button @click="group.open = !group.open" class="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-zinc-900/50 transition-colors">
            <span class="text-[10px] transition-transform duration-200" :class="{ 'rotate-90': group.open }">▸</span>
            <span class="text-xs">{{ group.emoji }}</span>
            <span class="text-xs font-medium text-zinc-400">{{ group.name }}</span>
            <span class="ml-auto text-[10px] text-zinc-700">{{ group.tools.length }}</span>
          </button>
          <div v-if="group.open" class="pb-1">
            <div v-for="tool in group.tools" :key="tool.id" class="flex items-center justify-between px-6 py-1.5 hover:bg-zinc-900/30 transition-colors" :class="{ 'bg-emerald-950/10 border-l-2 border-emerald-600/40': tool.isActive }">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300" :class="tool.isActive ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-zinc-700'" />
                <span class="text-[11px] truncate" :class="tool.isActive ? 'text-emerald-300' : 'text-zinc-500'">{{ tool.name }}</span>
              </div>
              <span class="text-[9px] text-zinc-700 font-mono">{{ tool.standardPort }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- CENTRAL: Split Pane -->
      <main class="flex-1 flex overflow-hidden">
        <!-- Execution Steps -->
        <div class="w-72 shrink-0 border-r border-zinc-800 overflow-y-auto p-4">
          <div class="text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-4">Execution Pipeline</div>
          <div class="space-y-1">
            <div v-for="(step, si) in executionSteps" :key="si" class="relative pl-6 pb-5 border-l-2 transition-colors duration-500" :class="step.status === 'done' ? 'border-emerald-600' : step.status === 'active' ? 'border-emerald-400' : 'border-zinc-800'">
              <div class="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full border-2 transition-all duration-500" :class="step.status === 'done' ? 'bg-emerald-500 border-emerald-500' : step.status === 'active' ? 'bg-zinc-950 border-emerald-400 animate-pulse' : 'bg-zinc-950 border-zinc-700'" />
              <div class="text-xs font-medium" :class="step.status === 'done' ? 'text-emerald-300' : step.status === 'active' ? 'text-white' : 'text-zinc-600'">{{ step.title }}</div>
              <div class="text-[10px] text-zinc-600 mt-0.5">{{ step.tool || '·' }}</div>
              <div v-if="step.status === 'done'" class="text-[9px] text-emerald-700 mt-0.5">completed</div>
              <div v-if="step.status === 'active'" class="text-[9px] text-emerald-500 mt-0.5">running...</div>
            </div>
          </div>
        </div>
        <!-- Terminal -->
        <div class="flex-1 flex flex-col min-w-0">
          <div class="flex border-b border-zinc-800 shrink-0">
            <button @click="viewTab = 'terminal'" class="px-4 py-2 text-xs uppercase tracking-wider border-b-2 transition-colors" :class="viewTab === 'terminal' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-600 hover:text-zinc-400'">Terminal</button>
            <button @click="viewTab = 'results'" class="px-4 py-2 text-xs uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5" :class="viewTab === 'results' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-600 hover:text-zinc-400'">
              Results
              <span v-if="scanResults" class="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>
          </div>
          <div v-show="viewTab === 'terminal'" ref="termRef" class="flex-1 overflow-y-auto p-4 text-[12px] leading-relaxed space-y-0.5" style="background: radial-gradient(ellipse at top, #0c0c14 0%, #09090b 100%)">
            <div v-if="lines.length === 0" class="h-full flex flex-col items-center justify-center text-zinc-700 gap-2">
              <span class="text-3xl opacity-20">◈</span>
              <span class="text-[11px]">输入目标 URL · 引擎将自动适配扫描策略</span>
            </div>
            <div v-for="(l, i) in lines" :key="i" class="flex gap-2.5 animate-fade-in">
              <span class="shrink-0 text-[10px] w-14 text-right" :class="l.c">{{ l.tag }}</span>
              <span class="text-zinc-400">{{ l.text }}</span>
            </div>
            <div v-if="running" class="flex items-center gap-2 pt-1">
              <span class="text-emerald-500 animate-pulse">▊</span>
              <span class="text-zinc-600 text-[10px]">agent running...</span>
            </div>
          </div>

          <!-- Results Dashboard -->
          <div v-show="viewTab === 'results'" class="flex-1 overflow-y-auto p-5 space-y-5">
            <div v-if="!scanResults" class="h-full flex flex-col items-center justify-center text-zinc-700 gap-2">
              <span class="text-3xl opacity-20">◈</span>
              <span class="text-[11px]">执行扫描后此处显示结构化报告</span>
            </div>

            <template v-if="scanResults">
              <div class="grid grid-cols-4 gap-3">
                <div v-for="card in scanResults.summary" :key="card.label" class="rounded-lg p-4 border" :class="card.bg">
                  <div class="text-2xl font-bold" :class="card.text">{{ card.count }}</div>
                  <div class="text-[10px] uppercase tracking-wider mt-1" :class="card.labelColor">{{ card.label }}</div>
                </div>
              </div>
              <div class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div class="text-xs text-zinc-500 uppercase tracking-wider mb-2">Target Summary</div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div><span class="text-zinc-600">URL:</span> <span class="text-emerald-400">{{ scanResults.target }}</span></div>
                  <div><span class="text-zinc-600">Strategy:</span> <span class="text-amber-400">{{ scanResults.strategy }}</span></div>
                  <div><span class="text-zinc-600">Tools Used:</span> <span class="text-zinc-400">{{ scanResults.tools.join(', ') }}</span></div>
                  <div><span class="text-zinc-600">Duration:</span> <span class="text-zinc-500">{{ scanResults.duration }}</span></div>
                </div>
              </div>
              <div class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div class="text-xs text-zinc-500 uppercase tracking-wider mb-3">Findings ({{ scanResults.findings.length }})</div>
                <div class="space-y-2">
                  <div v-for="(f, fi) in scanResults.findings" :key="fi" class="flex items-start gap-3 p-2.5 rounded-md border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                    <span class="text-xs mt-0.5">{{ f.severity === 'critical' ? '🔴' : f.severity === 'high' ? '🟠' : f.severity === 'medium' ? '🟡' : '🔵' }}</span>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-medium text-zinc-300">{{ f.title }}</span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded font-mono" :class="f.severity === 'critical' ? 'bg-red-950/40 text-red-400' : f.severity === 'high' ? 'bg-amber-950/40 text-amber-400' : f.severity === 'medium' ? 'bg-cyan-950/40 text-cyan-400' : 'bg-zinc-800 text-zinc-500'">{{ f.cve || f.severity.toUpperCase() }}</span>
                      </div>
                      <div class="text-[11px] text-zinc-500 mt-0.5">{{ f.description }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- AI Analysis — parsed into structured cards -->
              <div v-if="scanResults.analysis" class="bg-zinc-900/50 border border-emerald-900/30 rounded-lg p-4">
                <div class="text-xs text-emerald-500 uppercase tracking-wider mb-3">AI Security Analysis</div>
                <div class="space-y-3">
                  <div v-for="(card, ci) in parsedAnalysis" :key="ci"
                    class="border-l-2 rounded-r-md p-3 transition-colors"
                    :class="{
                      'border-red-500/60 bg-red-950/10': card.severity === '严重',
                      'border-amber-500/60 bg-amber-950/10': card.severity === '高危',
                      'border-cyan-500/60 bg-cyan-950/10': card.severity === '中危',
                      'border-emerald-500/60 bg-emerald-950/10': card.severity === '低危',
                      'border-zinc-600 bg-zinc-900/30': card.severity === '信息' || !card.severity,
                    }"
                  >
                    <div class="flex items-center gap-2 mb-1.5">
                      <span class="text-xs font-medium text-zinc-200">{{ card.category }}</span>
                      <span v-if="card.severity" class="text-[10px] px-1.5 py-0.5 rounded font-mono"
                        :class="{
                          'bg-red-950/40 text-red-400': card.severity === '严重',
                          'bg-amber-950/40 text-amber-400': card.severity === '高危',
                          'bg-cyan-950/40 text-cyan-400': card.severity === '中危',
                          'bg-emerald-950/40 text-emerald-400': card.severity === '低危',
                          'bg-zinc-800 text-zinc-500': card.severity === '信息',
                        }"
                      >{{ card.severity }}</span>
                    </div>
                    <div v-if="card.finding" class="text-[11px] text-zinc-400 mb-1.5 leading-relaxed">{{ card.finding }}</div>
                    <div v-if="card.recommendation" class="text-[10px] text-zinc-500 leading-relaxed border-t border-zinc-800 pt-1.5 mt-1.5">{{ card.recommendation }}</div>
                  </div>
                </div>
              </div>

              <!-- Suggested Next Actions -->
              <div v-if="scanResults.suggestions?.length" class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div class="text-xs text-zinc-500 uppercase tracking-wider mb-3">Continue Scanning</div>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-for="s in scanResults.suggestions"
                    :key="s.action"
                    @click="continueScan(s)"
                    :disabled="running"
                    class="flex items-start gap-3 p-3 rounded-md border border-zinc-800 hover:border-emerald-700 hover:bg-emerald-950/20 transition-all text-left disabled:opacity-40"
                  >
                    <span class="text-lg shrink-0">{{ s.icon }}</span>
                    <div class="min-w-0">
                      <div class="text-xs font-medium text-zinc-300">{{ s.label }}</div>
                      <div class="text-[10px] text-zinc-600 mt-0.5">{{ s.desc }}</div>
                    </div>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from "vue";

const targetUrl = ref("");
const template = ref("full");
const running = ref(false);
const viewTab = ref("terminal");
const termRef = ref<HTMLElement>();

interface Line { tag: string; c: string; text: string }
interface ScanResult { target: string; strategy: string; tools: string[]; duration: string; summary: { label: string; count: number; bg: string; text: string; labelColor: string }[]; findings: { title: string; severity: string; cve: string; description: string }[]; analysis?: string; suggestions?: { label: string; icon: string; action: string; desc: string }[]; }
const lines = ref<Line[]>([]);
const scanResults = ref<ScanResult | null>(null);

// ── Tool Inventory ──
interface Tool { id: string; name: string; standardPort: string; description: string; isActive: boolean; category: string }
interface ToolGroup { emoji: string; name: string; open: boolean; tools: Tool[] }

const toolGroups = ref<ToolGroup[]>([
  { emoji: "SAT", name: "Recon & Scan", open: true, tools: [
    { id: "nmap", name: "Nmap", standardPort: "any", description: "Network mapper", isActive: false, category: "recon" },
    { id: "masscan", name: "Masscan", standardPort: "any", description: "Mass port scanner", isActive: false, category: "recon" },
    { id: "subfinder", name: "Subfinder", standardPort: "53/443", description: "Subdomain discovery", isActive: false, category: "recon" },
    { id: "dirsearch", name: "Dirsearch", standardPort: "80/443", description: "Web path brute-forcer", isActive: false, category: "recon" },
    { id: "shodan", name: "Shodan API", standardPort: "443", description: "Internet device search", isActive: false, category: "recon" },
  ]},
  { emoji: "CVE", name: "CVE Association", open: false, tools: [
    { id: "nuclei", name: "Nuclei", standardPort: "any", description: "Template vuln scanner", isActive: false, category: "cve" },
    { id: "grizzly", name: "Grizzly", standardPort: "any", description: "CVE exploit lookup", isActive: false, category: "cve" },
    { id: "vulncheck", name: "VulnCheck", standardPort: "443", description: "Vuln intelligence API", isActive: false, category: "cve" },
  ]},
  { emoji: "CODE", name: "Source Code Audit", open: false, tools: [
    { id: "semgrep", name: "Semgrep", standardPort: "any", description: "Static analysis SAST", isActive: false, category: "code" },
    { id: "sonarqube", name: "SonarQube", standardPort: "9000", description: "Code quality platform", isActive: false, category: "code" },
    { id: "trufflehog", name: "Trufflehog", standardPort: "any", description: "Secret scanner", isActive: false, category: "code" },
  ]},
  { emoji: "DEF", name: "Defense Verification", open: false, tools: [
    { id: "wafw00f", name: "Wafw00f", standardPort: "80/443", description: "WAF fingerprinting", isActive: false, category: "defense" },
    { id: "nikto", name: "Nikto", standardPort: "80/443", description: "Web server scanner", isActive: false, category: "defense" },
    { id: "cf-bypass", name: "CF Bypass Check", standardPort: "443", description: "Cloudflare bypass detect", isActive: false, category: "defense" },
  ]},
]);

// ── Auto-Adaptation Engine ──
function setActiveByCategory(cat: string) {
  for (const g of toolGroups.value) {
    for (const t of g.tools) { t.isActive = t.category === cat; }
  }
}

const strategy = computed(() => {
  const url = targetUrl.value.trim().toLowerCase();
  if (!url) return { label: "等待输入目标 URL", color: "bg-zinc-800 text-zinc-500 border-zinc-700", type: "idle" };
  if (url.endsWith(".git") || url.includes("github.com") || url.includes("gitlab")) {
    setActiveByCategory("code");
    return { label: "Static Code Audit", color: "bg-purple-950/60 text-purple-400 border-purple-800/40", type: "code" };
  }
  if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url) || url.startsWith("api.") || url.includes("/api")) {
    setActiveByCategory("recon");
    return { label: "Network Infrastructure Audit", color: "bg-cyan-950/60 text-cyan-400 border-cyan-800/40", type: "recon" };
  }
  setActiveByCategory("defense");
  return { label: "Full Web Application Audit", color: "bg-emerald-950/60 text-emerald-400 border-emerald-800/40", type: "web" };
});

const activeSkills = computed(() => {
  const active: Tool[] = [];
  for (const g of toolGroups.value) { for (const t of g.tools) { if (t.isActive) active.push(t); } }
  return active;
});

// ── Execution Steps ──
interface Step { title: string; tool: string; status: "waiting" | "active" | "done" }
const executionSteps = ref<Step[]>([
  { title: "Target Validation", tool: "", status: "waiting" },
  { title: "Service Discovery", tool: "", status: "waiting" },
  { title: "Vulnerability Scan", tool: "", status: "waiting" },
  { title: "Exploit Verification", tool: "", status: "waiting" },
  { title: "Report Generation", tool: "AI Analysis", status: "waiting" },
]);

// Parse AI analysis text into structured cards
const parsedAnalysis = computed(() => {
  const raw = (scanResults.value?.analysis || "").replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{2702}-\u{27B0}\u{1F680}-\u{1F6FF}\u{24C2}-\u{1F251}]/gu, "").trim();
  const cards: { category: string; severity: string; finding: string; recommendation: string }[] = [];

  // Split by [分类] or by markdown headings (lines starting with **bold** or ##)
  const sections = raw.split(/\n(?=\[分类\])|(?<=\n)\*\*[^*]+\*\*/).filter(s => s.trim().length > 10);

  for (const sec of sections) {
    const text = sec.replace(/\*+/g, "").replace(/^---\s*/m, "").trim();
    if (!text || text.length < 8) continue;

    // Extract category from first line or [分类] prefix
    let category = text.split("\n")[0].replace(/^\[分类\]\s*/, "").trim();
    if (!category || category.length > 40) category = "分析发现";

    // Extract severity
    let severity = "信息";
    const sevMatch = text.match(/风险等级[：:]\s*(.+)/);
    if (sevMatch) {
      const s = sevMatch[1].trim();
      severity = s.includes("严重") ? "严重" : s.includes("高危") ? "高危" : s.includes("中危") ? "中危" : s.includes("低危") ? "低危" : "信息";
    }

    // Extract finding (everything between 发现 and 建议)
    let finding = "";
    const findMatch = text.match(/发现[：:]\s*([\s\S]*?)(?=\n\s*(?:建议[：:]|$))/);
    if (findMatch) {
      finding = findMatch[1].trim();
    } else {
      // Fallback: take the first meaningful paragraph after category
      const lines = text.split("\n").filter(l => l.trim().length > 5 && !l.includes("风险等级") && !l.includes("建议"));
      finding = lines.slice(1, 4).join(" ").trim();
    }

    // Extract recommendation
    let recommendation = "";
    const recMatch = text.match(/建议[：:]\s*([\s\S]*?)$/);
    if (recMatch) recommendation = recMatch[1].trim();

    if (finding && finding.length > 3) {
      cards.push({ category, severity, finding, recommendation });
    }
  }

  if (cards.length === 0) {
    // Fallback: show the entire analysis as one card
    const summary = raw.split("\n").filter(l => l.trim().length > 10).join(" ").slice(0, 600);
    cards.push({ category: "安全评估报告", severity: "", finding: summary, recommendation: "" });
  }

  return cards;
});

// ── Execute ──
async function execute() {
  running.value = true; lines.value = [];
  const url = targetUrl.value || "https://example.com";
  const t0 = Date.now();

  lines.value.push({ tag: "[INIT]", c: "text-emerald-400", text: `墨甲编排器 · 目标: ${url}` });
  lines.value.push({ tag: "[ADAPT]", c: "text-amber-400", text: `策略: ${strategy.value.label}` });
  const active = activeSkills.value;
  if (active.length > 0) {
    lines.value.push({ tag: "[ADAPT]", c: "text-cyan-400", text: `激活 ${active.length} 个工具: ${active.map(t => t.name).join(", ")}` });
  }

  // Step indicators
  const steps = executionSteps.value;
  for (const s of steps) s.status = "waiting";
  steps[0].status = "active"; steps[0].tool = "DNS/HTTP Probe";

  try {
    const tStart = Date.now();
    lines.value.push({ tag: "[REQ]", c: "text-cyan-400", text: `POST /api/scan · URL: ${url} · 模板: ${template.value}` });
    lines.value.push({ tag: "[REQ]", c: "text-zinc-600", text: `载荷: ${active.length} 个技能, ${JSON.stringify({ url, template: template.value }).length} 字节` });
    await nextTick();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    let resp: Response;
    try {
      lines.value.push({ tag: "[NET]", c: "text-zinc-500", text: "建立连接中..." });
      await nextTick();
      resp = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, template: template.value, skills: active.map(t => `${t.name} (${t.category})`) }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (fetchErr.name === "AbortError") {
        lines.value.push({ tag: "[TIMEOUT]", c: "text-red-400", text: "扫描超时 (120s) — 目标可能无法访问或扫描命令卡住" });
      } else {
        lines.value.push({ tag: "[NETERR]", c: "text-red-400", text: `网络错误: ${fetchErr.message}` });
        lines.value.push({ tag: "[HINT]", c: "text-zinc-500", text: `检查服务器是否运行: curl http://localhost:3000/api/tools` });
      }
      running.value = false;
      return;
    }

    const ttfb = Date.now() - tStart;
    lines.value.push({ tag: "[RESP]", c: "text-cyan-400", text: `服务器响应 · HTTP ${resp.status} · TTFB ${ttfb}ms` });

    if (!resp.ok) {
      const err = await resp.text();
      lines.value.push({ tag: "[ERROR]", c: "text-red-400", text: `API 错误: ${err}` });
      running.value = false;
      return;
    }

    const data = await resp.json();

    // Build execution steps from agent pipeline
    const agentSteps: typeof executionSteps.value = [];
    if (data.agentLog) {
      for (const entry of data.agentLog) {
        agentSteps.push({
          title: entry.tool,
          tool: entry.action.includes("必须") ? "auto" : entry.action.includes("触发") ? "triggered" : "decision",
          status: "done" as const,
        });
      }
    }
    if (agentSteps.length > 0) executionSteps.value = agentSteps;

    // Show agent pipeline
    lines.value.push({ tag: "[AGENT]", c: "text-emerald-400", text: `自主代理执行 ${data.steps || "?"} 个步骤` });
    lines.value.push({ tag: "[PIPE]", c: "text-amber-400", text: data.pipeline || "扫描完成" });
    lines.value.push({ tag: "[DATA]", c: "text-cyan-400", text: `已用工具: ${(data.toolsUsed || []).join(", ") || "基础 HTTP 探测"}` });

    // Agent decision log
    if (data.agentLog) {
      for (const entry of data.agentLog) {
        lines.value.push({ tag: `[STEP${entry.step}]`, c: "text-amber-400", text: `${entry.tool} · ${entry.action}` });
      }
    }
    const realLines = (data.findings || "").split("\n");
    for (const rl of realLines) {
      if (rl.trim()) {
        const c = rl.includes("⚠") || rl.includes("错误") ? "text-amber-400" : rl.startsWith("[") ? "text-cyan-400" : "text-zinc-400";
        lines.value.push({ tag: "[SCAN]", c, text: rl.trim() });
      }
    }

    // AI analysis
    const aiText = data.analysis || "";
    if (aiText) {
      lines.value.push({ tag: "[AI]", c: "text-emerald-400", text: `AI 分析完成` });
    }

    // Build structured results from real data
    const findingsList: any[] = [];
    const sevCounts: Record<string, number> = { critical: 0, high: 0, medium: 0, info: 0 };
    for (const rl of realLines) {
      const sev = rl.includes("严重") || rl.includes("critical") ? "critical"
        : rl.includes("高危") || rl.includes("high") ? "high"
        : rl.includes("中危") || rl.includes("medium") ? "medium" : "info";
      sevCounts[sev]++;
      if (rl.length > 20 && findingsList.length < 15) {
        findingsList.push({
          title: rl.slice(0, 80).replace(/^\[.*?\]\s*/, "").trim() || "扫描发现",
          severity: sev,
          cve: rl.includes("CVE-") ? (rl.match(/CVE-\d{4}-\d{4,}/)?.[0] || "") : "",
          description: rl.slice(0, 200).trim(),
        });
      }
    }

    // Suggest next actions based on findings
    const suggestions: { label: string; icon: string; action: string; desc: string }[] = [];
    const rawFindings = (data.findings || "").toLowerCase();
    if (rawFindings.includes("mysql") || rawFindings.includes("3306")) {
      suggestions.push({ label: "SQL注入深度扫描", icon: "SQL", action: "sqlmap-deep", desc: "对 MySQL 端口进行深度 SQLMap 探测" });
    }
    if (rawFindings.includes("http") || rawFindings.includes("80") || rawFindings.includes("443") || rawFindings.includes("8080")) {
      suggestions.push({ label: "Web 应用全量审计", icon: "WWW", action: "web-full", desc: "Nikto + Dirsearch + XSS/SQLi 全面扫描" });
    }
    if (rawFindings.includes("ssh") || rawFindings.includes("22")) {
      suggestions.push({ label: "SSH 安全加固检查", icon: "KEY", action: "ssh-audit", desc: "检查 SSH 配置、弱密钥、暴力破解风险" });
    }
    suggestions.push({ label: "完整合规报告", icon: "RPT", action: "report", desc: "生成包含修复建议的完整合规审计报告" });
    suggestions.push({ label: "重新扫描", icon: "RERUN", action: "rescan", desc: "用不同模板重新扫描目标" });

    scanResults.value = {
      target: data.target || url,
      strategy: strategy.value.label,
      tools: data.toolsUsed || active.map(t => t.name),
      duration: `${((Date.now() - t0) / 1000).toFixed(1)}s`,
      summary: [
        { label: "Critical", count: sevCounts.critical, bg: "bg-red-950/30 border-red-900/40", text: "text-red-400", labelColor: "text-red-500" },
        { label: "High", count: sevCounts.high, bg: "bg-amber-950/30 border-amber-900/40", text: "text-amber-400", labelColor: "text-amber-500" },
        { label: "Medium", count: sevCounts.medium, bg: "bg-cyan-950/30 border-cyan-900/40", text: "text-cyan-400", labelColor: "text-cyan-500" },
        { label: "Info", count: sevCounts.info, bg: "bg-zinc-900/50 border-zinc-800", text: "text-zinc-400", labelColor: "text-zinc-500" },
      ],
      findings: findingsList,
      analysis: aiText.replace(/[\\p{Emoji}\\p{Emoji_Presentation}\\p{Emoji_Modifier}\\p{Emoji_Component}]/gu, "").trim(),
      suggestions,
    } as any;
    viewTab.value = "results";
    lines.value.push({ tag: "[DONE]", c: "text-emerald-400", text: `自主代理完成 · ${data.steps || "?"} 步骤 · ${((Date.now() - t0) / 1000).toFixed(1)}s` });
  } catch (e: any) {
    lines.value.push({ tag: "[ERROR]", c: "text-red-400", text: `网络错误: ${e.message}` });
  }

  running.value = false;
}

// ── Continue scanning with a specific action ──
async function continueScan(suggestion: { action: string; label: string; desc: string }) {
  viewTab.value = "terminal";
  lines.value.push({ tag: "[ACTION]", c: "text-emerald-400", text: `继续扫描: ${suggestion.label}` });
  lines.value.push({ tag: "[INFO]", c: "text-zinc-500", text: suggestion.desc });

  // Build adaptive prompt based on action
  const actionPrompts: Record<string, string> = {
    "sqlmap-deep": "对目标进行深度 SQL 注入探测，使用 sqlmap --level=3 --risk=2，检查所有注入类型（联合查询、布尔盲注、时间盲注、堆叠查询）",
    "web-full": "执行全面 Web 应用安全审计：Nikto 全端口扫描 + Dirsearch 目录爆破 + XSS/SQLi/SSRF 注入检查 + WAF 绕过检测",
    "ssh-audit": "SSH 安全加固审计：检查弱密码策略、过时加密算法、root 登录配置、端口转发设置",
    "report": "基于已有扫描数据生成完整的合规审计报告，包含 CVSS 评分、修复优先级、补救时间线",
    "rescan": "使用不同模板重新执行完整扫描流程",
  };

  const customPrompt = actionPrompts[suggestion.action] || suggestion.desc;
  running.value = true;

  try {
    const resp = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: targetUrl.value,
        template: suggestion.action,
        skills: [customPrompt],
      }),
    });

    if (!resp.ok) {
      lines.value.push({ tag: "[ERROR]", c: "text-red-400", text: `API 错误: ${resp.status}` });
      running.value = false;
      return;
    }

    const data = await resp.json();
    lines.value.push({ tag: "[DONE]", c: "text-emerald-400", text: `${suggestion.label} 完成 · ${data.steps || "?"} 步骤` });
    if (data.analysis) {
      lines.value.push({ tag: "[AI]", c: "text-zinc-300", text: data.analysis.slice(0, 500) + "..." });
    }
  } catch (e: any) {
    lines.value.push({ tag: "[ERROR]", c: "text-red-400", text: e.message });
  }
  running.value = false;
}

onMounted(async () => {
  lines.value.push(
    { tag: "[BOOT]", c: "text-emerald-400", text: "墨甲编排器 · Smart Orchestration Engine 就绪。" },
  );

  // 加载系统真实可用工具
  try {
    const resp = await fetch("/api/tools");
    const data = await resp.json();
    const sysTools = data.tools || [];
    lines.value.push(
      { tag: "[LOAD]", c: "text-cyan-400", text: `系统工具扫描完成 · ${data.count} 个可用` },
    );

    // 更新工具清单为系统实际安装的工具
    const newGroups: typeof toolGroups.value = [];
    const cats = [...new Set(sysTools.map((t: any) => t.category))];
    for (const cat of cats) {
      const catTools = sysTools.filter((t: any) => t.category === cat);
      newGroups.push({
        emoji: cat.slice(0, 2), name: cat.slice(3), open: cat.includes("Recon"),
        tools: catTools.map((t: any) => ({
          id: t.name.toLowerCase(), name: t.name, standardPort: "any", description: t.description,
          isActive: false, category: cat.includes("Recon") ? "recon" : cat.includes("CVE") ? "cve" : cat.includes("Exploit") ? "exploit" : "defense",
        })),
      });
    }
    if (newGroups.length > 0) toolGroups.value = newGroups;
  } catch {
    lines.value.push({ tag: "[WARN]", c: "text-amber-400", text: "无法获取系统工具清单，使用默认配置。" });
  }

  lines.value.push({ tag: "[WAIT]", c: "text-zinc-600", text: "输入目标 URL — 引擎将自动适配扫描策略。" });
});
</script>

<style>
@keyframes fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fade-in 0.25s ease-out both; }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
</style>
