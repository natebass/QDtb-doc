---
title: "Options"
description: "Every option set in lua/config/options.lua, what it does, and what it interacts with"
sidebar_label: "Options"
sidebar_position: 20
---

# Options

Everything on this page is set in
[`lua/config/options.lua`](https://github.com/natebass/QDtb/blob/master/lua/config/options.lua),
which `lua/config/init.lua` requires first, before any platform file and before
any plugin runs. That ordering matters more than once below: several plugins
read these values at setup time rather than watching them.

:::info[Neovim version]
`'autocomplete'`, `'autocompletedelay'`, `'pumborder'`, the `o` flag and the
`^{count}` modifier in `'complete'` are Neovim 0.12 features, as are
`vim.pack`, `:restart` and `vim.diagnostic.jump()` used elsewhere in the
configuration. On 0.11 the file raises `E518: Unknown option` on the first of
them.
:::

## UI

### `confirm = true`

Turns the "No write since last change" error into a Yes/No/Cancel dialog, so
`:q` on a modified buffer asks instead of failing. Paired here with
[autosave](/docs/neovim/custom#autosave) and `'autowrite'`, it means
the config almost never refuses to do what you asked.

**Caveat.** The dialog still appears for buffers autosave skips — anything with
a `buftype`, and the git and file-manager filetypes it refuses to write behind
another tool's back.

### `number = false`

No line numbers. `mini.basics` is set up with `relnum_in_visual_mode = true`,
so relative numbers appear for the duration of a Visual selection and vanish
again — the only time this config shows a number column.

### `linespace = 4`

Extra pixels between lines. **GUI only**: ignored in a terminal. The Neovide
block at the bottom of the file overrides it to `8`, so a terminal session gets
nothing, a generic GUI gets 4, and Neovide gets 8.

### `cmdheight = 0` {#cmdheight}

Gives the command line's row back to the buffer. The command line reappears
while you are typing a command and disappears afterwards.

**Caveat.** With no permanent command line, messages that would have been
printed there are easy to miss. `mini.notify` is installed and `vim.notify` is
pointed at it precisely because of this, so `vim.notify` calls throughout the
configuration surface as floating notifications rather than into a row that is
not on screen.

### `laststatus = 3`

One global statusline for the whole window layout rather than one per split.
`mini.statusline` draws it. `mini.tabline` is commented out in
`after/plugin/mini.lua`, so the status line is the only permanent chrome.

### `winborder = "rounded"`

The default border for every floating window that does not ask for its own —
LSP hovers, diagnostics floats, `mini.pick`, `mini.files`. Setting it globally
is what keeps those consistent without passing `border = "rounded"` to each
plugin.

### `title = true` {#title}

Lets Neovim set the terminal or GUI window title itself.

**Relationship.** `lua/plugins/QDtb/window_title.lua` does the same job through
`xdotool`. Its own header says so: it exists only for window managers that
ignore the escape sequence Neovim sends. It is not wired to an autocommand, so
on a normal desktop `'title'` is what you are seeing.

### `ruler = false`

Drops the built-in line/column readout, which `mini.statusline` already shows.

### `cursorline = true`

Highlights the line the cursor is on. All seven colour schemes in `colors/`
define `CursorLine` with enough contrast for a comment to stay readable on it —
that is one of the stated goals in `colors/neovim_colors.lua`.

### `guicursor = "n-v-c-sm:hor10,i-ci-ve:ver25,r-cr-o:block"`

Cursor shape per mode: a 10%-height horizontal bar in Normal, Visual, Command
and showmatch; a 25%-width vertical bar in Insert and Visual-exclusive; a block
in Replace and Operator-pending. The horizontal bar in Normal mode is the
unusual choice, and it is deliberate — it reads as "an editor at rest" rather
than as a terminal prompt.

**Caveat.** GUI and modern terminals only. It also has no `blinkon`/`blinkoff`
components, so blink is left to the terminal or GUI, which is where Neovide's
own animation settings take over.

### `colorcolumn = "+1"`

A ruler one column past `'textwidth'`. Because `'textwidth'` is not set
globally, the column only appears in buffers where something else sets it.

**Relationship.** `after/ftplugin/*.lua` overrides this to an absolute `"80"`
for JavaScript and TypeScript, which is the only place the ruler is
unconditional. See [Code style](/docs/neovim/custom/code-style).

### `signcolumn = "yes"`

Always reserve the sign column. Without it the text shifts sideways the moment
`mini.diff` places its first `+`/`~`/`-` sign, which is the flicker this avoids.

### `pumblend = 10`

10% transparency on the completion popup, so code behind it stays faintly
visible. Needs `'termguicolors'`, which is set at the bottom of the file.

### `pumheight = 10`

Caps the completion popup at ten rows. Without it a popup from a large
workspace can cover most of the window.

### `pumborder = "rounded"`

The border around the completion popup. `'winborder'` does not cover the
popup-menu, so this is its counterpart.

### `list = false`, `listchars = "tab:  ,trail:-,nbsp:+"`

Whitespace rendering is off, but configured. `mini.basics` installs `\l` as a
toggle (its `option_toggle_prefix` is `\`), so the characters are there for
when you want them. Note that the `tab:` value is two spaces — a tab shows as
blank width rather than as an arrow, so turning `'list'` on reveals trailing
whitespace and non-breaking spaces without adding noise to every indent.

**Relationship.** `mini.trailspace` highlights trailing whitespace on its own,
so `trail:-` is a second opinion rather than the only one.

### `fillchars`

```lua
foldopen = "▾", foldclose = "▸", fold = " ", foldsep = " ", diff = "╱", eob = " "
```

`fold = " "` is the one that changes the look most: it removes the row of dots
Vim pads a closed fold line with. `eob = " "` hides the `~` after the last
line. `foldsep = " "` empties the vertical line in the fold column.

**Relationship.** `lua/plugins/fold_this/fold_this.lua` appends `fold = " "`
again in its `setup()`. Setting it twice is harmless, but it means the fold
appearance has two owners.

## Editing

### `tabstop`, `softtabstop`, `shiftwidth` = `4`, `expandtab = false` {#indentation}

Real tab characters, displayed and indented four columns wide. This is the
global default and it is overridden for every web filetype.

**Relationship.** `after/ftplugin/{javascript,javascriptreact,typescript,typescriptreact,markdown,mdx}.lua`
each set `expandtab = true` and all three widths to `2`, which is what Prettier
writes. `<leader>a` runs `npx prettier --write` on the current file, so a
mismatch here would show up as a diff on every save of a web file.

### `shiftround = true`

`>>` and `<<` round the indent to the next multiple of `'shiftwidth'` rather
than adding a fixed amount to whatever is already there.

### `smartindent = true`

C-like automatic indenting for new lines.

**Caveat.** It is a fallback, not the main mechanism: `code_style` starts
tree-sitter for Lua, TypeScript, TypeScript React, JavaScript and JavaScript
React, and tree-sitter indentation takes precedence in those buffers.
`'smartindent'` is also the option that flushes `#` to column 0, which is
visible in languages where `#` is a comment or a directive.

### `vim.g.markdown_recommended_style = 0` {#markdown-style}

Disables the `expandtab`/`shiftwidth=4`/`textwidth=78` block in Neovim's
bundled markdown ftplugin.

**Relationship.** Without it, the bundled ftplugin and
`after/ftplugin/markdown.lua` would both set the same three options and the
result would depend on load order. Turning the built-in off makes
`after/ftplugin/markdown.lua` the single authority.

## Completion

### `autocomplete = true`, `autocompletedelay = 100`

Neovim's own automatic completion: the popup opens by itself 100 ms after you
stop typing, with no plugin involved.

### `complete = "o,.^10,w^5,b^5"` {#complete}

The sources the popup draws from, in order, with per-source caps:

| Flag | Source | Cap |
|---|---|---|
| `o` | omni completion, i.e. the attached language server | — |
| `.^10` | the current buffer | 10 matches |
| `w^5` | other visible windows | 5 |
| `b^5` | other loaded buffers | 5 |

The LSP is first and uncapped; the plain-word sources are capped so they cannot
push server results off a ten-row popup.

**Relationship.** This is why `after/plugin/lsp.lua` leaves
`vim.lsp.completion.enable()`'s `autotrigger` **off**. The `o` flag already
reaches the server through `'autocomplete'`; a second trigger would be
redundant. The module is still enabled, for what happens *around* the menu:
resolving documentation into the `popup` window, and applying an item's side
effects on `<C-y>` — snippet expansion, auto-imports, and any command the
server attaches.

This is also why `lua/plugins/code_style/lua.lua` sets lua_ls's
`completion.showWord = "Disable"`. `'complete'` already scans buffers and
windows for plain words, so the server's own "Text" items would arrive as
duplicates in the same menu.

### `completeopt = "menu,menuone,noselect,popup,fuzzy"`

- `menu`, `menuone` — always show the menu, even for a single match.
- `noselect` — nothing is preselected, so `<CR>` inserts a newline rather than
  a completion you did not choose.
- `popup` — item documentation goes in a floating window beside the menu. This
  is the flag the LSP `LspAttach` handler in `after/plugin/lsp.lua` depends on.
- `fuzzy` — match by subsequence rather than by prefix.

## Search

### `ignorecase = true`, `smartcase = true`

Case-insensitive unless the pattern contains a capital. The pair is meaningless
apart: `'smartcase'` does nothing without `'ignorecase'`.

### `inccommand = "nosplit"`

Live preview of `:s` results in place. `"nosplit"` rather than `"split"`
because a preview split fights `'laststatus' = 3` and `mini.files` for the
layout.

### `grepprg = "rg --vimgrep"`, `grepformat = "%f:%l:%c:%m"`

`:grep` uses ripgrep and its output is parsed into the quickfix list.
`--vimgrep` is what produces the `file:line:column:message` shape
`'grepformat'` describes; changing one without the other silently produces an
empty quickfix list.

**Relationship.** Telescope and `mini.pick` run ripgrep themselves and do not
read these, so `:grep` and `<leader>e` can behave differently. Telescope's own
arguments in `after/plugin/other.lua` add `--glob=!node_modules/**`,
`!.next/**` and `!out/**`; plain `:grep` has no such exclusions.

## Files

### `undofile = true`, `undolevels = 10000`

Undo history is written to disk and survives closing the file. Ten thousand
levels is generous, and cheap: the history is stored as a tree of deltas.

**Relationship.** This is the safety net that makes `'swapfile' = false` and
aggressive autosaving reasonable. Autosave writes the file; undo history is how
you get back.

### `swapfile = false` {#swapfile}

No `.swp` files, so no stale-swap prompts and no recovery dialog after a crash.

**Caveat.** The trade is real: with no swap file, a crash between writes loses
everything since the last one. Autosave writes on `FocusLost` and
`VimLeavePre`, which covers the ordinary cases — alt-tabbing away, quitting —
but not a kernel panic mid-edit.

### `autowrite = true`

Write the buffer automatically before commands that leave it, such as `:next`
and `:make`.

### `shada = "!,'1000,<50,s10,h,r/tmp/,r/private/"`

The shared-data file: what survives between sessions.

| Item | Meaning |
|---|---|
| `!` | save global variables written in ALL CAPS |
| `'1000` | marks for the last 1000 files |
| `<50` | at most 50 lines per register |
| `s10` | skip any register item over 10 KiB |
| `h` | do not restore `'hlsearch'` on startup |
| `r/tmp/`, `r/private/` | never record marks for files under these paths |

The two `r` entries keep temporary files — commit messages, `mktemp` scratch
buffers, macOS's `/private` — out of the jumplist and the recent-files list
that Startify shows on the dashboard.

### `clipboard = vim.env.SSH_CONNECTION and "" or "unnamedplus"`

Yank to the system clipboard locally; leave the clipboard alone over SSH.

**Caveat.** This is evaluated once, at startup. A session started locally and
later reattached over SSH keeps the local setting, and vice versa. The reason
for the split is that with no clipboard provider on the far end, every yank
pays a failed provider lookup.

## Folds

### `foldmethod = "marker"`, `foldlevel = 99`, `foldtext = ""` {#folds-global}

Globally, folds come from `{{{` / `}}}` markers and start open. Most files in
this configuration end with a `vim:foldmethod=marker:foldlevel=1` modeline, so
the config folds itself into sections.

`foldtext = ""` is the Neovim 0.10+ value meaning "render the fold's first line
with its normal syntax highlighting" rather than a plain-text summary.

:::warning[Two owners]
`fold_this` overrides all three per window. On `BufWinEnter` it sets
`'foldmethod'` to `expr` with the tree-sitter fold expression (or `indent`
where there is no parser), and points `'foldtext'` at its own function, which
renders `󰁂 <first line> (N lines)`. So the global values here are what you get
in a window `fold_this` has not touched, and what `zY` reverts *away* from.

`zq` and `zQ` switch the current window back to marker folding and set a
window-local flag that stops `fold_this` from overriding it again.

`fold_this.setup()` also writes `'foldlevelstart'` from its own `default_level`
option, which `after/plugin/other.lua` passes as `99` — the same value as
`'foldlevel'` here, so the two agree today by coincidence rather than by
construction.
:::

## Scroll and layout

### `scrolloff = 4`, `sidescrolloff = 8`

Keep four lines above and below the cursor, and eight columns either side.

### `smoothscroll = true`

Scroll by screen line rather than by buffer line, so a long wrapped line does
not jump the view.

**Caveat.** It only has an effect while `'wrap'` is on, which it is not by
default here.

### `wrap = false`, `linebreak = true`

Long lines run off the edge rather than wrapping.

**Caveat.** `'linebreak'` — "if you do wrap, break at a word boundary" — is
inert while `'wrap'` is off. It is set for the prose mappings that turn wrapping
on: `<leader>g` runs `:set wrap` then `:Goyo`, and `<leader>h` is the inverse.

### `splitbelow = true`, `splitright = true`

New splits open below and to the right, matching the direction `<C-j>` and
`<C-l>` move.

### `splitkeep = "screen"`

Keep the text visually still when a split opens or closes, instead of keeping
the cursor line at the same screen row. This is what stops the buffer jumping
when the quickfix window opens under `<leader>xq`.

### `winminwidth = 5`

A window can be squeezed to five columns but no further, which keeps
`focus.nvim`'s automatic resizing from collapsing an inactive split entirely.

### `virtualedit = "block"`

In Visual Block mode the cursor may go past the end of a line, so a block
selection over ragged lines is rectangular.

## Miscellaneous

### `conceallevel = 2`

Concealed text is hidden entirely, with no replacement character. Mostly
visible in Markdown, where link syntax and emphasis markers disappear.

**Caveat.** It applies everywhere, including JSON and any filetype with
conceal rules you did not ask for.

### `mouse = "a"`

The mouse works in every mode.

**Relationship.** `after/plugin/keymaps.lua` maps the two thumb buttons —
`<X2Mouse>` to `<C-i>` and `<X1Mouse>` to `<C-o>` — so they move forward and
back through the jumplist the way they move through browser history.

### `spelllang = "en"`

`'spell'` itself is off; this only says which dictionary to use when something
turns it on. Personal additions live in
[`spell/en.utf-8.add`](/docs/neovim/general#spell).

### `jumpoptions = "view"`

Restore the window's scroll position and cursor column when you jump back to a
location, not just the line. It makes `<C-o>` land where you actually were.

### `wildmode = "longest:full,full"`

The first `<Tab>` on the command line completes the longest common prefix and
opens the wildmenu; the second cycles. This is the behaviour that lets you keep
typing after one `<Tab>` rather than having a candidate inserted for you.

### `timeoutlen = 300` {#timeoutlen}

300 ms to finish a mapping before Vim gives up on it.

**Relationship.** This is `mini.clue`'s window. Its trigger list in
`after/plugin/mini.lua` covers `<Leader>`, `g`, `z`, `[`, `]`, `'`, `` ` ``,
`<C-w>`, `<C-x>` and `<C-r>`; pausing on any of them for 300 ms pops up the
list of what can follow. Raising this makes the config feel slow to respond;
lowering it makes multi-key mappings hard to type.

### `updatetime = 200`

Idle time before `CursorHold` fires and before the swap file would be written
(moot here). `mini.cursorword` highlights the word under the cursor off this
timer.

### `sessionoptions = "buffers,curdir,tabpages,winsize,help,globals,skiprtp,folds"` {#sessionoptions}

What a saved session contains.

| Item | Why |
|---|---|
| `buffers`, `curdir`, `tabpages`, `winsize` | the layout you actually had |
| `help` | help windows are restored rather than silently dropped |
| `globals` | ALL-CAPS globals, which is how plugin state survives |
| `skiprtp` | do **not** write `'runtimepath'` into the session |
| `folds` | manual folds and the open/closed state |

`skiprtp` is the important one: a session that records the runtimepath will
restore a stale one after you move or rename the config directory, which is a
long way to travel to a confusing error. `folds` is what makes a restored
session look the way you left it given how much folding this config does.

**Relationship.** Sessions are written by
[`session_manager`](/docs/neovim/custom/session-manager) through vim-startify,
and `startify_session_before_save` closes NERDTree and Goyo windows first so
they are not serialised into the layout.

### `shortmess += "WIcC"`

Appended, not replaced, so Neovim's defaults stay.

| Flag | Silences |
|---|---|
| `W` | "written" after every save — noisy with autosave on |
| `I` | the intro screen, which Startify replaces |
| `c` | "match 1 of 4" completion messages |
| `C` | messages while scanning for completions |

With `'cmdheight' = 0` these messages would each force the command line open
for a moment, so trimming them is about layout stability as much as noise.

### `termguicolors = true`

24-bit colour. Required by every scheme in `colors/` — they are built on
`mini.hues`, which computes palettes in Oklch — and by `'pumblend'`.

## Neovide

The last block only runs when `vim.g.neovide` is set:

```lua
vim.o.guifont = "ComicShannsMono Nerd Font Mono,Noto_Color_Emoji:h12"
vim.o.linespace = 8
vim.g.neovide_hide_mouse_when_typing = true
vim.opt.guioptions:remove({ "m", "T", "r" })
```

- **`guifont`** — a Nerd Font is not optional. `mini.icons`, `mini.files`, the
  `󰁂` in `fold_this`'s fold line and Startify's headers all use glyphs from the
  Nerd Font private-use area. `Noto_Color_Emoji` is the fallback so emoji in
  comments render in colour.
- **`linespace = 8`** — doubles the value set at the top of the file.
- **`neovide_hide_mouse_when_typing`** — the pointer disappears while you type.
- **`guioptions:remove`** — drops the menu bar (`m`), the toolbar (`T`) and the
  right scrollbar (`r`).

The config is normally run through the Neovide Flatpak, which is why paths
elsewhere in the repo point at
`~/.var/app/dev.neovide.neovide/config/nvim`. See the
[introduction](/docs) for the path layout.
