# 天枢安册 · TianshuAnce

> 墨甲编排器 (Mojia Orchestrator) — 自主安全扫描代理引擎

## 概念验证 (Proof of Concept)

本项目目前处于概念验证阶段。实现了基于 DeepSeek AI 驱动的自主安全扫描代理，能够自动检测系统已安装的安全工具（nmap、sqlmap、nikto、whatweb 等），根据目标 URL 自动适配扫描策略，链式执行安全审计步骤，并生成结构化分析报告。

**注意：** 本项目为前端概念验证，尚未经过生产环境测试。仅供安全研究和教育目的使用。未经授权禁止对非自有资产进行扫描。

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Nuxt 4 + Vue 3 Composition API |
| UI | Nuxt UI v4 + Tailwind CSS |
| 图标 | @iconify-json/lucide |
| AI 引擎 | DeepSeek API (OpenAI 兼容) |
| 安全工具 | nmap, sqlmap, nikto, whatweb, dirsearch 等 |
| 运行时 | Bun |

## 快速开始

```bash
# 1. 配置 DeepSeek API Key
cp .env.example .env
# 编辑 .env: NUXT_DEEPSEEK_API_KEY=sk-your-key-here

# 2. 安装依赖
bun install

# 3. 启动开发服务器
bun dev
```

访问 `http://localhost:3000`

## 功能特性

- **自主代理引擎** — 自动检测系统已安装的安全工具，根据前一步扫描结果自动决策下一步执行什么
- **智能策略适配** — 分析目标 URL 特征（IP/域名/API/Git 仓库），自动推荐最优扫描策略
- **链式执行管线** — DNS → WHOIS → HTTP 探测 → Nmap → SSL → WhatWeb → Nikto → SQLMap → AI 分析
- **结构化报告** — AI 分析结果解析为分类卡片（严重/高危/中危/低危/信息），含发现描述和修复建议
- **持续扫描** — 扫描完成后根据发现自动推荐后续操作（SQL 深度注入、Web 全量审计、SSH 加固检查）
- **真实工具集成** — 调用系统真实安装的安全工具，非模拟数据

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│  Vue 3 前端 (Nuxt 4)                                 │
│  墨甲编排器 Dashboard · Terminal · Results            │
├─────────────────────────────────────────────────────┤
│  Nuxt API Server                                     │
│  /api/tools  — 系统工具检测                           │
│  /api/scan   — 自主代理扫描引擎                       │
├─────────────────────────────────────────────────────┤
│  系统安全工具                                         │
│  nmap · sqlmap · nikto · whatweb · dirsearch          │
├─────────────────────────────────────────────────────┤
│  DeepSeek AI                                         │
│  分析扫描结果 · 生成安全报告                           │
└─────────────────────────────────────────────────────┘
```

## 目录结构

```
tianshuanche/
├── app/
│   ├── pages/
│   │   └── index.vue          # 主仪表板组件
│   └── assets/css/
├── server/
│   └── api/
│       ├── scan.post.ts        # 自主代理扫描端点
│       └── tools.get.ts        # 系统工具检测端点
├── skills-data/
│   └── index.json              # 195 项安全技能数据库
├── .env                        # DeepSeek API Key 配置
└── nuxt.config.ts
```

## 可用安全工具

系统启动时自动检测以下工具是否已安装：

| 工具 | 类别 | 用途 |
|------|------|------|
| nmap | 侦察 | 端口扫描与服务识别 |
| masscan | 侦察 | 大规模 IP 端口扫描 |
| sqlmap | 漏洞利用 | SQL 注入自动化 |
| nikto | 防御 | Web 服务器扫描 |
| whatweb | 侦察 | Web 技术栈指纹识别 |
| nuclei | CVE | 模板化漏洞扫描 |
| dirsearch | 侦察 | Web 路径爆破 |
| wafw00f | 防御 | WAF 检测 |
| subfinder | 侦察 | 子域名发现 |
| dig | 侦察 | DNS 查询 |
| whois | 侦察 | 域名注册信息 |
| openssl | 加密 | SSL/TLS 证书分析 |

## 许可证

MIT

---

# TianshuAnce · Mojia Orchestrator

> Autonomous Security Scanning Agent Engine

## Proof of Concept

This project is currently in proof-of-concept stage. It implements a DeepSeek AI-driven autonomous security scanning agent capable of detecting installed security tools on the system (nmap, sqlmap, nikto, whatweb, etc.), automatically adapting scanning strategies based on target URLs, chaining security audit steps, and generating structured analysis reports.

**Note:** This is a frontend proof of concept and has not been tested in production environments. For security research and educational purposes only. Unauthorized scanning of assets you do not own is prohibited.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 + Vue 3 Composition API |
| UI | Nuxt UI v4 + Tailwind CSS |
| Icons | @iconify-json/lucide |
| AI Engine | DeepSeek API (OpenAI compatible) |
| Security Tools | nmap, sqlmap, nikto, whatweb, dirsearch, etc. |
| Runtime | Bun |

## Quick Start

```bash
# 1. Configure DeepSeek API Key
cp .env.example .env
# Edit .env: NUXT_DEEPSEEK_API_KEY=sk-your-key-here

