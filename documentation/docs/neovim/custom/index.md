---
title: "Custom Plugins"
description: "The plugins written for this configuration rather than installed into it"
sidebar_label: "Overview"
---

# Custom Plugins

Three of the directories under `lua/plugins/` are plugins in their own right —
they have a `setup()`, options, keymaps and a reason to exist that is not "a
block of configuration that got long". They are documented here.

| Plugin | What it is | Lines |
|---|---|---|
| [fold_this](/docs/neovim/custom/fold-this) | Tree-sitter folding with an indent fallback, a readable fold line, and navigation that lands on closed folds | ~150 |
| [session_manager](/docs/neovim/custom/session-manager) | A session store on top of vim-startify: save per directory, pick with `mini.pick`, delete and rename in place | ~450 |
| [code-style](/docs/neovim/custom/code-style) | Tree-sitter highlighting, the lua_ls server, and per-filetype indentation that matches Prettier | ~60 + `after/ftplugin/` |

`lua/plugins/QDtb/` is a fourth directory, but it is a drawer of small
utilities rather than a plugin. One of them is worth knowing about.

## Autosave

[`lua/plugins/QDtb/autosave.lua`](/docs/reference/lua/plugins/QDtb/autosave) is
the most useful thing in that drawer. It writes every modified file buffer when
Neovim loses focus and again before it exits, which is what makes
[`'swapfile' = false`](/docs/neovim/options#swapfile) a reasonable
setting rather than a reckless one.

It is required from `after/plugin/other.lua`, and installing its autocommand is
a side effect of that require:

```lua
vim.api.nvim_create_autocmd({ "FocusLost", "VimLeavePre" }, { ... })
```

### What it refuses to write

The interesting part is not the saving, it is the list of things it will not
save. `M.should_save(bufnr)` asks the buffer rather than consulting an
allowlist of filetypes — any real file is worth saving, and the buffer already
knows whether it can be written. A buffer is skipped when it:

- is not valid or not loaded;
- is not modified, is not modifiable, or is read-only;
- has a `buftype` of `acwrite`, `help`, `nofile`, `nowrite`, `prompt`,
  `quickfix` or `terminal`;
- has a filetype of `gitcommit`, `gitrebase`, `hgcommit`, `minifiles`, `oil` or
  `startify` — buffers owned by another tool, which must not be written behind
  its back;
- has no name;
- has a name that matches `^%a[%w+.-]*://`, i.e. a URL scheme such as
  `fugitive://` or `oil://`, which is not an ordinary file however much it
  looks like one.

### Why not `:wa`

`M.save_all()` loops over the buffers it accepted and writes each one inside
`pcall(vim.api.nvim_buf_call, ...)`, returning how many it wrote. Two
differences from `:wa`:

1. It touches only the buffers that passed the check above.
2. A buffer that refuses to write is reported through `vim.notify`, naming the
   file, instead of being swallowed by `silent!`.

### Turning it off

```lua
vim.g.QDtb_autosave = false
```

The autocommand checks this global on every run, so setting it mid-session
takes effect immediately and setting it back re-enables autosaving. There is no
command for it — the global is the interface.

## The rest of `lua/plugins/QDtb/`

Small, single-purpose, and each documented from its own header comment in the
[Lua reference](/docs/reference):

- [`lua_format.lua`](/docs/reference/lua/plugins/QDtb/lua_format) — `<leader>w`
  saves the buffer and runs `npx @johnnymorganz/stylua-bin` over it
  asynchronously, then reloads and opens all folds. Warnings and failures come
  back through `vim.notify`.
- [`package_json.lua`](/docs/reference/lua/plugins/QDtb/package_json) —
  `<leader>z` walks up to ten parent directories looking for a `package.json`
  and, on finding one, `cd`s there and records it in `vim.g.npm_project_root`.
- [`window_title.lua`](/docs/reference/lua/plugins/QDtb/window_title) — sets the
  window title through `xdotool`, for window managers that ignore the escape
  sequence [`'title'`](/docs/neovim/options#title) sends. It is not wired
  to an autocommand, so nothing calls it unless you do.
