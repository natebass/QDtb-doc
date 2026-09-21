---
title: "code_style"
description: "Tree-sitter highlighting, the lua_ls server, and per-filetype indentation that matches Prettier"
sidebar_label: "code_style"
sidebar_position: 30
---

# code_style

Three files under
[`lua/plugins/code_style/`](/docs/reference/lua/plugins/code_style/init), plus the
six files in `after/ftplugin/` that finish the job.

| File | Job |
|---|---|
| `init.lua` | Requires the other two — the whole plugin is two `require`s |
| `all.lua` | Filetype autocommands that apply everywhere |
| `lua.lua` | The lua_ls server configuration |
| `after/ftplugin/*.lua` | Per-filetype indentation and rulers |

`after/plugin/other.lua` requires `plugins.code_style`, and the autocommands
install themselves as a side effect.

## `all.lua` — what applies everywhere

### Tree-sitter highlighting, explicitly

```lua
vim.api.nvim_create_autocmd("FileType", {
  pattern = { "lua", "typescript", "typescriptreact", "javascript", "javascriptreact" },
  callback = function() vim.treesitter.start() end,
})
```

`vim.treesitter.start()` turns on tree-sitter highlighting for the buffer.
Five filetypes are listed rather than `"*"`, and that is the point: these are
the languages this configuration is actually used for, and starting a parser
for every filetype that happens to have one costs time on files you are only
passing through.

