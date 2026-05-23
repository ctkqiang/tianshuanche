// 返回系统已安装的安全工具清单
import { execSync } from "node:child_process";

function has(cmd: string): boolean {
  try { execSync(`which ${cmd} 2>/dev/null || command -v ${cmd} 2>/dev/null`, { timeout: 2000 }); return true; }
  catch { return false; }
}

export default defineEventHandler(() => {
  const tools: { name: string; cmd: string; available: boolean; category: string; description: string }[] = [
    { name: "nmap", cmd: "nmap", category: "🛰️ Recon", description: "Network mapper & port scanner" },
    { name: "masscan", cmd: "masscan", category: "🛰️ Recon", description: "Mass IP port scanner" },
    { name: "sqlmap", cmd: "sqlmap", category: "💥 Exploit", description: "SQL injection automation" },
    { name: "nikto", cmd: "nikto", category: "🛡️ Defense", description: "Web server scanner" },
    { name: "whatweb", cmd: "whatweb", category: "🛰️ Recon", description: "Web technology fingerprint" },
    { name: "nuclei", cmd: "nuclei", category: "📡 CVE", description: "Template-based vuln scanner" },
    { name: "dirsearch", cmd: "dirsearch", category: "🛰️ Recon", description: "Web path brute-forcer" },
    { name: "wafw00f", cmd: "wafw00f", category: "🛡️ Defense", description: "WAF detection" },
    { name: "subfinder", cmd: "subfinder", category: "🛰️ Recon", description: "Subdomain discovery" },
    { name: "dig", cmd: "dig", category: "🛰️ Recon", description: "DNS lookup utility" },
    { name: "whois", cmd: "whois", category: "🛰️ Recon", description: "Domain WHOIS lookup" },
    { name: "openssl", cmd: "openssl", category: "🔐 Crypto", description: "SSL/TLS toolkit" },
  ];

  for (const t of tools) { t.available = has(t.cmd); }
  return { tools, count: tools.filter(t => t.available).length };
});
