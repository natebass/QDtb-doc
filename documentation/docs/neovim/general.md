---
title: "General"
description: "Startup order, the utility library, LSP support and the runtime directories Neovim loads on its own"
sidebar_label: "General"
sidebar_position: 10
---

# General

Everything that is neither an option, a keymap nor a plugin: how the
configuration starts, the one shared library, how language servers are wired
up, and the runtime directories Neovim reads without being asked.

## Startup order

Neovim sources `init.lua`, then everything in `plugin/`, then — after all
that — everything in `after/plugin/`. Nothing in this configuration schedules
itself differently, so reading it in that order is reading it in execution
order.

```text
init.lua                      leaders, then require("config")
└── lua/config/init.lua       require("config.options")
    ├── lua/config/options.lua
    └── lua/config/unix.lua   or windows.lua, by platform

plugin/packages.lua           vim.pack.add(...) — plugins on the runtimepath

after/plugin/mini.lua         mini.nvim: five modules now, the rest on VimEnter
after/plugin/other.lua        local plugins, fold_this.setup(), telescope
after/plugin/lsp.lua          lazydev, LSP completion wiring
after/plugin/keymaps.lua      every mapping
after/ftplugin/*.lua          per-filetype overrides, when a buffer opens
```

### `init.lua`

Nine lines, two of which matter:

```lua
vim.g.mapleader = vim.keycode("<space>")
vim.g.maplocalleader = "\\"
require("config")
```

The leaders are set **before** anything else. Neovim resolves `<Leader>` at the
moment a mapping is created, not when it is pressed, so a mapping defined
before `mapleader` is assigned is silently bound to the old value — the
backslash. Doing this in the first executable line of the first file is what
guarantees every `<leader>` mapping in `after/plugin/keymaps.lua` means Space.

`vim.keycode("<space>")` rather than a literal `" "` is the same idea spelled
explicitly: it is the function that turns key notation into the byte Neovim
compares against.

