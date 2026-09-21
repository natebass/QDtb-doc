---
title: "Templates"
description: "Starter files kept for copying into new projects"
sidebar_label: "Templates"
sidebar_position: 40
---

# Templates

:::note[Stub]
This page is a placeholder. The individual templates are not documented.
:::

[`QDtb/templates/`](https://github.com/natebass/QDtb/tree/master/templates) is
310 files of starter material — things to copy into a new project rather than
configuration Neovim or any other tool loads. **Nothing here is on any
runtimepath, and nothing is sourced.**

| Path | Roughly |
|---|---|
| `Git Ignore Examples/` | 257 files — the [github/gitignore](https://github.com/github/gitignore) collection, one per language and toolchain |
| `Git Ignore Global.txt`, `Git Ignore Python.txt`, `Git Ignore Vue.js.txt` | The three actually used, trimmed |
| `GitHub Templates/` | Issue and pull request templates |
| `Hooks/` | Git hooks |
| `python/`, `vite/`, `other/` | Project scaffolding |
| `Microsoft.PowerShell_profile.ps1` | A starting PowerShell profile — not the [one in use](/docs/powershell) |
| `Mac Git Config.txt`, `Termux.txt`, `linuxbrew_fish_load.txt` | Per-platform notes |
| `neovim_docs.txt`, `neovim_lsp_config.txt` | Neovim reference notes |
| `powershell_AGENTS.txt` | An `AGENTS.md` for PowerShell projects |

Because the directory holds no Lua, the
[reference generator](/docs/reference) never reaches it, and because it holds
no runtime configuration there is nothing here that can affect an editor
session.

The reason it is worth documenting eventually is that some of these have been
copied into projects and then improved *there*, so the copy here is the older
one. Working out which is which is the job this page is a placeholder for.
