---
title: "VS Code"
description: "Every setting in settings_sept_2026.jsonc, and what it does"
sidebar_label: "VS Code"
sidebar_position: 10
---

# VS Code

Three files in
[`QDtb/VSCode/`](https://github.com/natebass/QDtb/tree/master/VSCode):

| File | What it is |
|---|---|
| `settings_sept_2026.jsonc` | The current user settings — everything below |
| `keybindings_sept_2026.jsonc` | Four keybindings |
| `settings_old.jsonc` | The previous generation, kept for reference |

They are dated rather than versioned because VS Code settings drift: names get
deprecated, defaults change, and a setting that was worth writing down in 2024
often is not in 2026. Copy `settings_sept_2026.jsonc` over
`~/.config/Code/User/settings.json` to use it.

This page is the reference for what each setting does, so the file itself does
not need comments.

## The shape of it

The settings are overwhelmingly about **removing chrome**. Line numbers, the
status bar, breadcrumbs, the command centre, the layout control, the activity
bar's usual position, indentation guides, the current-line highlight, the
minimap border, the editor's empty-state hint, Zen mode's tabs, the startup
editor, and every confirmation dialog the file explorer offers — all off.

What is left on is deliberate: ligatures, a coloured icon theme, a git-aware
window title, and the PowerShell extension's own panels.

## Editor

| Setting | Value | What it does |
|---|---|---|
| `editor.wordWrap` | `"on"` | Wrap at the viewport width. No horizontal scrolling |
| `editor.lineNumbers` | `"off"` | No line-number gutter |
| `editor.lineHeight` | `1.2` | A multiplier of the font size when under 8; tight |
| `editor.cursorBlinking` | `"solid"` | The cursor does not blink |
| `editor.guides.indentation` | `false` | No vertical indentation guides |
| `editor.guides.highlightActiveIndentation` | `false` | Would highlight the guide you are inside — moot with guides off |
| `editor.guides.highlightActiveBracketPair` | `false` | No emphasis on the bracket pair containing the cursor |
| `editor.foldingHighlight` | `false` | No background tint on a collapsed range |
| `editor.fontVariations` | `true` | Enables variable-font axes. Needs a variable font to do anything |
| `editor.fontLigatures` | `true` | `=>`, `!==`, `->` render as single glyphs |
| `editor.minimap.scale` | `2` | Minimap at 2× the smallest size. Valid range 1–3 |
| `editor.hideCursorInOverviewRuler` | `true` | No cursor marker on the right-hand ruler |
| `editor.overviewRulerBorder` | `false` | No border between the ruler and the text |
| `editor.renderLineHighlight` | `"none"` | The current line is not highlighted at all |
| `editor.occurrencesHighlight` | `"off"` | Other occurrences of the symbol under the cursor are not highlighted |
| `editor.tabCompletion` | `"on"` | `<Tab>` accepts the best suggestion |

### `editor.wordSeparators`

```json
"editor.wordSeparators": "`~!@#%^&*()-=+[{]}\\|;:'\",.<>/?"
```

This is VS Code's default list **with `$` removed**. The difference is the
whole point:

| Text | Default | Here |
|---|---|---|
| `$profile` | two words — `$` then `profile` | one word |
| `$PSScriptRoot` | two words | one word |

Double-clicking, `Ctrl+D` and word-wise cursor movement all follow this list,
so a PowerShell variable or a jQuery-style identifier selects as a unit. Given
that [`files.defaultLanguage`](#files) is `powershell`, that is not an
accident.

`_` is a word character in VS Code's default too, so `snake_case` is already
one word without changing anything.

## Explorer

| Setting | Value | What it does |
|---|---|---|
| `explorer.confirmDelete` | `false` | Delete without a dialog — files go to the trash, so this is recoverable |
| `explorer.confirmDragAndDrop` | `false` | Move by dragging without confirming |
| `explorer.confirmPasteNative` | `false` | Paste files from the OS file manager without confirming |
| `explorer.excludeGitIgnore` | `true` | Hide everything `.gitignore` matches |

`excludeGitIgnore` is the significant one: `node_modules`, `dist` and `build`
disappear from the tree without needing `files.exclude` entries for each. It
also means a file you cannot find in the tree may simply be ignored.

## Files

| Setting | Value | What it does |
|---|---|---|
| `files.exclude` | `{"**/.git": false}` | Overrides VS Code's default of hiding `.git`, so the directory is visible |
| `files.autoSave` | `"onFocusChange"` | Save when the editor loses focus |
| `files.defaultLanguage` | `"powershell"` | The language a new untitled file starts in |
| `files.associations` | `{"*.css": "tailwindcss"}` | Every `.css` file opens in the Tailwind CSS language mode |

`files.autoSave: "onFocusChange"` is the same policy as Neovim's
[autosave](/docs/neovim/custom#autosave), which writes on `FocusLost`.

:::warning[`files.associations` applies to all CSS]
`"*.css": "tailwindcss"` is not scoped to Tailwind projects. A plain
stylesheet in an unrelated repository also opens in that mode, which changes
which extension provides completion and diagnostics for it.

Scoping it to the projects that need it means moving the setting into their
`.vscode/settings.json`.
:::

## Git and diffs

| Setting | Value | What it does |
|---|---|---|
| `git.openRepositoryInParentFolders` | `"always"` | Opening a subfolder still finds the repository above it, without asking |
| `git.confirmSync` | `false` | Sync pulls and pushes with no dialog |
| `git.autofetch` | `true` | Fetch periodically in the background |
| `git.enableSmartCommit` | `true` | With nothing staged, commit **all** changes |
| `diffEditor.renderSideBySide` | `true` | Two panes rather than inline |
| `diffEditor.ignoreTrimWhitespace` | `false` | **Show** whitespace-only changes. VS Code hides them by default |
| `scm.inputFontSize` | `12` | The commit-message box |
| `scm.diffDecorations` | `"minimap"` | Change markers in the minimap only — not in the gutter or the overview ruler |

`ignoreTrimWhitespace: false` is the one worth knowing: the default hides
trailing-whitespace changes in the diff view, which means a diff can look
empty while the commit is not.

`enableSmartCommit: true` plus `confirmSync: false` is a fast loop with no
brakes — commit everything, push without a dialog.

## Terminal

| Setting | Value | What it does |
|---|---|---|
| `terminal.integrated.defaultLocation` | `"editor"` | Terminals open as **editor tabs**, not in the bottom panel |
| `terminal.integrated.fontFamily` | `"'Cousine Nerd Font'"` | A Nerd Font, for the glyphs oh-my-posh and eza use |
| `terminal.integrated.fontSize` | `12` | |
| `terminal.integrated.fontLigatures.enabled` | `true` | Ligatures in the terminal too |
| `terminal.integrated.cursorStyle` | `"line"` | A bar |
| `terminal.integrated.cursorStyleInactive` | `"none"` | The cursor **disappears** in an unfocused terminal |
| `terminal.integrated.tabs.defaultIcon` | `"lightbulb"` | The icon on the tab |
| `terminal.integrated.enablePersistentSessions` | `false` | Terminals do not survive a reload or restart |
| `terminal.integrated.confirmOnKill` | `"never"` | Close a terminal with a running process without asking |
| `terminal.integrated.enableMultiLinePasteWarning` | `"never"` | Paste multiple lines without the "are you sure" dialog |
| `terminal.integrated.initialHint` | `false` | No "press Ctrl+I to ask Copilot" hint in a new terminal |
| `terminal.integrated.env.linux` | `{}` | No extra environment variables |
| `terminal.integrated.env.windows` | `{}` | The same |

`defaultLocation: "editor"` is the structural choice here, and it pairs with
`powershell.integratedConsole.startLocation: "Editor"` below: terminals are
first-class editor tabs that split and tile like files, rather than a drawer.
`cursorStyleInactive: "none"` follows from it — with several terminals open as
tabs, only the focused one should look live.

`enablePersistentSessions: false` means a window reload gives you clean
terminals. With `defaultLocation: "editor"` and
[`window.restoreWindows: "none"`](#window), the intent is consistent: nothing
is restored, everything starts fresh.

### `terminal.integrated.commandsToSkipShell`

```json
[
  "workbench.action.toggleSidebarVisibility",
  "workbench.action.toggleAuxiliaryBar",
  "workbench.action.openGlobalKeybindings",
  "workbench.action.openRecent"
]
```

Keys bound to these commands are handled by VS Code **instead of** being sent
to the shell. Without it, a shell that wants `Ctrl+B` or `Ctrl+S` swallows the
keystroke whenever a terminal has focus.

The list is exactly the commands bound in `keybindings_sept_2026.jsonc` — see
[Keybindings](#keybindings). Adding a keybinding that must work inside a
terminal means adding its command here too.

## PowerShell extension

| Setting | Value | What it does |
|---|---|---|
| `powershell.integratedConsole.startLocation` | `"Editor"` | The PowerShell console opens as an editor tab, matching the terminal setting above |
| `powershell.integratedConsole.showOnStartup` | `false` | Do not open it automatically |
| `powershell.integratedConsole.focusConsoleOnExecute` | `false` | `F8` runs the selection and leaves focus in the editor |
| `powershell.pester.codeLens` | `false` | No "Run tests" / "Debug tests" links above `Describe` blocks |
| `powershell.codeFolding.showLastLine` | `false` | A collapsed block hides its closing brace as well |
| `powershell.promptToUpdatePowerShell` | `false` | No update nag |
| `powershell.buttons.showPanelMovementButtons` | `true` | Panel movement buttons in the console title bar |
| `powershell.sideBar.CommandExplorerVisibility` | `true` | The Command Explorer in the sidebar |

`pester.codeLens: false` with the code-lens links gone means tests are run from
a terminal — which is what
[`Invoke-Tests.ps1`](/docs/powershell/testing) is for, and it does more than
the code lens would.

## Window

| Setting | Value | What it does |
|---|---|---|
| `window.openWithoutArgumentsInNewWindow` | `"off"` | Launching `code` with no path reuses the last window |
| `window.menuBarVisibility` | `"visible"` | Keep the menu bar |
| `window.restoreWindows` | `"none"` | Start with no windows restored |
| `window.commandCenter` | `false` | No search/command box in the title bar |

### `window.title`

```
${dirty}${activeEditorShort}${separator}${dirty}${activeRepositoryName}${separator}${activeRepositoryBranchName}${separator}${profileName}
```

Renders as:

```text
● settings.json — ● QDtb-doc — master — Default
```

| Variable | Value |
|---|---|
| `${dirty}` | A dot when the active editor has unsaved changes |
| `${activeEditorShort}` | The file name, no path |
| `${activeRepositoryName}` | The repository folder name |
| `${activeRepositoryBranchName}` | The current branch |
| `${profileName}` | The VS Code profile |
| `${separator}` | ` — `, and it is **omitted** when the segments around it are empty |

`${dirty}` appears twice, which shows the marker whether you are reading the
title left-to-right from the file or from the repository. The repository and
branch in the title are the same trade
[Fish's `fish_title`](/docs/fish/functions#the-window-title) makes: the branch
lives in the title bar so the prompt does not have to carry it.

Two alternatives are kept commented out below it — one with the full path, one
with no filename at all.

## Workbench

| Setting | Value | What it does |
|---|---|---|
| `workbench.colorTheme` | `"PowerShell ISE"` | From the PowerShell extension — a light theme |
| `workbench.iconTheme` | `"kary-pro-colors-icons"` | Kary Pro Colors |
| `workbench.statusBar.visible` | `false` | No status bar |
| `workbench.activityBar.location` | `"top"` | The activity bar runs horizontally above the sidebar |
| `workbench.layoutControl.enabled` | `false` | No layout toggle in the title bar |
| `workbench.startupEditor` | `"none"` | Open to an empty workbench |
| `workbench.editor.empty.hint` | `"hidden"` | No keyboard-shortcut hint on the empty editor |
| `workbench.editor.enablePreview` | `false` | Single-clicking a file opens a **permanent** tab, not an italic preview one |
| `workbench.editor.editorActionsLocation` | `"titleBar"` | Editor actions in the title bar rather than the tab bar |
| `workbench.editor.pinnedTabSizing` | `"compact"` | A pinned tab shrinks to its icon |

`enablePreview: false` and `pinnedTabSizing: "compact"` go together: every file
you open stays open, so pinning and compacting is how the tab bar stays
navigable.

`statusBar.visible: false` removes the branch, the problems count, the line and
column, and the language mode. The branch is in the
[window title](#windowtitle) instead; the rest is gone.

## Extensions and updates

| Setting | Value | What it does |
|---|---|---|
| `extensions.ignoreRecommendations` | `true` | No "recommended extensions" prompts |
| `extensions.autoCheckUpdates` | `true` | Check for extension updates |
| `extensions.autoUpdate` | `"on"` | And install them |
| `update.mode` | `"manual"` | **VS Code itself** does not auto-update |
| `update.showReleaseNotes` | `false` | No release notes tab after an update |

The split is deliberate: extensions update themselves, the editor does not.
An editor that updates itself changes under you; an extension that does not
update breaks against the language server it talks to.

## Debug, notebooks, markdown, Zen mode

| Setting | Value | What it does |
|---|---|---|
| `debug.openDebug` | `"neverOpen"` | Do not switch to the Debug view when a session starts |
| `debug.showBreakpointsInOverviewRuler` | `true` | Breakpoint markers on the right-hand ruler |
| `debug.console.fontSize` | `11` | |
| `notebook.output.fontSize` | `14` | |
| `notebook.output.lineHeight` | `1` | |
| `notebook.markup.fontSize` | `14` | Markdown cells |
| `notebook.insertFinalNewline` | `true` | Trailing newline in code cells on save |
| `markdown.preview.lineHeight` | `1` | |
| `zenMode.showTabs` | `"none"` | No tab bar in Zen mode |

`debug.showBreakpointsInOverviewRuler: true` is one of the few things turned
*on* in the chrome-removal list. With [line numbers off](#editor) and no
current-line highlight, the ruler is the only place a breakpoint is visible.

`powershell/Scripts/Getting Started with .NET.dib` is the notebook those
notebook settings are for.

## Security and tasks

| Setting | Value | What it does |
|---|---|---|
| `security.workspace.trust.startupPrompt` | `"always"` | Always ask whether to trust a folder |
| `security.workspace.trust.untrustedFiles` | `"open"` | Open files from an untrusted folder without a second prompt |
| `task.allowAutomaticTasks` | `"on"` | Run a folder's `runOn: folderOpen` tasks automatically |

:::warning[`allowAutomaticTasks` runs code from the folder]
A `tasks.json` with `"runOn": "folderOpen"` executes as soon as the folder is
opened. `"on"` removes the prompt that would otherwise ask first.

Workspace trust is the mitigation — `startupPrompt: "always"` means you are
asked to trust the folder, and automatic tasks do not run in an untrusted one.
The two settings are a pair, and turning the prompt off would leave nothing
between a cloned repository and an arbitrary command.
:::

## Copilot and chat

```json
"github.copilot.enable": {
  "*": true,
  "plaintext": false,
  "markdown": true,
  "scminput": false,
  "powershell": false,
  "jsonc": false,
  "typescriptreact": true,
  "javascript": true
}
```

On everywhere, then turned off for four languages:

| Language | Why it is off |
|---|---|
| `plaintext` | Prose, where completions are noise |
| `scminput` | The commit-message box — suggestions there write your history |
| `powershell` | |
| `jsonc` | Settings and config files, where a plausible-looking invented key is worse than no suggestion |

`markdown`, `typescriptreact` and `javascript` are listed explicitly although
`"*": true` already covers them, which makes the intent readable rather than
inferred.

| Setting | Value | What it does |
|---|---|---|
| `github.copilot.nextEditSuggestions.enabled` | `true` | Suggests the *next* edit, not just a completion at the cursor |
| `github.copilot.chat.codesearch.enabled` | `true` | Chat can search the workspace for context |
| `github.copilot.chat.languageContext.typescript.enabled` | `true` | Extra TypeScript context for chat |
| `github.copilot.chat.newWorkspaceCreation.enabled` | `true` | Chat can scaffold a new workspace |
| `chat.permissions.default` | `"autopilot"` | The default permission level for chat tool calls |
| `chat.mcp.gallery.enabled` | `true` | The MCP server gallery |

## Language-specific

### `[dockercompose]`

```json
"[dockercompose]": {
  "editor.insertSpaces": true,
  "editor.tabSize": 2,
  "editor.autoIndent": "advanced",
  "editor.defaultFormatter": "redhat.vscode-yaml"
}
```

Spaces, two wide, because YAML cannot be indented with tabs — the same
reasoning as [Neovim's web-language
overrides](/docs/neovim/custom/code-style#prettier-compatible-indentation).
`autoIndent: "advanced"` uses the language's own indentation rules rather than
copying the previous line.

This is the only language-specific block still active. Nine more —
`[json]`, `[javascript]`, `[jsonc]`, `[go]`, `[python]`, `[typescriptreact]`,
`[xml]`, `[java]`, `[powershell]`, `[yaml]`, `[github-actions-workflow]`,
`[lua]` — are commented out, each of which only set a `defaultFormatter`. With
`editor.formatOnSave` also commented out, none of them had anything to do.

### Ruff

```json
"ruff.lint.select": [],
"ruff.lint.ignore": ["ANN201", "ANN202", "ANN205", "ANN204", "ANN206"]
```

`select` is empty, so the editor does not override which rules run — each
project's own `pyproject.toml` or `ruff.toml` decides. A project with no ruff
configuration gets ruff's defaults (`E4`, `E7`, `E9`, `F`).

The five ignored rules are all of flake8-annotations' *missing return type*
checks:

| Rule | Missing return type annotation for |
|---|---|
| `ANN201` | a public function |
| `ANN202` | a private function |
| `ANN204` | a special method (`__init__` and friends) |
| `ANN205` | a static method |
| `ANN206` | a class method |

So parameter annotations are still enforced and return annotations are
optional. `ANN203` — overloaded method — is not in the list, which is the one
gap.

### Schemas

```json
"json.schemaDownload.trustedDomains": {
  "https://schemastore.azurewebsites.net/": true,
  "https://raw.githubusercontent.com/microsoft/vscode/": true,
  "https://raw.githubusercontent.com/devcontainers/spec/": true,
  "https://www.schemastore.org/": true,
  "https://json.schemastore.org/": true,
  "https://json-schema.org/": true,
  "https://developer.microsoft.com/json-schemas/": true,
  "https://biomejs.dev": true
}
```

VS Code asks before downloading a JSON schema from a domain it has not seen.
This is the allowlist of domains it may fetch from without asking — an
allowlist rather than a blanket "trust everything", so a schema URL in a
random repository still prompts.

```json
"yaml.disableSchemaDetection": [
  "**/.github/workflows/*.yml",  "**/.github/workflows/*.yaml",
  "**/.gitea/workflows/*.yml",   "**/.gitea/workflows/*.yaml",
  "**/.forgejo/workflows/*.yml", "**/.forgejo/workflows/*.yaml"
]
```

Stops the Red Hat YAML extension guessing a schema for CI workflow files. The
GitHub Actions extension already provides one, and two extensions offering
competing schemas for the same file produce contradictory diagnostics. Gitea
and Forgejo use the same workflow format, so their directories are listed too.

## The remaining extensions

| Setting | Value | Extension |
|---|---|---|
| `cSpell.userWords` | `Cobex`, `deca`, `lexend`, `nateb`, `tabler`, `turbopack` | Code Spell Checker — the personal dictionary, the same idea as Neovim's [`spell/en.utf-8.add`](/docs/neovim/general#spell) |
| `peacock.favoriteColors` | Nine named colours | Peacock — tints the window chrome per project, so two windows are distinguishable |
| `vscode-edge-devtools.headless` | `false` | Edge DevTools opens a visible browser |
| `redhat.telemetry.enabled` | `true` | Telemetry for every Red Hat extension |
| `js/ts.updateImportsOnFileMove.enabled` | `"always"` | Rewrite imports when a file moves, without asking |
| `js/ts.experimental.useTsgo` | `true` | Use the native Go port of the TypeScript compiler |

Peacock's list is the framework palette: Angular Red `#dd0531`, Azure Blue
`#007fff`, JavaScript Yellow `#f9e64f`, Mandalorian Blue `#1857a4`, Node Green
`#215732`, React Blue `#61dafb`, Something Different `#832561`, Svelte Orange
`#ff3d00`, Vue Green `#42b883`.

:::note[Two settings worth revisiting]
`redhat.telemetry.enabled` is `true`, and it is opt-in — Red Hat extensions
collect nothing until it is. Set it to `false` if that was not intended.

`js/ts.experimental.useTsgo` opts into a compiler that is, as the setting name
says, experimental. Worth turning off first when TypeScript tooling starts
behaving oddly.
:::

## Keybindings

`keybindings_sept_2026.jsonc` has four entries.

| Key | Command | When |
|---|---|---|
| `ctrl+b` | `workbench.action.toggleSidebarVisibility` | always |
| `ctrl+s` | `workbench.action.toggleAuxiliaryBar` | always |
| `ctrl+\`` | `workbench.action.navigateBack` | `terminalEditorFocus` |
| `ctrl+\`` | Open the PowerShell Extension Terminal | `!terminalEditorFocus` |

Two things to notice:

- **`ctrl+s` is not save.** It toggles the secondary sidebar. With
  [`files.autoSave: "onFocusChange"`](#files) there is nothing left for a save
  key to do, so the key was reclaimed.
- **`ctrl+\`` is a toggle built out of two bindings.** Rather than one command
  that switches, there are two with opposite `when` clauses: in a terminal it
  navigates back to where you came from, and outside one it opens the
  PowerShell terminal. The second uses `runCommands` to chain a quick-open
  with a text argument and then accept the first result — a "run this command
  by name" macro, for a command with no id of its own.

Both `ctrl+b` and `ctrl+s` need entries in
[`commandsToSkipShell`](#terminalintegratedcommandstoskipshell), or a shell
with focus would eat them.

Two further bindings are commented out — `ctrl+alt+b` for the auxiliary bar
and `ctrl+k s` for the keyboard-shortcuts editor.

## Commented out

Several blocks are kept rather than deleted, and together they say what was
tried:

- **`editor.fontSize` and `editor.fontFamily`** — a Nerd Font stack at 13.2px.
  Only the terminal sets a font now; the editor uses the system default.
- **`editor.formatOnSave`** and **`editor.codeActionsOnSave` with
  `source.organizeImports`** — formatting is not automatic. That matches the
  Neovim side, where `<leader>a` runs Prettier and `<leader>w` runs stylua
  [on demand](/docs/neovim/custom/code-style#formatting-keys).
- **Twelve `[language]` blocks**, each setting only a `defaultFormatter`.
- **`editor.renderLineHighlightOnlyWhenFocus`**, `python.pythonPath`, three
  Java settings, `window.openFoldersInNewWindow`, and two markdownlint
  entries.

`settings_old.jsonc` (291 lines) is the previous generation of the same file,
kept for the same reason.
