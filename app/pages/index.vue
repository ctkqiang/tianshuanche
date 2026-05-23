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
          <div class="px-4 py-2 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest shrink-0">Terminal</div>
          <div ref="termRef" class="flex-1 overflow-y-auto p-4 text-[12px] leading-relaxed space-y-0.5" style="background: radial-gradient(ellipse at top, #0c0c14 0%, #09090b 100%)">
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
const termRef = ref<HTMLElement>();

interface Line { tag: string; c: string; text: string }
const lines = ref<Line[]>([]);

// ── Tool Inventory ──
interface Tool { id: string; name: string; standardPort: string; description: string; isActive: boolean; category: string }
interface ToolGroup { emoji: string; name: string; open: boolean; tools: Tool[] }

const toolGroups = ref<ToolGroup[]>([
  { emoji: "🛰️", name: "Recon & Scan", open: true, tools: [
    { id: "nmap", name: "Nmap", standardPort: "any", description: "Network mapper", isActive: false, category: "recon" },
    { id: "masscan", name: "Masscan", standardPort: "any", description: "Mass port scanner", isActive: false, category: "recon" },
    { id: "subfinder", name: "Subfinder", standardPort: "53/443", description: "Subdomain discovery", isActive: false, category: "recon" },
    { id: "dirsearch", name: "Dirsearch", standardPort: "80/443", description: "Web path brute-forcer", isActive: false, category: "recon" },
    { id: "shodan", name: "Shodan API", standardPort: "443", description: "Internet device search", isActive: false, category: "recon" },
  ]},
  { emoji: "📡", name: "CVE Association", open: false, tools: [
    { id: "nuclei", name: "Nuclei", standardPort: "any", description: "Template vuln scanner", isActive: false, category: "cve" },
    { id: "grizzly", name: "Grizzly", standardPort: "any", description: "CVE exploit lookup", isActive: false, category: "cve" },
    { id: "vulncheck", name: "VulnCheck", standardPort: "443", description: "Vuln intelligence API", isActive: false, category: "cve" },
  ]},
  { emoji: "💻", name: "Source Code Audit", open: false, tools: [
    { id: "semgrep", name: "Semgrep", standardPort: "any", description: "Static analysis SAST", isActive: false, category: "code" },
    { id: "sonarqube", name: "SonarQube", standardPort: "9000", description: "Code quality platform", isActive: false, category: "code" },
    { id: "trufflehog", name: "Trufflehog", standardPort: "any", description: "Secret scanner", isActive: false, category: "code" },
  ]},
  { emoji: "🛡️", name: "Defense Verification", open: false, tools: [
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
    return { label: "🎯 Static Code Audit", color: "bg-purple-950/60 text-purple-400 border-purple-800/40", type: "code" };
  }
  if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url) || url.startsWith("api.") || url.includes("/api")) {
    setActiveByCategory("recon");
    return { label: "🎯 Network Infrastructure Audit", color: "bg-cyan-950/60 text-cyan-400 border-cyan-800/40", type: "recon" };
  }
  setActiveByCategory("defense");
  return { label: "🎯 Full Web Application Audit", color: "bg-emerald-950/60 text-emerald-400 border-emerald-800/40", type: "web" };
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

// ── Execute ──
async function execute() {
  running.value = true; lines.value = [];
  const url = targetUrl.value || "https://example.com";

  lines.value.push({ tag: "[INIT]", c: "text-emerald-400", text: `墨甲编排器 v0.1 · 目标: ${url}` });
  lines.value.push({ tag: "[ADAPT]", c: "text-amber-400", text: `策略: ${strategy.value.label}` });
  const active = activeSkills.value;
  if (active.length > 0) {
    lines.value.push({ tag: "[ADAPT]", c: "text-cyan-400", text: `自动激活 ${active.length} 个工具: ${active.map(t => t.name).join(", ")}` });
  }

  const steps = executionSteps.value;
  for (let i = 0; i < steps.length; i++) {
    steps[i].status = "active";
    steps[i].tool = active[i]?.name || (i === 0 ? "DNS Probe" : i === 4 ? "AI Engine" : "内置引擎");
    await nextTick();
    await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
    lines.value.push({ tag: "[EXEC]", c: "text-amber-400", text: `执行 ${steps[i].title} · 工具: ${steps[i].tool}` });

    if (i === 0) {
      lines.value.push({ tag: "[HTTP]", c: "text-cyan-400", text: `GET ${url} → 200 OK · Server: nginx` });
    } else if (i === 1) {
      lines.value.push({ tag: "[PORT]", c: "text-cyan-400", text: "开放端口: 22/SSH, 80/HTTP, 443/HTTPS, 3306/MySQL" });
      lines.value.push({ tag: "[WARN]", c: "text-amber-400", text: "MySQL 端口对外暴露" });
    } else if (i === 2) {
      lines.value.push({ tag: "[CVE]", c: "text-red-400", text: "CVE-2024-6387 · OpenSSH RCE · CVSS 9.8" });
    } else if (i === 3) {
      lines.value.push({ tag: "[VERIFY]", c: "text-emerald-400", text: "CVE-2024-6387 · 目标版本匹配 · 可复现" });
    } else if (i === 4) {
      lines.value.push({ tag: "[DONE]", c: "text-emerald-400", text: `报告: /reports/audit_${new Date().toISOString().slice(0, 10)}.json` });
    }
    await nextTick(); termRef.value?.scrollTo({ top: termRef.value.scrollHeight, behavior: "smooth" });
    steps[i].status = "done";
  }
  running.value = false;
}

onMounted(() => {
  lines.value.push(
    { tag: "[BOOT]", c: "text-emerald-400", text: "墨甲编排器 · Smart Orchestration Engine 就绪。" },
    { tag: "[WAIT]", c: "text-zinc-600", text: "输入目标 URL — 引擎将自动适配扫描策略。" },
  );
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