# 2. Install dependencies
bun install

# 3. Start dev server
bun dev
```

Open `http://localhost:3000`

## Features

- **Autonomous Agent Engine** — Auto-detects installed security tools, decides next steps based on previous scan results
- **Smart Strategy Adaptation** — Analyzes URL characteristics (IP/domain/API/Git repo) to recommend optimal scanning strategy
- **Chained Execution Pipeline** — DNS → WHOIS → HTTP Probe → Nmap → SSL → WhatWeb → Nikto → SQLMap → AI Analysis
- **Structured Reports** — AI analysis parsed into categorized cards (Critical/High/Medium/Low/Info) with findings and recommendations
- **Continuous Scanning** — Suggests follow-up actions based on scan findings (SQL deep injection, Web full audit, SSH hardening)
- **Real Tool Integration** — Executes actual system-installed security tools, not simulated data

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Vue 3 Frontend (Nuxt 4)                             │
│  Mojia Dashboard · Terminal · Results                 │
├─────────────────────────────────────────────────────┤
│  Nuxt API Server                                     │
│  /api/tools  — System tool detection                  │
│  /api/scan   — Autonomous agent scan engine           │
├─────────────────────────────────────────────────────┤
│  System Security Tools                               │
│  nmap · sqlmap · nikto · whatweb · dirsearch          │
├─────────────────────────────────────────────────────┤
│  DeepSeek AI                                         │
│  Analyzes scan results · Generates security reports   │
└─────────────────────────────────────────────────────┘
```

## Directory Structure

```
tianshuanche/
├── app/
│   ├── pages/
│   │   └── index.vue          # Main dashboard component
│   └── assets/css/
├── server/
│   └── api/
│       ├── scan.post.ts        # Autonomous agent scan endpoint
│       └── tools.get.ts        # System tool detection endpoint
├── skills-data/
│   └── index.json              # 195 security skill database entries
├── .env                        # DeepSeek API Key config
└── nuxt.config.ts
```

## Available Security Tools

System auto-detects the following tools on startup:

| Tool | Category | Purpose |
|------|----------|---------|
| nmap | Recon | Port scanning & service detection |
| masscan | Recon | Mass IP port scanning |
| sqlmap | Exploit | SQL injection automation |
| nikto | Defense | Web server scanner |
| whatweb | Recon | Web tech stack fingerprinting |
| nuclei | CVE | Template-based vulnerability scanning |
| dirsearch | Recon | Web path brute-forcing |
| wafw00f | Defense | WAF detection |
| subfinder | Recon | Subdomain discovery |
| dig | Recon | DNS lookup |
| whois | Recon | Domain registration info |
| openssl | Crypto | SSL/TLS certificate analysis |

## License

MIT
