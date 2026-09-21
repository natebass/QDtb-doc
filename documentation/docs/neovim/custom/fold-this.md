---
title: "fold_this"
description: "Tree-sitter folding with an indent fallback, a readable fold line, and navigation that lands on closed folds"
sidebar_label: "fold_this"
sidebar_position: 10
---

# fold_this

Three files under
[`lua/plugins/fold_this/`](/docs/reference/lua/plugins/fold_this):

| File | Job |
|---|---|
| `init.lua` | One `setup()` that routes options to the other two |
| `fold_this.lua` | Fold method, fold text, and the per-window autocommand |
| `fold_navigation.lua` | Jumping to the next or previous **closed** fold |

## The problem it solves

Neovim's fold options are global or window-local, but the right fold method is
per buffer: tree-sitter where there is a parser, indent where there is not, and
markers in files that carry `{{{` sections — which, in this configuration, is
most of its own files.

`'foldmethod'` is set globally to `marker` in
[`options.lua`](/docs/neovim/options#folds-global).
`fold_this` overrides that per window, and gives you a key to put it back.

## Configuration

`after/plugin/other.lua` passes options in two groups, one per module:

```lua
require("plugins.fold_this").setup({
  core = {
    default_level = 99,
    enable_keymap = true,
  },
  navigation = {
    enable_keymaps = true,
    next_key = "zj",
    prev_key = "zk",
    center_on_jump = true,
  },
})
```

| Option | Default | Effect |
|---|---|---|
| `core.default_level` | `99` | Written to `'foldlevelstart'`, so files open with folds open |
| `core.enable_keymap` | `true` | Buffer-local `<Tab>` → `za` |
| `core.pattern` | `"*"` | Which buffers the `BufWinEnter` autocommand applies to |
| `navigation.enable_keymaps` | `true` | Install `zj` / `zk` |
| `navigation.next_key` | `"zj"` | Next closed fold |
| `navigation.prev_key` | `"zk"` | Previous closed fold |
| `navigation.center_on_jump` | `true` | `zz` after landing |

`init.lua` calls each sub-module's `setup` only `if type(...) == "function"`.
Both define one, so both run.

:::note[A stale caveat in the source]
`fold_this.lua`'s header still warns that `fold_navigation` "appears to have no
setup, so navigation options and keymaps are effectively unused". That is no
longer true — `fold_navigation.setup()` exists and installs `zj`/`zk`. The note
is out of date, not the behaviour.
:::

## How the fold method is chosen

On every `BufWinEnter`, `M.apply_default(win, buf)` runs:

```lua
if pcall(vim.treesitter.get_parser, buf) then
  vim.wo[win].foldmethod = "expr"
  vim.wo[win].foldexpr = "v:lua.vim.treesitter.foldexpr()"
else
  vim.wo[win].foldmethod = "indent"
end
```

`pcall` is the test. `vim.treesitter.get_parser` throws when there is no
parser for the buffer's language, so catching that is how the code asks "is
there a parser?" without maintaining a list of languages. Where there is one,
folds follow the syntax tree; where there is not, indentation is the fallback.

The settings are **window-local** (`vim.wo[win]`), not buffer-local, because
that is what folding actually is in Vim: the same buffer in two splits can have
different folds.

## Respecting a manual choice

`M.set_marker(close_all)` sets a window variable before changing the method:

```lua
vim.w[win].fold_this_marker = true
vim.wo[win].foldmethod = "marker"
```

The `BufWinEnter` handler checks that flag and leaves the window alone when it
is set. Without it, switching a window to marker folding would last exactly
until the next buffer entered it.

`zY` clears the flag and calls `apply_default` again, which is the way back.

## The fold line

`M.fold_text()` replaces the default summary:

```
 󰁂 local function example(a, b)  (14 lines)
```

It is installed per window as
`vim.wo[win].foldtext = [[v:lua.require('plugins.fold_this.fold_this').fold_text()]]`,
a Vimscript expression that reaches back into Lua on every fold draw.

This overrides the global `'foldtext' = ""` from `options.lua`, which would
otherwise render the fold's first line with full syntax highlighting. The trade
is colour for a line count; the `󰁂` glyph needs a
[Nerd Font](/docs/neovim/options#neovide).

`setup()` also appends `fillchars` `fold = " "`, which `options.lua` already
sets. Harmless, but it means fold appearance has two owners.

## Navigating to closed folds

`zj` and `zk` are Vim's own motions, and they move to the *start of the next
fold* — open or closed. `M.next_closed_fold(dir)` wraps them into "move to the
next fold that is actually folded":

```lua
while true do
  local before = vim.api.nvim_win_get_cursor(0)[1]
  vim.cmd.normal({ "z" .. dir, bang = true })
  local line = vim.api.nvim_win_get_cursor(0)[1]
  if line == before then vim.fn.winrestview(view) return end
  if vim.fn.foldclosed(line) >= 0 then ... return end
end
```

Two details are load-bearing:

- **`vim.cmd.normal`, not `nvim_feedkeys`.** `feedkeys` only queues the keys;
  the cursor would not have moved yet when the next line reads its position, so
  the loop would compare a stale value and spin.
- **The view is saved first.** If there is no closed fold left in that
  direction, the stepping has still scrolled the window around. `winrestview`
  puts it back, so a failed jump is a no-op rather than a jolt.

The loop always steps at least once, so starting inside a closed fold moves on
to the next one rather than reporting the fold you are already in.

## Keymaps

| Key | Action |
|---|---|
| `<Tab>` | Toggle the fold under the cursor (`za`), buffer-local |
| `zj` / `zk` | Next / previous **closed** fold, centred |
| `zq` | Switch this window to marker folding |
| `zQ` | Switch to marker folding and close everything |
| `zY` | Forget the marker choice, go back to tree-sitter or indent |

:::warning[`<Tab>` and `<C-i>`]
A terminal sends the same byte for `<Tab>` and `<C-i>`, so mapping `<Tab>` to
`za` takes `<C-i>` — jump forward in the jumplist — with it. `fold_this.lua`'s
header says so.

The configuration works around it with the mouse: `after/plugin/keymaps.lua`
maps `<X2Mouse>` (the forward thumb button) to `<C-i>` and `<X1Mouse>` to
`<C-o>`. In a GUI such as Neovide the two keys are distinguishable and the
problem does not arise.
:::

Also relevant, from `after/plugin/keymaps.lua`:

| Key | Action |
|---|---|
| `f` | `z` — the whole fold prefix moved to the home row |
| `ff` / `fj` / `fk` | `zz` / `zt` / `zb` — centre, top, bottom |
| `ft` | `zf` — create a fold |
| `[f` / `]f` | `[z` / `]z` — start / end of the current open fold |
| `G` | `GzR` — jump to the end of the file and open every fold |
| `gg` | `ggzM` — jump to the top and close every fold |
| `M` | `zM{zozz` — close all, reopen the current paragraph's fold, centre |
