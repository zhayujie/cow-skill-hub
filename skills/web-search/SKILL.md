---
name: web-search
description: Search the web using Google/Bing API and summarize results.
version: 1.0.0
author: CowAgent
tags: [search, web]
metadata:
  requires:
    env: [GOOGLE_API_KEY]
---

# Web Search

Search the internet for real-time information using Google or Bing search APIs.

## Usage

When the user asks about current events, recent information, or anything that requires up-to-date data, use this skill to search the web.

### Supported Search Engines

- **Google Custom Search** - Requires `GOOGLE_API_KEY` and `GOOGLE_CX_ID`
- **Bing Search** - Requires `BING_API_KEY`

## Setup

1. Get your API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Set the environment variable:

```bash
export GOOGLE_API_KEY=your_api_key_here
```

## Examples

- "Search for the latest news about AI agents"
- "What happened in tech this week?"
- "Find the current weather in Beijing"
