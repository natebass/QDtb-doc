---
title: "Fish"
description: "What is in the Fish configuration, and the order it loads in"
sidebar_label: "Overview"
sidebar_position: 1
---

# Fish

The Fish configuration lives in
[`QDtb/fish/`](https://github.com/natebass/QDtb/tree/master/fish) and is
installed by pointing `~/.config/fish` at it. Five directories, twenty files,
and one idea running through all of them: **one key per action**.

| Directory | Files | What it holds |
|---|---|---|
| [`conf.d/`](/docs/fish/startup) | 5 | Everything that runs at startup, in filename order |
| [`functions/`](/docs/fish/functions) | 8 | The prompt, the window title, and five commands |
| [`completions/`](/docs/fish/completions) | 5 | Hand-written completions for tools that ship none |
| [`scripts/`](/docs/fish/scripts) | 1 | Scripts meant to be sourced by hand |
| `config.fish` | 1 | An ASCII fish. Nothing else |

## Load order

Fish's startup is fixed, and this configuration relies on the order rather
than on any explicit sequencing of its own:

```text
1. conf.d/*.fish      every file, in filename order
2. config.fish
3. functions/*.fish   lazily — only when a function is first called
4. completions/*.fish lazily — only when you press <Tab> for that command
```

That is why the files in `conf.d/` are numbered — `00-brew`, `10-env`,
`20-vite-plus`, `99-zoxide` — and why `config.fish` contains nothing but a
drawing. There is no work left for it to do: everything that has to happen at
startup already happened in `conf.d/`, where it can be reordered by renaming a
file rather than by moving a block.

:::note[Autoloading is not automatic sourcing]
Files in `functions/` and `completions/` are **not** read at startup. Fish
looks for `functions/<name>.fish` the first time `<name>` is called, and for
`completions/<cmd>.fish` the first time you complete `<cmd>`. A function
defined in the wrong file, or a file whose name does not match the function
inside it, simply never loads — which is worth knowing when reading
[`fish_prompt.fish`](/docs/fish/functions#the-prompt), where four functions share one
file.
:::

## Install

```bash
sudo apt install fish
```

Point the config directory at this repository — a symlink, so edits here are
live:

```bash
ln -s "$HOME/.var/app/dev.neovide.neovide/config/nvim/fish" "$HOME/.config/fish"
```

Make it the login shell:

```bash
chsh -s "$(command -v fish)"
```

`fish_variables` — the file Fish writes universal variables into — is in
[`.gitignore`](/docs/neovim/general#supporting-files). It is machine state,
not configuration, and committing it makes every machine fight over it.

## What it depends on

Startup is guarded where it can be, but the abbreviations are not: an
abbreviation expands to whatever it expands to, and if the tool is missing you
find out when you press Enter.

| Tool | Used by | Guarded? |
|---|---|---|
| [Homebrew](https://brew.sh) | `conf.d/00-brew.fish` | yes — `test -d` |
| [zoxide](https://github.com/ajeetdsouza/zoxide) | `conf.d/99-zoxide.fish`, `f`, six abbreviations | yes at startup, no in the abbreviations |
| [Vite+](https://viteplus.dev) | `conf.d/20-vite-plus.fish` | **no** — see [Startup](/docs/fish/startup#vite) |
| Emacs | `conf.d/10-env.fish` — `$EDITOR` is `emacsclient` | no |
| [eza](https://github.com/eza-community/eza) | `f`, four abbreviations | no |
| `fdfind` | fourteen abbreviations | no |
| Node, `python`/`python3` | the prompt's runtime badges | yes — `type -q` |
| git | the prompt, the title, `gitq`, eleven abbreviations | mostly |
| pnpm, uv, ruff, fzf, rg, jq, lazygit, tmux, openssl | abbreviations | no |

## Where to go next

- **[Startup](/docs/fish/startup)** — `conf.d/`, and the one file that will break a
  fresh machine.
- **[Abbreviations](/docs/fish/abbreviations)** — the single-key command layer, which
  is the biggest thing in the configuration.
- **[Functions](/docs/fish/functions)** — the prompt and its caching, the window title,
  and `f`, `gitq`, `multicd` and the history helpers.
- **[Completions](/docs/fish/completions)** — five hand-written completion files.
- **[Scripts](/docs/fish/scripts)** — `pgvariables.fish`.
