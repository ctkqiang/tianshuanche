<template>
  <div class="min-h-screen bg-[#0a0a0f] text-slate-200 flex flex-col" style="font-family: 'JetBrains Mono', monospace">
    <!-- ═══ TOP INPUT ZONE ═══ -->
    <header class="border-b border-slate-800 px-6 py-5">
      <div class="max-w-4xl mx-auto flex items-end gap-4">
        <div class="flex-1">
          <label class="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Target Asset URL</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs">$></span>
            <input
              v-model="url"
              placeholder="https://example.com"
              class="w-full bg-transparent border-b border-slate-700 py-2 pl-8 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              @keyup.enter="run"
            />
          </div>
        </div>

        <div class="w-56">
          <label class="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Template</label>
          <select v-model="template" class="w-full bg-transparent border-b border-slate-700 py-2 pr-3 text-sm text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer">
            <option value="full" class="bg-[#0a0a0f]">全面合规审计</option>
            <option value="static" class="bg-[#0a0a0f]">静态代码风险查杀</option>
            <option value="recon" class="bg-[#0a0a0f]">资产情报搜集</option>
          </select>
        </div>

        <button
          :disabled="running"
          @click="run"
          class="px-6 py-2 text-sm font-bold rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 transition-all shrink-0 h-[34px] flex items-center gap-2"
        >
          <span v-if="running" class="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          {{ running ? '扫描中...' : '执行编排任务' }}
        </button>
      </div>
    </header>

    <!-- ═══ MAIN CONTENT: Console + Skills ═══ -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Console (primary view) -->
      <main class="flex-1 flex flex-col min-w-0">
        <!-- Tab bar -->
        <div class="flex gap-0 border-b border-slate-800 px-6">
          <button @click="tab = 'console'" class="px-4 py-2 text-xs border-b-2 transition-colors" :class="tab === 'console' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-600 hover:text-slate-400'">
            终端流水监控
          </button>
          <button @click="tab = 'skills'" class="px-4 py-2 text-xs border-b-2 transition-colors" :class="tab === 'skills' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-600 hover:text-slate-400'">
            技能矩阵 · {{ skillList.length }}
          </button>
        </div>

        <!-- Console view -->
        <div v-show="tab === 'console'" ref="consoleEl" class="flex-1 overflow-y-auto p-5 text-[13px] leading-relaxed space-y-0.5" style="background: radial-gradient(ellipse at top, #0d1117 0%, #0a0a0f 100%)">
          <div v-if="lines.length === 0" class="h-full flex flex-col items-center justify-center text-slate-700 gap-3">
            <span class="text-4xl opacity-30">◈</span>
            <span class="text-xs">输入目标 URL 并选择模板，按下「执行编排任务」</span>
            <div class="flex gap-6 mt-4 text-[10px] text-slate-700">
              <span>🛰️ {{ skillCounts.recon }} 侦察技能</span>
              <span>📡 {{ skillCounts.cve }} 漏洞关联</span>
              <span>💻 {{ skillCounts.code }} 源码审计</span>
              <span>🛡️ {{ skillCounts.defend }} 防御检测</span>
            </div>
          </div>
          <div v-for="(l, i) in lines" :key="i" class="flex gap-3 animate-fade-in" :style="{ animationDelay: '0s' }">
            <span class="shrink-0 w-12 text-right text-[11px]" :class="l.c">{{ l.tag }}</span>
            <span class="text-slate-400">{{ l.text }}</span>
          </div>
          <div v-if="running" class="flex items-center gap-2 pt-1">
            <span class="text-emerald-500 animate-pulse text-base">▊</span>
            <span class="text-slate-700 text-[11px]">processing...</span>
          </div>
        </div>

        <!-- Skills table view -->
        <div v-show="tab === 'skills'" class="flex-1 overflow-y-auto p-5">
          <table class="w-full text-xs">
            <thead class="text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th class="text-left py-2 pr-3 font-medium w-16">#</th>
                <th class="text-left py-2 pr-3 font-medium">Skill</th>
                <th class="text-left py-2 pr-3 font-medium">Category</th>
                <th class="text-left py-2 pr-3 font-medium w-20">Difficulty</th>
                <th class="text-right py-2 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody class="text-slate-400">
              <tr v-for="s in skillList" :key="s.file" class="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                <td class="py-2 pr-3 text-slate-600 font-mono">{{ s.id }}</td>
                <td class="py-2 pr-3 text-slate-300">{{ s.name }}</td>
                <td class="py-2 pr-3 text-slate-500">{{ s.category }}</td>
                <td class="py-2 pr-3">
                  <span class="text-[10px] px-1.5 py-0.5 rounded" :class="diffClass(s.difficulty)">{{ s.difficulty }}</span>
                </td>
                <td class="py-2 text-right">
                  <button @click="scanSkill(s)" class="text-[10px] px-2 py-1 rounded border border-slate-700 text-slate-500 hover:text-emerald-400 hover:border-emerald-700 transition-colors">Scan</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      <!-- Right sidebar: template skill summary -->
      <aside class="w-64 shrink-0 border-l border-slate-800 p-4 overflow-y-auto hidden lg:block">
        <div class="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4">选中模板</div>
        <div class="text-sm text-emerald-400 mb-6 font-medium">{{ templateLabel }}</div>

        <div class="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3">包含技能</div>
        <div class="space-y-1.5">
          <div v-for="g in sidebar" :key="g.emoji" class="text-[11px] flex items-center gap-2 text-slate-500">
            <span>{{ g.emoji }}</span>
            <span class="truncate">{{ g.label }}</span>
            <span class="ml-auto text-slate-700">{{ g.count }}</span>
          </div>
        </div>

        <div v-if="lines.length > 0" class="mt-6 pt-4 border-t border-slate-800">
          <div class="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">最近输出</div>
          <div class="text-[11px] text-slate-600 space-y-1 font-mono">
            <div v-for="(l, i) in lines.slice(-4)" :key="i" class="truncate">{{ l.text.slice(0, 40) }}…</div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, computed, onMounted } from "vue";
