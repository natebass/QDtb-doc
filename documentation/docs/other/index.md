---
title: "Other"
description: "VS Code, Emacs, IntelliJ and the templates directory"
sidebar_label: "Overview"
sidebar_position: 1
---

# Other

The parts of `QDtb/` that are not Neovim, Fish or PowerShell.

| Section | What it covers | State |
|---|---|---|
| [VS Code](/docs/other/vscode) | Every setting in `settings_sept_2026.jsonc`, plus the four keybindings | Complete |
| [Emacs](/docs/other/emacs) | The Emacs 31 `init.el` and the `user-lisp` library | Structure only |
| [MELPA](/docs/other/emacs-melpa) | The package archive, and why its downloads are not committed | Complete |
| [IntelliJ](/docs/other/intellij) | IdeaVim for the JetBrains IDEs | Stub |
| [Templates](/docs/other/templates) | Starter files for new projects | Stub |

## Why one configuration repository

Four editors and two shells share a directory because they share decisions,
and most of this documentation is about those rather than about any one tool.
A few that recur:

- **Nothing formats on save.** Neovim's `<leader>a` runs Prettier and
  `<leader>w` runs stylua; VS Code's `editor.formatOnSave` is commented out.
  Formatting is a thing you ask for.
- **Everything autosaves.** Neovim writes on `FocusLost`, VS Code on
  `onFocusChange`. The editors differ on almost everything else and agree on
  this.
- **The window title carries the git branch.** Neovim, Emacs, VS Code and
  Fish all set it, so the branch is never in the prompt or the status bar.
- **Generated output is not committed.** Emacs's `.elc` and `elpa/`, Neovim's
  `parser/`, the documentation site's `docs/reference/`. Lockfiles are, and
  downloads are not.

The exception is `$EDITOR`, which points at
[Emacs](/docs/other/emacs), not at Neovim.
