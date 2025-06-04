Agents.md — Eagle Hall Pass v2 — Contributor + Agent Workflow Guide 🚀
Project Purpose
This repo implements Eagle Hall Pass v2 — a fully digital, policy-aligned student hallway pass system:

Google Apps Script backend

Google Sheets data

HTML/JS front-end (Apps Script templates)

OpenAI Codex Agent in Browser used to assist UI and logic development

Project Structure
kotlin
Copy
Edit
/EagleHallPass
├── AdminUI.js
├── Auth.js
├── Code.js
├── Data.js
├── Router.js
├── Setup.js
├── StudentUI.js
├── SupportUI.js
├── TeacherUI.js
├── admin.html
├── student.html
├── support.html
├── teacher.html
├── Eagle Hall Pass v2.md
└── Agents.md (this file)
Using Codex Agents — Workflow Guide 🧭
1️⃣ Break work into clear single tasks (one purpose per Agent run)
DO:

"Add auto-refresh to Teacher Dashboard"

"Wire Open Pass button to doPost"

"Implement try/catch logging in Code.js"

AVOID:

"Refactor all UIs and update Data.js and Router.js at once" → too big → conflicts.

2️⃣ When editing HTML/JS in Codex:
Edit ONE file at a time (ex: teacher.html only)

Save local copy before accepting large changes

Test in Browser

Commit before moving on

3️⃣ When editing Apps Script (.js) code:
Prefer editing in Apps Script IDE directly

If using Codex:

Edit ONE .js file per session (ex: only Code.js)

DO NOT run Agent across multiple .js files in one session (version drift risk)

4️⃣ Git / Merge Safety 🚦
Common Pitfall:
Codex edits live file → you pull GitHub → conflicts

Safe Flow:

sql
Copy
Edit
git pull → run Agent on ONE file → test → commit → repeat
Golden Rule:
One task → one commit → one Agent session.

Commit Style
Format:

php-template
Copy
Edit
<type>(<scope>): <description>
Examples:

scss
Copy
Edit
feat(Code): Add autoClosePasses implementation
fix(Router): Harden doPost input checks
feat(TeacherUI): Add Open Pass button + wiring
PR Instructions
PR Title format:

csharp
Copy
Edit
[EagleHallPass] <Title>
Testing Checklist (per PR)
Since this is Google Apps Script (no pnpm or Vitest), test manually:

✅ Menu builds (onOpen() → Eagle Hall Pass menu)
✅ doGet() routes correctly by role
✅ doPost() responds OK / ERROR
✅ Student / Teacher / Support / Admin UIs load
✅ Open Pass → Pass Log → Close Pass works
✅ Emergency Mode blocks changes as expected
✅ Auto-close triggers run at correct times

How to Think in Codex Tasks 🧠
One Agent task = One Git commit

Example sequence:
1️⃣ "Add 'Current Pass State' to Student Dashboard" → commit
2️⃣ "Wire Teacher 'Open Pass' button" → commit
3️⃣ "Harden Code.js with try/catch logging" → commit

Final Notes
Codex Agents are powerful but surgical — small steps = success.

Use this Agents.md as your workflow map.

You can always ask the Code Reviewer bot to generate safe starter code first.

If in doubt: small PR > big PR.

TL;DR Codex Safe Flow
sql
Copy
Edit
git pull → run Agent on ONE file → test → commit → repeat
One task → one commit → one Agent run.

Stay in control — and ship safely 🚀.

Eagle Hall Pass v2 — Agent-Ready, Developer-Ready ✅