<p align="center">
  <img src="public/logo/cow-logo.png" alt="CowAgent Skill Hub" width="80" />
</p>

<h1 align="center">CowAgent Skill Hub</h1>

<p align="center">
  Browse, search, and install skills for <a href="https://cowagent.ai">CowAgent</a>
</p>

<p align="center">
  <a href="https://skills.cowagent.ai">skills.cowagent.ai</a> ·
  <a href="https://cowagent.ai">CowAgent</a> ·
  <a href="https://docs.cowagent.ai">Docs</a> ·
  <a href="https://github.com/zhayujie/chatgpt-on-wechat">GitHub</a>
</p>

## What is this

CowAgent Skill Hub is the official skill marketplace for [CowAgent](https://github.com/zhayujie/chatgpt-on-wechat). Users can browse, search, and install skills to extend their CowAgent with new capabilities.

## Features

- Browse official, community, and third-party skills
- Search by name, description, or tags
- View skill documentation, files, and install requirements
- One-command install: `cow skill install <name>`
- Community contribution via GitHub Pull Requests

## Architecture

| Component | Technology |
|-----------|-----------|
| Frontend | Astro + Tailwind CSS |
| API | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 (skill zip packages) |
| Hosting | Cloudflare Pages |

## Contributing Skills

1. Fork this repository
2. Create a new directory under `skills/` with your skill name
3. Add a `SKILL.md` file with YAML frontmatter
4. Submit a Pull Request

### SKILL.md Format

```yaml
---
name: my-skill
description: What this skill does
version: 1.0.0
author: your-name
tags: [tag1, tag2]
metadata:
  requires:
    env: [API_KEY_NAME]
    bins: [required-binary]
---

# My Skill

Description and usage instructions...
```

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (frontend)
npm run dev

# Start Workers dev server (API)
npx wrangler dev workers/api.js

# Initialize D1 database
npx wrangler d1 execute cow-skill-hub --local --file=schema.sql
```

## Deployment

```bash
# Deploy frontend to Cloudflare Pages
npm run build

# Deploy Workers API
npx wrangler deploy

# Initialize production D1
npx wrangler d1 execute cow-skill-hub --file=schema.sql
```

## License

MIT
