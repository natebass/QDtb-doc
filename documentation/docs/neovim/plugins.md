---
title: "Plugins"
description: "How plugins are installed with vim.pack, which mini.nvim modules are on, and what each third-party plugin is for"
sidebar_label: "Plugins"
sidebar_position: 40
---

# Plugins

Three files decide what is installed and when it runs:

| File | Job |
|---|---|
| [`plugin/packages.lua`](/docs/reference/plugin/packages) | installs every plugin with `vim.pack`, and defers all but two |
| [`after/plugin/mini.lua`](/docs/reference/after/plugin/mini) | sets up the mini.nvim modules |
| [`after/plugin/other.lua`](/docs/reference/after/plugin/other) | loads the local plugins and configures Telescope |

There is no plugin manager. `vim.pack` is Neovim's own, built in since 0.12,
and the lockfile it writes — `nvim-pack-lock.json` — is committed.

## Installation: `plugin/packages.lua`

### Two calls, two policies

```lua
vim.pack.add({
  "https://github.com/echasnovski/mini.nvim",
  { src = "https://codeberg.org/andyg/leap.nvim", name = "leap.nvim" },
}, { load = true })
```

mini.nvim and leap are loaded immediately, because everything else depends on
them being there: `after/plugin/mini.lua` calls `require("mini.notify")` on its
first line, and `after/plugin/keymaps.lua` binds `<Plug>(leap)`.

leap is pulled from **Codeberg**, not GitHub, and needs an explicit `name`
because `vim.pack` derives the directory name from the URL and the Codeberg
path would give the wrong one.

Everything else is added with `load = false`:

```
vim-startify   vague.nvim     plenary.nvim   telescope.nvim
nerdtree       goyo.vim       limelight.vim  vscode.nvim
nvim-lspconfig focus.nvim     true-zen.nvim  copilot.vim
vim-wakatime   lazydev.nvim
```

:::tip[What `load = false` actually means]
Not "not installed" and not "not on the runtimepath". `vim.pack.add` runs
`:packadd` either way; `load = false` only adds the `!`.

`:packadd!` puts the plugin directory on `'runtimepath'` **without sourcing its
`plugin/` scripts**. So the plugin's Lua modules are `require`-able and its
`lsp/`, `colors/`, `ftplugin/` and `queries/` directories are all findable —
but the commands and mappings it defines in `plugin/` do not exist yet.

That is the whole mechanism behind the rest of this file. It is also why
`after/plugin/lsp.lua` never touches nvim-lspconfig: `vim.lsp.enable("lua_ls")`
reads `lsp/lua_ls.lua` off the runtimepath, and `packadd!` already put it
there. And it is why `:colorscheme vague` works with no further setup.
:::

### Loading on first use

```lua
vim.api.nvim_create_autocmd("CmdUndefined", { pattern = ..., callback = ... })
```

`CmdUndefined` fires when you type a command Neovim does not know. The file
builds a map from every command a package defines to the package that defines
it, and the handler `packadd`s that package — this time without the `!`, so the
`plugin/` scripts run and the command comes into existence. Neovim then retries
the command.

| Package | Commands |
|---|---|
| `goyo.vim` | `Goyo` |
| `limelight.vim` | `Limelight` |
| `nerdtree` | `NERDTree`, `NERDTreeClose`, `NERDTreeCWD`, `NERDTreeExplore`, `NERDTreeFind`, `NERDTreeFocus`, `NERDTreeFromBookmark`, `NERDTreeMirror`, `NERDTreeRefreshRoot`, `NERDTreeToggle`, `NERDTreeToggleVCS`, `NERDTreeVCS` |
| `true-zen.nvim` | `TZAtaraxis`, `TZFocus`, `TZMinimalist`, `TZNarrow` |
| `vim-startify` | `SClose`, `SDelete`, `SLoad`, `SSave`, `Startify`, `StartifyDebug` |

