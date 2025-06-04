# Eagle Hall Pass v2 • AI Agent & Contributor Guide 🚀

> **Why this doc exists** – Whether you are a human contributor or an OpenAI Codex‑style agent, this guide spells out the *safe, repeatable workflow* for adding features and fixing bugs in Eagle Hall Pass v2. Follow it and you will ship 🟢‑green PRs every time.

---

## ⚡ Quick‑Start Checklist

|  ✔︎  |  Step                                                                       |
| ---- | --------------------------------------------------------------------------- |
|  ⬜   |  `git pull` — make sure you’re on `main` and up‑to‑date                     |
|  ⬜   |  Create a **tiny** branch named `feat/<what>` or `fix/<what>`               |
|  ⬜   |  Run `npm run test` *(or `runAllTests()` in Apps Script)* – all green first |
|  ⬜   |  Open **ONE** task card or issue 👉 copy its *Acceptance Criteria*          |
|  ⬜   |  Write a clear **agent prompt** (see template below)                        |
|  ⬜   |  Let the agent change just **one file** *(two max)*                         |
|  ⬜   |  `git add -p` – stage only what you understand                              |
|  ⬜   |  Run tests again – they *must* stay green                                   |
|  ⬜   |  Commit → Push → Open PR                                                    |
|  ⬜   |  Ask for human review *(or merge if pair‑approved)*                         |

> 👀 **Remember:** one task → one branch → one PR → one agent run. Keep the blast radius tiny.

---

## 📂 Repo Layout (high‑level)

```
EagleHallPass/
├── .github/           • PR templates & workflow actions
├── appsscript.json    • GAS manifest
├── *.gs / *.js        • Backend logic (V8 runtime)
│   ├── Code.js        • Pass lifecycle engine
│   ├── Data.js        • Sheet helpers & constants
│   ├── Auth.js        • Privilege helpers (already unit‑tested)
│   └── Router.js      • doGet / doPost dispatcher
├── views/             • HTML + JessieScript UI templates
├── tests/
│   ├── testAuth.js    • Existing auth harness
│   └── testPassEngine.gs • (New!) full lifecycle tests
└── docs/              • Specs, changelogs, policy docs
```

---

## 🤖 Agent Prompt Template

> **Copy → Paste → Fill in blanks**

````text
TASK
<✅  Imperative sentence describing exactly one thing to build / fix>

CONTEXT
• File(s): <Code.js line 123‑231>
• Spec refs: docs/PassLifecycle.md §"Status Matrix"
• Constraints: Google Apps Script V8 / no external libs

SUCCESS
1. <observable result 1>
2. <observable result 2>

OUTPUT
<file‑diff or full file wrapped in ```>
````

**Why it works** – The agent sees *scope*, *tests*, *boundaries*, and *where* to look. Nothing more, nothing less.

---

## 🛟 Safe‑Run Workflow (Humans & Agents)

1. **Pull** fresh code & make a short‑lived branch.
2. **Write / refine tests *first*** if the task is bug‑fixing.
3. **Run the agent** on the *smallest surface area* possible.
4. **Inspect** the diff → ask: *"Do I understand every line?"*  If not, revert & retry smaller.
5. **Run `runAllTests()`** – harness lives in `tests/testPassEngine.gs` and is idempotent.
6. **Manually smoke test** in a copy of the production sheet *(never the live sheet!).*
7. **Commit → PR**. Reference the issue number in the title.

> ✋ **Red flag:** If tests go red, *do not* push fixes directly. First update the tests to capture the bug, then guide the agent (or yourself) to make the minimal patch.

---

## ✨ Coding Standards (TL;DR)

* **One export per file** where possible
* **Logger** > `console.log` – keep output JSON‑serialisable
* **Arrow functions** for callbacks; `function` for top‑level exports
* **Sheet constants** live in `Data.js` – hard‑coding names is a CI failure
* **Always return** something – even `void` → `return;` for clarity

---

## 🧩 Do & Don’t Cheat‑Sheet

|  ✅ Do                                       |  🚫 Don’t                      |
| ------------------------------------------- | ------------------------------ |
| Write idempotent functions                  | Mutate global state in tests   |
| Add tests *with* fixes                      | Add fixes *without* tests      |
| Prompt the agent with explicit line numbers | Ask it to “just figure it out” |
| Keep PRs < 200 loc                          | Drop 1k‑line mega commits      |

---

## 🕵️ Troubleshooting FAQ

<details>
<summary>Agent keeps renaming my functions</summary>
Lock the names in the prompt:
```text
“Do not change the public signature of openPass(studentId,…) – tests rely on it.”
```
</details>

<details>
<summary>Tests pass locally but fail in production</summary>
Make sure your Apps Script project is bound to the **staging** spreadsheet. Live data may hold shape you never anticipated.
</details>

<details>
<summary>I get `Exception: You do not have permission to call deleteRows`</summary>
Run the harness as an **editor** on the sheet or mock the calls with `SpreadsheetApp.flush()` disabled.
</details>

---

## 🗂 Reference Docs

* `docs/PassStateLogic.md` – single‑source‑of‑truth for state and status
* [Apps Script V8 Style Guide](https://developers.google.com/apps-script/guides/v8-runtime)
* [Google Sheets API quota](https://developers.google.com/sheets/api/limits)

---

Made with ❤️ for teachers who like their hallways orderly and their code bases tidy.
