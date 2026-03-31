<p align="center">
  <img src="public/logo/cow-logo.png" alt="CowAgent Skill Hub" width="80" />
</p>

<h1 align="center">Cow Skill Hub</h1>

<p align="center">
  [<a href="./README.md">English</a>] | [中文]
</p>

<p align="center">
  发现、浏览和安装 AI Agent 技能的开放平台
</p>

<p align="center">
  <a href="https://skills.cowagent.ai">技能广场</a> ·
  <a href="https://skills.cowagent.ai/submit">提交技能</a> ·
  <a href="https://github.com/zhayujie/chatgpt-on-wechat">CowAgent</a> ·
  <a href="https://docs.cowagent.ai/skills">文档</a>
</p>

---

## 简介

**Cow Skill Hub** 是 [CowAgent](https://github.com/zhayujie/chatgpt-on-wechat) 的官方技能广场，收录了官方推荐、社区贡献和第三方平台的各类 Skills。

Skills 是 AI Agent 的能力扩展包，可以让 Agent 具备调用各类外部工具、服务、命令行的能力。

## 功能

- **浏览技能**：按分类（推荐 / 社区 / 第三方）和标签筛选浏览技能
- **搜索技能**：通过名称、描述快速检索所需技能
- **技能详情**：查看技能说明、文件内容、安装命令、所需环境变量
- **提交技能**：登录后上传技能包，审核通过后公开展示
- **一键安装**：复制安装命令，在 CowAgent 中直接执行即可使用

## 在 CowAgent 中使用技能

### 安装技能

```bash
# 安装技能广场中的社区技能
cow skill install <skill-name>

# 示例：安装飞书CLI技能
cow skill install lark-cli

# 安装来自 GitHub 的技能
cow skill install github:<owner/repo>

# 安装来自 ClawHub 的技能
cow skill install clawhub:<skill-name>
```

### 查看已安装的技能

```bash
cow skill list
```

### 卸载技能

```bash
cow skill uninstall <skill-name>
```

安装完成后，CowAgent 在处理用户请求时会自动识别并调用对应的技能。无需额外配置，重启服务后即可生效。

> 详细使用说明请参考 [CowAgent 文档](https://docs.cowagent.ai/skills)

## 在其他 Agent 中使用技能

Skills 本质上是一组 Markdown 格式的提示词文件（`SKILL.md`） 及相关可选的脚本、引用资源等，可以直接下载并复制到任意Agent中使用，包括但不限于 OpenClaw、Cursor、Claude Code 等。


在技能详情页点击「文件」标签可以查看完整文件内容。

## 提交你的技能

欢迎将自己开发的技能提交到社区！

1. 访问 [skills.cowagent.ai/submit](https://skills.cowagent.ai/submit)
2. 使用 GitHub 或 Google 账号登录
3. 上传包含 `SKILL.md` 的文件夹或 zip 包
4. 填写技能信息（唯一标识、显示名称、简介）
5. 提交后经过自动安全检测和人工审核，通过后公开展示

**技能目录结构要求：**

```
your-skill/
├── SKILL.md          # 必须，技能主文件（位于根目录）
└── ...               # 其他可选文件
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动本地开发服务
npm run dev

# 初始化本地数据库
npx wrangler d1 execute cow-skill-hub --local --file=schema.sql
```


## 部署

```bash
# 构建并部署到 Cloudflare Pages

npm run build
npx wrangler deploy
```

## License

[MIT](./LICENSE) © 2026 zhayujie