**Caveat.** The map has to be complete. A command that is not listed will not
trigger the load, and will keep failing as unknown — which is why the NERDTree
list has all eleven entries rather than just `NERDTreeToggle`.

Two plugins load on an event instead:

- **copilot.vim** on the first `InsertEnter`. It is useless in Normal mode and
  costs a node process, so it waits until you actually type.
- **vim-wakatime** on `VimEnter`, inside a `vim.schedule`, so the time-tracking
  hooks are installed after the first UI frame has been drawn rather than
  before it.

Both autocommands use `once = true`, so they remove themselves.

### What each third-party plugin is for

| Plugin | Role |
|---|---|
| [mini.nvim](https://github.com/echasnovski/mini.nvim) | The backbone — 23 modules, listed below |
| [leap.nvim](https://codeberg.org/andyg/leap.nvim) | Two-character motion, bound to `s`, `S`, `gs`, `gS` |
| [vim-startify](https://github.com/mhinz/vim-startify) | The dashboard and the session store behind [session_manager](/docs/neovim/custom/session-manager) |
| [telescope.nvim](https://github.com/nvim-telescope/telescope.nvim) + [plenary.nvim](https://github.com/nvim-lua/plenary.nvim) | Fuzzy finding, alongside `mini.pick` |
| [nerdtree](https://github.com/preservim/nerdtree) | File tree, on `<leader>n`. `mini.files` is the default explorer; this is the second opinion |
| [goyo.vim](https://github.com/junegunn/goyo.vim) + [limelight.vim](https://github.com/junegunn/limelight.vim) | Distraction-free writing and paragraph dimming |
| [true-zen.nvim](https://github.com/pocco81/true-zen.nvim) | A third focus mode; only `TZNarrow` is bound, on `<leader>v` |
| [focus.nvim](https://github.com/nvim-focus/focus.nvim) | Auto-resizes splits so the focused one is largest |
| [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig) | Server definitions only — never `setup()`-ed |
| [lazydev.nvim](https://github.com/folke/lazydev.nvim) | Neovim API types for lua_ls, on demand |
| [copilot.vim](https://github.com/github/copilot.vim) | Inline suggestions |
| [vim-wakatime](https://github.com/wakatime/vim-wakatime) | Time tracking |
| [vague.nvim](https://github.com/vague2k/vague.nvim), [vscode.nvim](https://github.com/Mofiqul/vscode.nvim) | Two extra colour schemes, beyond the seven in [`colors/`](/docs/neovim/color-themes) |

Three of these — NERDTree, Goyo and true-zen — overlap with mini modules or
with each other. That is deliberate: they are kept because their commands are
in muscle memory, and `CmdUndefined` means an unused one costs nothing.

## mini.nvim: `after/plugin/mini.lua`

### Loaded immediately

Five modules run at startup, because each affects what the first screen looks
like:

| Module | Note |
|---|---|
| `mini.notify` | Set up first, and `vim.notify` is pointed at it right away. With [`'cmdheight' = 0`](/docs/neovim/options#cmdheight) there is no command line to print into, so every `vim.notify` in this configuration depends on this line |
| `mini.icons` | Filetype icons, used by `mini.files` and the statusline |
| `mini.misc.setup_restore_cursor()` | Restores the cursor to its last position when reopening a file |
| `mini.basics` | `basic` and `extra_ui` options, `\` as the option-toggle prefix, window mappings, and relative numbers in Visual mode |
| `mini.statusline` | The one global statusline. `mini.tabline` is commented out directly below it |

### Loaded on `VimEnter`

The other eighteen are wrapped in `setup_deferred_modules()` and called from a
`VimEnter` autocommand inside a `vim.schedule`, so none of them delays the
first frame.

| Module | What it does here |
|---|---|
| `mini.align` | Align text around a separator |
| `mini.move` | Move lines and selections with `<M-hjkl>` |
| `mini.extra` | Extra pickers, including the colour-scheme picker on `<leader>p` |
| `mini.misc` | Its general helpers |
| `mini.bracketed` | `[`/`]` motions over buffers, comments, diagnostics, indent … |
| `mini.bufremove` | Delete a buffer without wrecking the window layout |
| `mini.diff` | Git diff signs, styled `+` / `~` / `-` |
| `mini.visits` | Tracks which files you actually return to |
| `mini.map` | Minimap |
| `mini.git` | Git integration |
| `mini.comment` | `gcc`, `gc{motion}` |
| `mini.pick` | The main picker; `<C-CR>` opens in a vertical split |
| `mini.trailspace` | Highlights trailing whitespace |
| `mini.cursorword` | Highlights other occurrences of the word under the cursor, on the `'updatetime'` timer |
| `mini.ai` | Better `a`/`i` text objects, scanning 500 lines |
| `mini.jump` | Enhanced `f`/`t` — **remapped**, see below |
| `mini.pairs` | Auto-pairs, with `"` and `'` disabled |
| `mini.clue` | The which-key popup |
| `mini.snippets` | Snippet expansion via `gen_loader.from_lang()` |
| `mini.hipatterns` | `FIXME` / `HACK` / `TODO` / `NOTE` highlighting, plus live hex colour swatches |
| `mini.surround` | Surround — **remapped to an `x` prefix**, see below |
| `mini.files` | The default file explorer |
| `mini.jump2d` | Jump anywhere on screen — **bound to `v`**, see below |

`mini.doc`, `mini.fuzzy` and `mini.test` are left commented out at the bottom
with a note that they are plugin-authoring tools.

### The remappings, and why they matter

Four modules are bound to keys that already mean something in Vim. This is the
single most surprising part of the configuration, and it is consistent once you
see the shape of it: the home row is repurposed for motion, and what was there
moves to a shifted key in
[`after/plugin/keymaps.lua`](/docs/reference/after/plugin/keymaps).

| Module | Binding | What it displaces | Where that went |
|---|---|---|---|
| `mini.jump` | `l` forward, `m` backward, `t`/`T` till | `l` (right), `m` (set mark) | `L` moves right; `<leader>s` sets mark `a` |
| `mini.jump2d` | `v` starts jumping | `v` (charwise Visual) | `A` enters charwise Visual, `a` enters linewise |
| `mini.surround` | `xa` `xd` `xf` `xF` `xh` `xr` | the default `s` prefix | `s` is leap |
| `mini.move` | `<M-hjkl>` | — | see the conflict note below |

:::warning[`x` is overloaded]
`after/plugin/keymaps.lua` maps `x` on its own to `@q` (replay the `q` macro),
and `mini.surround` claims `xa`, `xd`, `xf`, `xF`, `xh` and `xr`.

Both can exist, but they resolve on a timer: press `x` and wait
[300 ms](/docs/neovim/options#timeoutlen) and the macro runs; press `x`
followed quickly by one of the six suffixes and you get surround. `X` is mapped
to plain `x`, deleting a character.
:::

:::warning[`<M-j>` / `<M-k>` have two owners]
`after/plugin/keymaps.lua` carries LazyVim's move-line mappings on `<A-j>` and
`<A-k>` for Normal, Insert and Visual mode. `<A-j>` and `<M-j>` are the same
key.

Load order decides it. `after/plugin` files are sourced alphabetically —
`keymaps.lua` before `mini.lua` — and `mini.move` is set up later still, on
`VimEnter`. So **mini.move wins in Normal and Visual mode**; the keymaps.lua
versions survive only in Insert mode, which mini.move does not map.
:::

### `mini.files`

The one module with real configuration:

- `use_as_default_explorer = true` — it replaces netrw.
- Preview on, 30 columns for the focused pane and 50 for the preview.
- `go_in` is `L` and `go_in_plus` is `l`, so `l` enters a directory *and*
  closes the explorer on a file.
- A filter hides `node_modules`, `.git`, `.svn`, `.hg`, `__pycache__`, `dist`,
  `build` and `.next`.

A `MiniFilesBufferCreate` autocommand adds `<Esc>` to close, since the default
is `q`.

Keymaps: `-` opens it at the working directory, `h` opens it focused on the
current file.

### `mini.clue`

Triggers on `<Leader>` (Normal and Visual), `g`, `z`, `]`, `[]`, `'`, `` ` ``,
`<C-w>`, and `<C-x>` / `<C-r>` in Insert and Command mode. Built-in clue
generators fill in the `g`, `z`, marks, registers, windows and
built-in-completion groups, and one custom clue labels
`session_manager`'s `<Leader>M` prefix as `+Session`.

**Caveat.** The trigger list has `]` but not `[` — only the two-key `[]`. So
pausing on `[` shows nothing, while pausing on `]` does.

## Local plugins and Telescope: `after/plugin/other.lua`

```lua
vim.cmd.packadd("plenary.nvim")
vim.cmd.packadd("telescope.nvim")
require("plugins.QDtb.package_json")
require("plugins.QDtb.autosave")
require("plugins.QDtb.window_title")
require("plugins.code_style")
require("plugins.session_manager")
require("plugins.fold_this").setup({ ... })
```

The two `packadd` calls are without `!`, which sources Telescope's `plugin/`
scripts and creates the `:Telescope` command. plenary must come first —
Telescope requires it.

Then the local modules. Three of them install autocommands as a side effect of
being required:
[autosave](/docs/neovim/custom#autosave) on `FocusLost` and
`VimLeavePre`, [`code_style`](/docs/neovim/custom/code-style) on `FileType`, and
`session_manager` on `FileType startify`. `package_json` and `window_title`
only define functions; `<leader>z` calls the first, and the second is not wired
to anything.

`fold_this` is the only one given options — see
[fold_this](/docs/neovim/custom/fold-this#configuration).

### Telescope

```lua
require("telescope").setup({
  defaults = { mappings = { i = { ["<Esc>"] = require("telescope.actions").close } } },
  vimgrep_arguments = { ... },
  file_ignore_patterns = { ... },
})
```

`<Esc>` closes the picker from Insert mode instead of dropping to Normal mode,
which is the only change that is actually in effect.

:::danger[`vimgrep_arguments` and `file_ignore_patterns` are not applied]
Both sit beside `defaults` rather than inside it. `telescope.setup()` passes
only `opts.defaults` to `telescope.config.set_defaults()` and ignores every
other top-level key, so these two tables are read by nobody.

The intent was to keep `node_modules/`, `.next/` and `out/` out of grep and
find results. Moving both keys inside `defaults` is the fix:

```lua
require("telescope").setup({
  defaults = {
    mappings = { i = { ["<Esc>"] = require("telescope.actions").close } },
    vimgrep_arguments = { ... },
    file_ignore_patterns = { ... },
  },
})
```

`mini.pick`, which is bound to more keys than Telescope here, is unaffected —
it honours `.gitignore` through its own ripgrep invocation.
:::

### Telescope or mini.pick?

Both are bound, to different keys, and the split is roughly "capital letter for
Telescope, lower case for mini.pick":

| Key | Picker |
|---|---|
| `<leader>X`, `/` | Telescope `find_files` |
| `<leader>y` | Telescope `live_grep` |
| `<leader>B` | Telescope `buffers` |
| `<leader>C` | Telescope `help_tags` |
| `<leader>D` | Telescope `colorscheme` |
| `<leader>E`, `<leader>/` | `MiniPick.builtin.files` |
| `<leader>e` | `MiniPick.builtin.grep` |
| `<leader>L` | `MiniPick.builtin.grep_live` |
| `<leader>U` | `MiniPick.builtin.buffers` |
| `<leader>H` | `MiniPick.builtin.help` |
| `<leader>G` | `MiniPick.builtin.cli` |
| `<leader>p` | `MiniExtra.pickers.colorschemes` |