The file has no `---` header comment of its own, which is why it shows up on
the [reference's undocumented list](/docs/reference#undocumented-files).

### `lua/config/init.lua`

The single entry point. It loads the options, then branches on platform:

```lua
require("config.options")
if require("lib.utility").is_windows then
  require("config.windows")
else
  require("config.unix")
end
```

`lua/config/unix.lua` is currently an empty module — it returns `{}` and does
nothing. `lua/config/windows.lua` appends one path to `'runtimepath'`:
`C:/Users/nateb/OneDrive/Documents/ADtb/Vim`, a second, Windows-only
configuration tree that predates this one. Both files exist mainly as the
place for the next platform-specific thing rather than for what they hold now.

## The utility library

[`lua/lib/utility.lua`](/docs/reference/lua/lib/utility) is the only shared
library, and it is deliberately small.

### Random seeding

```lua
math.randomseed(vim.uv.hrtime() % 2 ^ 31)
```

This runs once, on require, and it is the reason the module exists at all.
Two modules draw random numbers — `session_manager/bible_verse.lua` for the
Startify header and `session_manager/algorithm_quote.lua` for the footer — and
both are required within the same second of startup. Seeding from `os.time()`
in each of them would give both the same seed and correlate the two picks, so
the verse and the quote would move in lockstep from session to session.
`vim.uv.hrtime()` has nanosecond resolution, so two requires in the same second
still differ, and seeding centrally means it only happens once.

### `M.RepeatCmd(cmd)`

Runs a Vim command `vim.v.count` times, or once when no count was given. A
building block for making a mapping accept a count.

### `M.wrap_text(text, limit)`

Greedy word wrap to a maximum width, returning a list of lines. Both quote
modules use it to fit a verse into Startify's header block.

### Platform flags

`M.is_windows`, `M.is_mac` and `M.is_linux` are computed once from
`vim.uv.os_uname().sysname` and cached as booleans. `lua/config/init.lua` and
`session_manager.lua` both branch on `is_windows`; caching keeps that from
being a syscall on every check.

## LSP support

[`after/plugin/lsp.lua`](/docs/reference/after/plugin/lsp) is short because
most of the work happens elsewhere.

**No `lspconfig` setup calls.** `plugin/packages.lua` adds `nvim-lspconfig`
with `load = false`, which puts it on the `'runtimepath'` without sourcing it.
That is all `vim.lsp.enable()` needs: it finds the server definition in the
plugin's `lsp/lua_ls.lua` by name. The actual enabling and the server's
settings live in
[`lua/plugins/code_style/lua.lua`](/docs/neovim/custom/code-style).

**lazydev.** `lazydev.nvim` is `packadd`ed eagerly here and configured with one
library rule:

```lua
{ path = "${3rd}/luv/library", words = { "vim%.uv" } }
```

It loads the luv type definitions that ship with lua-language-server, but only
into buffers that mention `vim.uv` — which replaces the archived `luvit-meta`
plugin. lazydev is also what makes `workspace.library` and
`diagnostics.globals` unnecessary in the lua_ls settings; `lua.lua` says so in
a comment, because adding them back would fight it.

**Completion.** One `LspAttach` autocommand:

```lua
vim.lsp.completion.enable(true, args.data.client_id, args.buf)
```

with autotrigger left off. The reasoning is in the
[completion options](/docs/neovim/options#completion): `'autocomplete'` already
drives the popup and already reaches the server through the `o` flag in
`'complete'`, so autotrigger would be a second, redundant trigger. Enabling the
module is still required for everything that happens *around* the menu —
resolving documentation into the `popup` window and applying an item's side
effects on `<C-y>`: snippet expansion (lua_ls sends snippets because of
`callSnippet = "Replace"`), auto-imports, and any command the server attaches.

**Signature help** is commented out, with a long note explaining what it would
take to bring back `mini.completion`'s automatic signature float: hook the
characters the server nominates as signature triggers, and `vim.schedule` the
call because `InsertCharPre` fires *before* the character is inserted and the
server would otherwise resolve the position one column short. It is left in the
file rather than deleted because the note is the valuable part.

## Runtime directories

These are directories Neovim reads by convention. Nothing requires them;
putting a file in the right place is the whole interface. Several are close to
empty, and are listed here so it is clear they are placeholders rather than
oversights.

### `spell/`

`spell/en.utf-8.add` is the personal word list — what `zg` appends to. It holds
the vocabulary that makes spell-checking usable in this repo's own prose:
`autocmd`, `cwd`, `charwise`, `Vimscript`, `QDtb`, `SCSS`, `commitizen` and so
on.

`'spelllang'` is `en`, but `'spell'` itself is off. Turn it on per buffer with
`:setlocal spell` — or `\s`, which `mini.basics` maps — and the word list
applies.

Neovim compiles `.add` files to `.add.spl` on demand; the compiled file is not
committed.

### `queries/`

Tree-sitter query overrides. There is one subject today: `queries/tsx/`, with
`highlights.scm` and `textobjects.scm`.

Both open with `;; extends`, which is the directive that makes Neovim *layer*
the file on top of the bundled queries rather than replacing them. Without it,
these two small files would be the entire TSX highlighting.

Both capture the value of a JSX `className` attribute, in either of its two
shapes — a plain string, or a template string inside a JSX expression.
`highlights.scm` then adds `(#set! @css_class_attr_value conceal "…")`, so a
long Tailwind class list collapses to a single ellipsis. That is where
`'conceallevel' = 2` becomes visible in day-to-day work:

```tsx
<div className="…">
```

`textobjects.scm` makes the same capture available as a text object, so the
class list can be operated on as a unit.

### `ftdetect/`

Empty apart from a `.gitkeep`. Neovim sources every file here at startup to let
you claim filenames or extensions no built-in rule covers — typically with
`vim.filetype.add()`. Nothing in this configuration needs one yet; the
directory is kept so that when something does, the answer is "add a file", not
"remember where filetype detection goes".

### `parser/`

Empty apart from a `.gitkeep`. Compiled tree-sitter parsers (`.so`) go here to
be found on the `'runtimepath'`. It is intentionally empty and
ignored — parsers are build artefacts for one architecture and do not belong in
a configuration repository. The tree-sitter grammars in use come from Neovim's
own bundled set.

### `snippets/`

Three files, and the interesting thing about them is that they are **not** in
Neovim's format:

- `Snippets.json` is a Vim-plugin-shaped file: filetype → `snippets` → trigger
  → body, with `${1}` placeholders and a `|` cursor marker.
- `css.json` and `package.json` are VS Code's format: `package.json` declares a
  `contributes.snippets` array mapping the `css` and `scss` languages to
  `./css.json`.

`mini.snippets` is set up in `after/plugin/mini.lua` with
`gen_loader.from_lang()`, which reads `snippets/<filetype>.json` and
`snippets/<filetype>/*.json` off the `'runtimepath'`. None of the three files
matches that layout, so **none of them is loaded today**. They are kept because
the content is worth porting; doing so means one file per filetype named after
it — `snippets/css.json` is already almost right, and needs only its VS Code
wrapper removed.

### `after/ftplugin/`

Per-filetype overrides, sourced when a buffer of that type opens. This is the
one runtime directory doing real work — see
[Code style](/docs/neovim/custom/code-style#prettier-compatible-indentation).

## Supporting files

| File | Purpose |
|---|---|
| `.luarc.json` | lua-language-server settings for editing *this repository*: LuaJIT runtime, third-party checks off, and `vim`, `MiniFiles`, `MiniPick` and `MiniExtra` declared as globals so the server stops flagging them as undefined. |
| `nvim-pack-lock.json` | `vim.pack`'s lockfile: one commit SHA per plugin, written by `vim.pack` itself. Committing it is what makes a clone reproduce the same plugin revisions. |
| `LICENSE`, `NOTICE` | Licensing for the configuration and for the vendored material under `colors/` and `dkjson.lua`. |
| `.gitignore` | Covers three ecosystems at once — Neovim's state, Emacs's byte-compiled and package output, and editor swap files. See [Emacs](/docs/other/emacs#what-is-not-committed) for why the Emacs half is as long as it is. |
