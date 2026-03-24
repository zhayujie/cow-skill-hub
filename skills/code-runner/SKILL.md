---
name: code-runner
description: Execute code snippets in a sandboxed environment with output capture.
version: 1.0.0
author: CowAgent
tags: [coding, productivity]
metadata:
  requires:
    anyBins: [python3, node]
---

# Code Runner

Safely execute code snippets in a sandboxed environment with automatic output capture and error handling.

## Supported Languages

- Python 3
- JavaScript (Node.js)
- Shell (Bash)

## Features

- Automatic timeout (30s default)
- Output and error capture
- Temporary file cleanup
- Resource limits

## Usage

When the user provides code to execute or asks to run a script, use the bash tool to execute it with appropriate sandboxing.
