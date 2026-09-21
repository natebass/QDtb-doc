---
title: "session_manager"
description: "A session store and dashboard built on vim-startify, with a mini.pick front end"
sidebar_label: "session_manager"
sidebar_position: 20
---

# session_manager

Five files under
[`lua/plugins/session_manager/`](/docs/reference/lua/plugins/session_manager):

| File | Job |
|---|---|
| `init.lua` | Returns `session_manager.lua` — one line |
| `session_manager.lua` | Configures vim-startify: dashboard, lists, bookmarks, highlighting |
| `sessions.lua` | Every session action, and the `mini.pick` front end |
| `bible_verse.lua` | Random verse for the dashboard header |
| `algorithm_quote.lua` | Random quote for the dashboard footer |

The split is deliberate: `session_manager.lua` is declarative configuration of
someone else's plugin, and `sessions.lua` is the code that makes it usable.

## Why build on Startify

vim-startify already owns a session directory, knows how to write a session,
and lists what it finds. What it does not do is let you manage those sessions
without retyping their names. `sessions.lua` adds that layer while keeping
Startify as the single source of truth:

- `M.dir()` reads `vim.g.startify_session_dir` back out of `vim.g` rather than
  recomputing the path, so the two can never disagree.
- `M.list()` calls Startify's own `startify#session_list()`, so the picker can
  never show a different set of sessions from the dashboard.

Startify is loaded on demand. `plugin/packages.lua` maps its six commands to a
`CmdUndefined` handler, and `sessions.lua` has a `load_startify()` helper that
`packadd`s it when `vim.g.loaded_startify` is not yet `1`.

## The dashboard

`session_manager.lua` sets `vim.g.startify_*`:

- **Header** — a random Bible verse, wrapped to width by
  `lib.utility.wrap_text`.
- **Footer** — a random quote about algorithms, from Knuth, Dijkstra, Dean and
  others.
- **Lists**, in order: recent files in the current directory, recently opened,
  sessions, bookmarks, custom commands, then two dynamic git lists.
- `startify_enable_special = 0` drops the built-in "empty buffer" and "quit"
  entries; `startify_files_number = 10`; `startify_change_to_dir = 0` so
  opening a file does not move the working directory out from under you.

### Custom commands

| Key | Command |
|---|---|
| `u` | `lua vim.pack.update()` |
| `p` | `lua vim.print(vim.pack.get())` |
| `e` | Edit the Neovim config `init.lua` |
| `s` | `restart` |
| `g` | `Git status` |
| `f` | `Telescope find_files` |

### The git lists

Two entries in `startify_lists` are functions rather than types, built by a
shared factory:

```lua
local function git_files(args)
  return function()
    local result = vim.system(vim.list_extend({ "git" }, args), { text = true }):wait()
    if result.code ~= 0 then return {} end
    ...
  end
end
```

One list runs `git ls-files -m` (modified), the other
`git ls-files -o --exclude-standard` (untracked). `vim.system` takes an argv
list, so there is no shell to quote against and stderr is captured separately
rather than needing a `2>/dev/null`. A non-zero exit — no repository, no git —
returns an empty list, so the dashboard degrades quietly outside a repo.

### Bookmarks

