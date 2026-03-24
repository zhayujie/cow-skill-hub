---
name: github-tool
description: "GitHub operations via gh CLI: issues, PRs, releases, code browsing."
version: 1.2.0
author: CowAgent
tags: [coding, devops, api]
metadata:
  requires:
    bins: [gh]
  install:
    - kind: brew
      formula: gh
      bins: [gh]
      label: "Install GitHub CLI (brew)"
---

# GitHub

Interact with GitHub repositories using the `gh` CLI tool.

## Capabilities

- Create and manage Issues
- View and review Pull Requests
- Create Releases
- Browse repository code
- Manage GitHub Actions workflows

## Prerequisites

Install the GitHub CLI:

```bash
brew install gh
gh auth login
```

## Examples

- "Create an issue titled 'Bug: login fails on mobile'"
- "Show me the open PRs for this repo"
- "Create a release v1.0.0 with the latest changes"