**Relationship.** This is the same set of filetypes
[`fold_this`](/docs/neovim/custom/fold-this#how-the-fold-method-is-chosen) will find a parser for,
so these are also the buffers that get tree-sitter *folding* rather than indent
folding. The two are independent mechanisms that happen to agree.

`queries/tsx/highlights.scm` layers on top of this for TSX — see
[Queries](/docs/neovim/general#queries).

### No comment continuation

```lua
vim.api.nvim_create_autocmd("FileType", {
  pattern = "*",
  callback = function()
    vim.opt_local.formatoptions:remove({ "r", "o" })
  end,
  desc = "Remove option to automatically add a comment for all files.",
})
```

`r` continues a comment when you press `<CR>` in Insert mode; `o` does it for
`o` and `O` in Normal mode. Removing both means a new line after a comment is
a plain line.

This has to be a `FileType` autocommand rather than a line in `options.lua`,
because `'formatoptions'` is buffer-local and almost every bundled ftplugin
sets it. Setting it globally at startup would be overwritten by the first
ftplugin to load.

**Caveat.** `pattern = "*"` runs this on every buffer, and it runs *after* the
bundled ftplugin, which is exactly what makes it stick.

### What is commented out

Three blocks are left in the file rather than deleted:

- A `BufWritePost` hook running `deno fmt` on TypeScript and JavaScript.
  Formatting is now manual — `<leader>a` runs `npx prettier --write` on the
  current file, and `<leader>w` runs stylua on Lua.
- Tree-sitter `expr` folding for `html` and `json`.
- An `:H` user command opening help in a single window. That idea survived as
  `<leader>z`, which prompts for a help tag with `help` completion and then
  runs `:only`.

## `lua.lua` — the language server

```lua
vim.lsp.config("lua_ls", {
  settings = {
    Lua = {
      completion = {
        callSnippet = "Replace",
        showWord = "Disable",
      },
    },
  },
})
vim.lsp.enable("lua_ls")
```

That is the entire LSP setup for this configuration. There is no
`lspconfig.lua_ls.setup{}` anywhere, and that is on purpose:

- `vim.lsp.config()` and `vim.lsp.enable()` are Neovim's own API. `enable()`
  finds the server definition by reading `lsp/lua_ls.lua` off the
  `'runtimepath'`.
- nvim-lspconfig is on the runtimepath because `plugin/packages.lua` added it
  with [`load = false`, which is `:packadd!`](/docs/neovim/plugins#two-calls-two-policies).
  Its `plugin/` scripts are never sourced; only the server definition is read.

### The two settings

**`callSnippet = "Replace"`** makes lua_ls send completion items that expand
into a call with its arguments as snippet placeholders, replacing what you
typed. This is why `after/plugin/lsp.lua` enables `vim.lsp.completion` even
with autotrigger off — something has to expand the snippet on `<C-y>`.

**`showWord = "Disable"`** stops lua_ls from offering plain words from the
buffer as "Text" completion items.
[`'complete'`](/docs/neovim/options#complete) already scans the
current buffer, other windows and other buffers for words, so the server's
copies would arrive as duplicates in the same popup.

### What is deliberately absent

A comment in the file says it:

> Do NOT manually define workspace.library or diagnostics.globals here.
> lazydev handles that automatically now.

[lazydev](/docs/neovim/general#lsp-support) injects the Neovim API types into
the workspace on demand, and declaring them here as well would fight it. The
`vim`, `MiniFiles`, `MiniPick` and `MiniExtra` globals *are* declared — but in
[`.luarc.json`](/docs/neovim/general#supporting-files), which is the file
lua_ls reads for project-level settings.

## Prettier-compatible indentation

The global default is
[tabs, four wide](/docs/neovim/options#indentation).
Every web filetype overrides it, in `after/ftplugin/`:

| File | `expandtab` | Widths | `colorcolumn` |
|---|---|---|---|
| `javascript.lua` | `true` | 2 | `"80"` |
| `javascriptreact.lua` | `true` | 2 | `"80"` |
| `typescript.lua` | `true` | 2 | `"80"` |
| `typescriptreact.lua` | `true` | 2 | `"80"` |
| `markdown.lua` | `true` | 2 | — |
| `mdx.lua` | `true` | 2 | — |

Each file is four or five lines of `vim.opt_local`:

```lua
vim.opt_local.expandtab = true
vim.opt_local.shiftwidth = 2
vim.opt_local.softtabstop = 2
vim.opt_local.tabstop = 2
vim.opt_local.colorcolumn = "80"
```

### Why these exact values

They are Prettier's defaults, and they have to be, because `<leader>a` runs

```
npx prettier --write %
```

on the current file. Prettier's defaults are `useTabs: false`, `tabWidth: 2`
and `printWidth: 80`. If the editor indented with tabs, every save through that
mapping would rewrite the whole file to spaces and produce a diff that has
nothing to do with what you changed. Matching the formatter's output means
Prettier is idempotent against what you typed.

`colorcolumn = "80"` is an **absolute** column, where the global setting is the
relative `"+1"` — one past `'textwidth'`, which is unset, so the global ruler
never appears. These four files are the only place the ruler is visible, and it
marks Prettier's `printWidth`.

### Why `after/ftplugin/` and not a `FileType` autocommand

`after/ftplugin/<ft>.lua` is sourced *after* the bundled `ftplugin/<ft>.vim`
for the same filetype, which is the only ordering that guarantees these
overrides are not undone. Neovim ships ftplugins for JavaScript, TypeScript
and Markdown, and each sets some of these same options.

Markdown needed a second measure:
[`vim.g.markdown_recommended_style = 0`](/docs/neovim/options#markdown-style)
in `options.lua` turns the bundled ftplugin's own indentation block off
entirely, so `after/ftplugin/markdown.lua` is the single authority rather than
the last writer.

:::note[mdx]
`mdx` is not a filetype Neovim knows on its own. It comes from the
[nvim-docusaurus](/docs/docusaurus/nvim-docusaurus) side of this project's
workflow — writing documentation pages — and the file is there so that a `.mdx`
buffer indents like the Markdown it mostly is. If `.mdx` files are not being
detected, that is what [`ftdetect/`](/docs/neovim/general#ftdetect) is for.
:::

### Formatting keys

| Key | Action |
|---|---|
| `<leader>a` | `npx prettier --write %` on the current file, in the background |
| `<leader>w` | [stylua](/docs/neovim/custom#the-rest-of-luapluginsqdtb) on the current Lua buffer |
| `<leader>m` | `=ip` — reindent the current paragraph with Vim's own indenter |