A `vim.g.startify_bookmarks` table, branching on
[`lib.utility.is_windows`](/docs/neovim/general#platform-flags). The Unix
branch uses `vim.fs.joinpath(vim.fn.stdpath("config"), ...)`, so the bookmarks
follow the config wherever it is installed; the Windows branch is a list of
literal `~/OneDrive/Documents/Adtb/...` paths from the older configuration tree
that `lua/config/windows.lua` also points at.

Sixteen bookmarks on Unix, covering the files edited most: `options.lua`,
`keymaps.lua`, `mini.lua`, `packages.lua`, `session_manager.lua`,
`utility.lua`, both PowerShell profiles, `fish/config.fish`,
`fish/conf.d/abbreviations.fish`, the IdeaVim files and `Snippets.json`.

**Caveat.** Two of them point at files that do not exist: `lua/config/unix.lua`
is there but empty, and `w` maps to it, while `W` maps to
`snippets/Snippets.json`, which does exist but is
[not in a format anything loads](/docs/neovim/general#snippets).

### Highlighting

Seven `highlight link` commands flatten Startify's colours into `Normal`,
`Comment` and `Header`, so the dashboard picks up whichever
[colour theme](/docs/neovim/color-themes) is active instead of carrying its
own palette. A `FileType startify` autocommand also turns `'list'` off for the
buffer and installs the dashboard keymaps.

## Session actions

All in `sessions.lua`, all exported.

| Function | What it does |
|---|---|
| `M.dir()` | The session directory, read from `vim.g` |
| `M.path(name)` | Full path of a session file |
| `M.ensure_dir()` | Creates the directory when missing |
| `M.list()` | Session names, newest first, `__LAST__` excluded |
| `M.cwd_name()` | Session name for the working directory — its basename |
| `M.save_cwd()` | `:SSave!` under that name, no prompt |
| `M.save_as()` | Startify's own prompt, which completes existing names |
| `M.load(name)` | `:SLoad`, or the picker when `name` is `nil` |
| `M.load_last()` | `:SLoad!` — whichever session was used last |
| `M.close()` | `:SClose` — save, drop the buffers, back to the dashboard |
| `M.delete(name, opts)` | Delete the file, with an optional confirmation |
| `M.rename(old, new)` | Rename the file, prompting when `new` is `nil` |
| `M.pick()` | The `mini.pick` front end |
| `M.close_side_panels()` | Closes NERDTree and Goyo before a save |
| `M.entry_under_cursor()` | The session under the cursor in the dashboard |
| `M.map_dashboard(buf)` | Dashboard keymaps |
| `M.map_leader()` | The `<Leader>M` group |

### Details worth knowing

**`ensure_dir()` exists to avoid a one-answer prompt.** `:SSave` stops to ask
whether to create the session directory when it is missing. Creating it up
front removes a question with only one sensible answer.

**`__LAST__` is a symlink, and it goes stale.** Startify points it at the most
recently saved session so `:SLoad!` can find it. Delete or rename that session
and the link dangles, which turns the load-last mapping into an error message
until the next save recreates it. `prune_last_link()` drops the link when
`fs_lstat` finds it but `fs_stat` does not — that pair of calls is exactly the
test for "a symlink whose target is gone" — and it is called after every delete
and rename.

**Deleting clears `v:this_session`.** Otherwise `startify_session_persistence`
would faithfully write the session back out on exit, recreating the file you
just deleted.

**Renaming refuses path separators.** A `/` or `\` in the name would put the
file in a subdirectory, where Startify's flat glob over the session directory
would never find it again.

**Sorting happens in `M.list()`, not in Startify.**
`g:startify_session_sort` only affects how the dashboard renders its list, so
the picker sorts by `getftime()` itself to show the newest first.

### `close_side_panels()`

Registered in `g:startify_session_before_save`. It closes NERDTree and Goyo
windows across every tab so they are not serialised into the session layout,
then returns to the tab you started on.

Two constraints shaped it:

1. **It has to be one command.** Startify executes each entry of
   `startify_session_before_save` as a Vim command, and a bar-separated
   `if`/`endif` inside `:execute` swallows the `:endfor` of the loop Startify
   runs it from. So the logic lives in Lua and the entry is a single
   `lua require(...)` call.
2. **It guards with `exists()`.** `plugin/packages.lua` maps both
   `:NERDTreeClose` and `:Goyo` to `CmdUndefined`, so calling them blindly
   would `packadd` the package on every single save just to close a window that
   was never open.

### The picker

`M.pick()` uses `mini.pick` rather than Telescope, and the reason is the
mappings: `mini.pick` can act on the item under the cursor without tearing the
list down.

| Key | Action |
|---|---|
| `<CR>` | Load the session |
| `<C-d>` | Delete it, and refresh the list in place |
| `<C-r>` | Rename it |

**Loading is deferred.** `choose` wraps `M.load(item)` in `vim.schedule`,
because loading a session wipes every buffer and rebuilds the window layout —
it has to wait until the picker window is actually gone.

**Deleting does not confirm.** The list in front of you is the confirmation and
the row disappearing is the feedback. A `confirm()` prompt would also draw over
the picker, which owns the command line while it is open.

**Renaming stops the picker first**, for the same reason — it needs the command
line — and reopens it afterwards with a refreshed list.

### Dashboard keymaps

`M.map_dashboard(buf)` runs from the `FileType startify` autocommand:

| Key | Action |
|---|---|
| `D` or `<C-d>` | Delete the session under the cursor |
| `<C-r>` | Rename it |

`d` and `r` are deliberately *not* used: they are bookmark index keys in this
configuration, and Startify binds index keys last, just before setting the
filetype, so a `FileType startify` mapping would silently win over them.

`M.entry_under_cursor()` reads `b:startify.entries`, a Vim dict keyed by line
number — so the key arrives in Lua as a string, hence
`entries[tostring(vim.fn.line("."))]`. It also checks `cmd == "SLoad"`, because
the working directory's own `Session.vim` entry is `type == "session"` too but
lives outside the session directory.

## Keymaps

The prefix is `<Leader>M`, defined once as `M.prefix` and labelled `+Session`
in `mini.clue`.

| Key | Action |
|---|---|
| `<Leader>Ms` | Save a session for this directory |
| `<Leader>MS` | Save as… (Startify's prompt, with completion) |
| `<Leader>Mf` | Find a session — the picker |
| `<Leader>Ml` | Load the last session |
| `<Leader>Mq` | Close the session |
| `<Leader>Md` | Delete a session (`:SDelete`, which prompts) |

`M.map_leader()` is called from `after/plugin/keymaps.lua` so the whole group,
and the prefix it hangs off, live in one place.

Elsewhere: `e` opens the Startify dashboard.

## The quote modules

`bible_verse.lua` and `algorithm_quote.lua` are the same shape: a table of
`{ text, source }` entries, and a `quotes()` function that picks one at random
and formats it into the list of lines Startify wants.

Neither seeds the RNG. That happens once in
[`lib.utility`](/docs/neovim/general#random-seeding), and both files carry a
comment explaining why: seeding locally from `os.time()` would give both
modules the same one-second-resolution seed and correlate the two picks, so the
verse and the quote would move together from session to session.

## Autosave

Not part of this plugin, but it is what makes sessions safe to close: see
[Autosave](/docs/neovim/custom#autosave).
