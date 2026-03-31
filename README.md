<p align="center">
  <img src="public/logo/cow-logo.png" alt="CowAgent Skill Hub" width="80" />
</p>

<h1 align="center">Cow Skill Hub</h1>

<p align="center">
  [English] | [<a href="./README-ZH.md">中文</a>]
</p>

<p align="center">
  An open platform to discover, browse, and install AI Agent Skills
</p>

<p align="center">
  <a href="https://skills.cowagent.ai">🧩 Skill Hub</a> &nbsp;·&nbsp;
  <a href="https://skills.cowagent.ai/submit">📦 Submit a Skill</a> &nbsp;·&nbsp;
  <a href="https://github.com/zhayujie/chatgpt-on-wechat">🤖 CowAgent</a> &nbsp;·&nbsp;
  <a href="https://docs.cowagent.ai/skills">📖 Docs</a>
</p>

---

## Introduction

**Cow Skill Hub** is an open skill marketplace for AI Agents — including CowAgent, OpenClaw, Claude Code, and more — featuring official, community-contributed, and third-party Skills from GitHub, ClawHub, and other platforms.

## Features

- **Browse** skills by category (Recommended / Community / Third-party) and tags
- **Search** by name or description
- **View** skill docs, file contents, install commands, and required environment variables
- **Submit** your own skill — upload a package and it will be reviewed and published
- **One-command install** — copy the install command and run it in CowAgent

## Submit Your Skill

Contributions are welcome!

1. Go to [skills.cowagent.ai/submit](https://skills.cowagent.ai/submit)
2. Sign in with GitHub or Google
3. Upload a folder or zip with `SKILL.md` at the root
4. Fill in the skill name, display name, and description
5. Submit — it will go through safety checks and review before being published

**Required structure:**

```
your-skill/
├── SKILL.md        # required, must be at the root
└── ...             # other optional files
```

## Using Skills in CowAgent

> CowAgent project: [github.com/zhayujie/chatgpt-on-wechat](https://github.com/zhayujie/chatgpt-on-wechat)

### Install a skill

```bash
# Install a skill from the Skill Hub
cow skill install <skill-name>

# Install from GitHub
cow skill install github:<owner/repo>

# Install from ClawHub
cow skill install clawhub:<skill-name>
```

### List installed skills

```bash
cow skill list
```

### Uninstall a skill

```bash
cow skill uninstall <skill-name>
```

Once installed, CowAgent automatically recognizes and invokes the skill when relevant. No extra configuration needed — just restart the service.

> See the [CowAgent Docs](https://docs.cowagent.ai/skills) for detailed usage.

## Using Skills in Other Agents

Skills are built around a `SKILL.md` file — a Markdown prompt describing what the Agent can do. You can download the file from the skill detail page (click the **Files** tab) and use it in any Agent that supports system prompts or custom instructions, including OpenClaw, Cursor, Claude Code, and more.

## Local Development

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Initialize the local database
npx wrangler d1 execute cow-skill-hub --local --file=schema.sql
```

## Deployment

```bash
npm run build
npx wrangler deploy
```

## License

[MIT](./LICENSE) © 2026 zhayujie
