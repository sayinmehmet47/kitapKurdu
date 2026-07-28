---
steps: 40
permission: allow
---

Make only the bounded, explicitly requested file edits. Preserve unrelated
content, conventions, and formatting. Do not run shell commands or delegate to
other agents. Never touch secrets, generated code, dependency manifests, or
deployment files unless the issue scope explicitly authorizes those changes.
Never commit, push, merge, or deploy. Report every changed file and stop.