import data from "../../skills-data/index.json";

const url = ref("");
const template = ref("full");
const running = ref(false);
const tab = ref("console");
const consoleEl = ref<HTMLElement>();

interface Line { tag: string; c: string; text: string }
const lines = ref<Line[]>([]);

// ── Build skill list from JSON ──
interface SkillItem { id: string; name: string; file: string; category: string; difficulty: string }
const skillList: SkillItem[] = [];

const groupMap: Record<string, string> = {
  "信息搜集": "🛰️ Recon",
  "漏洞扫描": "🛰️ Recon",
  "漏洞管理": "📡 CVE",
  "代码审计": "💻 Code Audit",
  "应急响应": "🛡️ Defense",
  "威胁狩猎": "🛡️ Defense",
  "SOC运营": "🛡️ Defense",
  "安全审计": "🛡️ Defense",
  "漏洞利用": "💥 Exploit",
  "报告撰写": "📝 Report",
};

(data as any).modules.forEach((mod: any) => {
  const cat = groupMap[mod.name_cn] || mod.name_cn;
  mod.skills.forEach((s: any) => {
    skillList.push({ id: `${mod.id}-${skillList.length + 1}`, name: s.name, file: s.file, category: cat, difficulty: s.difficulty });
  });
});

const skillCounts = computed(() => ({
  recon: skillList.filter(s => s.category.includes("Recon")).length,
  cve: skillList.filter(s => s.category.includes("CVE")).length,
  code: skillList.filter(s => s.category.includes("Code")).length,
  defend: skillList.filter(s => s.category.includes("Defense")).length,
}));

const sidebar = computed(() => [
  { emoji: "🛰️", label: "侦察 & 扫描", count: skillCounts.value.recon },
  { emoji: "📡", label: "漏洞关联", count: skillCounts.value.cve },
  { emoji: "💻", label: "源码审计", count: skillCounts.value.code },
  { emoji: "🛡️", label: "防御检测", count: skillCounts.value.defend },
]);

const templateLabel = computed(() => template.value === "full" ? "全面合规审计" : template.value === "static" ? "静态代码风险查杀" : "资产情报搜集");

function diffClass(d: string) {
  if (d === "★★★★★") return "bg-red-950/30 text-red-400";
  if (d === "★★★★") return "bg-amber-950/30 text-amber-400";
  if (d === "★★★") return "bg-cyan-950/30 text-cyan-400";
  return "bg-slate-800 text-slate-600";
}


async function run() {
  running.value = true; lines.value = []; tab.value = "console";
  const target = url.value || "https://example.com";

  lines.value.push({ tag: "[INFO]", c: "text-emerald-400", text: `目标: ${target} — 模板: ${templateLabel.value}` });
  lines.value.push({ tag: "[LOAD]", c: "text-cyan-400", text: `正在加载 ${skillList.length} 项技能规则集...` });

  // Collect selected skills as prompt context
  const skillNames = skillList.slice(0, 20).map(s => `[${s.category}] ${s.name}`);

  try {
    lines.value.push({ tag: "[EXEC]", c: "text-amber-400", text: "正在调用 DeepSeek AI 分析引擎..." });
    await nextTick();

    const resp = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: target, template: template.value, skills: skillNames }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      lines.value.push({ tag: "[ERROR]", c: "text-red-400", text: `API 调用失败: ${err}` });
    } else {
      const data = await resp.json();
      lines.value.push({ tag: "[DONE]", c: "text-emerald-400", text: `AI 分析完成 (${data.model || 'deepseek-chat'})` });
      // Split AI response into lines for console display
      const resultLines = (data.result || "").split("\n").filter(Boolean);
      for (const rl of resultLines) {
        const tag = rl.match(/^\[(.+?)\]/)?.[1] || "NOTE";
        lines.value.push({ tag: `[${tag}]`, c: "text-slate-400", text: rl });
      }
    }
  } catch (e: any) {
    lines.value.push({ tag: "[ERROR]", c: "text-red-400", text: `网络错误: ${e.message}` });
  }

  running.value = false;
}

async function scanSkill(s: SkillItem) {
  tab.value = "console"; running.value = true;
  lines.value.push({ tag: "[EXEC]", c: "text-amber-400", text: `手动词用: ${s.name}` });

  try {
    const resp = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.value || "https://example.com", template: "static", skills: [`[${s.category}] ${s.name}`] }),
    });
    const data = await resp.json();
    const resultLines = (data.result || "").split("\n").filter(Boolean);
    for (const rl of resultLines) {
      lines.value.push({ tag: "[AI]", c: "text-slate-400", text: rl });
    }
    lines.value.push({ tag: "[DONE]", c: "text-emerald-400", text: `${s.name} — 分析完成。` });
  } catch (e: any) {
    lines.value.push({ tag: "[ERROR]", c: "text-red-400", text: `调用失败: ${e.message}` });
  }
  running.value = false;
}

onMounted(() => {
  lines.value.push(
    { tag: "[BOOT]", c: "text-emerald-400", text: `墨甲编排器 v${data.meta.version} — 195 项技能就绪。` },
    { tag: "[WAIT]", c: "text-slate-500", text: "输入 URL 并选择模板，按 Enter 或点击按钮开始扫描。" },
  );
});
</script>

<style>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in 0.3s ease-out both; }

/* Custom scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #334155; }
</style>
