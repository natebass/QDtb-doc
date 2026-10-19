---
title: "Workflows"
description: "Step-by-step recipes for everyday jobs, starting with finding and replacing a string across a whole project"
sidebar_label: "Workflows"
sidebar_position: 45
---

# Workflows

The other pages describe what each piece does. This one describes how the
pieces fit together for a job, from the first key to the saved file.

## Search and replace across a project

The situation: you `cd` into a project, start `nvim`, and want to change
`oldName` to `newName` everywhere. Sometimes you only want to look at every
place it appears. Sometimes you want to decide one match at a time. Sometimes
you want to replace them all at once.

All three use the same route:

```text
ripgrep  ──▶  a picker or :grep  ──▶  quickfix list  ──▶  :cdo / :cfdo  ──▶  update
 (find)          (look)              (the hand-off)        (replace)        (save)
```

Every search tool here runs [ripgrep](https://github.com/BurntSushi/ripgrep)
underneath. The **quickfix list** sits between finding and replacing: it is
Neovim's own list of locations, and once your matches are in it, the built-in
commands can work through it file by file. No search-and-replace plugin is
installed. It isn't needed.

:::caution[Check where you are first]
Every search below starts from the **current working directory**, not from the
file you have open. `:pwd` shows it. If you have pressed `<leader>o`
(`cd %:p:h`, which moves into the current file's directory), you are now
searching a subfolder. Get back with `:cd -`, or with `:cd` and the project
path.
:::

### Step 1: View every instance

Four ways to look. They differ in how you type the pattern and where the
results go.

| Keys | Tool | Best for |
|---|---|---|
| `<leader>L` | `MiniPick.builtin.grep_live()` | Typing the pattern and watching results update as you type |
| `<leader>e` | `MiniPick.builtin.grep()` | Searching once for a fixed pattern, then **fuzzy-filtering the results** (for example by typing part of a file name) |
| `<leader>y` | `Telescope live_grep` | The same as `<leader>L`, in Telescope's layout with its preview pane |
| `:grep oldName` | Neovim + `grepprg` | Skipping the picker and putting results **straight into the quickfix list** |

Inside the mini.pick pickers:

| Key | Action |
|---|---|
| `<C-n>` / `<C-p>` | Next / previous result |
| `<Tab>` | Toggle the preview of the current result |
| `<CR>` | Open the result |
| `<C-CR>` | Open it in a vertical split (changed from the default `<C-v>` in [`mini.lua`](/docs/reference/after/plugin/mini)) |
| `<C-o>` | *Live grep only:* limit the search to a glob, such as `*.ts` or `src/**` |
| `<C-e>` | *Live grep only:* switch between regex and plain-text matching |
| `<Esc>` | Close |

In Telescope, `<C-n>` / `<C-p>` move through results and `<CR>` opens one.
Telescope's insert-mode `<Esc>` is remapped to close the picker straight away,
so there is no Normal mode inside it.

**`:grep` takes ripgrep flags.** [`'grepprg'`](/docs/neovim/options#search) is
`rg --vimgrep`, so anything after `:grep` goes to ripgrep:

```vim
:grep! oldName                 " ! = fill the list but don't jump to the first match
:grep! -w oldName              " whole word only
:grep! -F 'user.name('         " fixed string, no regex
:grep! -i oldname              " case-insensitive
:grep! oldName -g '*.ts'       " only TypeScript files
:grep! <C-r><C-w>              " the word under the cursor (<C-r><C-w> pastes it)
```

Then `<leader>xq` toggles the quickfix window, and `]q` / `[q` step through
the matches from anywhere. `<leader>l` (`:cwindow`) opens the window only when
the list has something in it.

:::info[Case sensitivity is not the same everywhere]
mini.pick reads [`'ignorecase'` and `'smartcase'`](/docs/neovim/options#search) and
passes `--smart-case` to ripgrep. Telescope passes `--smart-case` by default.
In both, `oldname` also finds `OldName`, but `oldName` only finds itself.

`:grep` uses `rg --vimgrep` with no case flag, so it is **always
case-sensitive** unless you add `-i` or `-S`.
:::

### Step 2: Put the matches in the quickfix list

`:grep` has already done this. From a picker:

| Picker | All results | Only some |
|---|---|---|
| mini.pick | `<C-a>` to mark all, then `<M-CR>` | `<C-x>` on each one you want, then `<M-CR>` |
| Telescope | `<C-q>` (also opens the quickfix window) | `<Tab>` on each one, then `<M-q>` |

In mini.pick, `<M-CR>` sends only **marked** items. If nothing is marked, it
does nothing, so press `<C-a>` first.

**Trim the list before you replace.** Neovim ships an optional `cfilter`
package. Load it once per session:

```vim
:packadd cfilter
:Cfilter! /test/        " drop every entry whose file or text matches "test"
:Cfilter /src\/api/     " keep only entries under src/api
```

Each `:Cfilter` adds a new list. `:colder` and `:cnewer` move between the old
and new lists, so trimming can always be undone.

### Step 3a: Replace one at a time

**With a confirmation prompt.** Let `:cdo` visit each entry and ask about every
match:

```vim
:cdo s/oldName/newName/gce | update
```

At each match, Neovim highlights it and asks `replace with newName (y/n/a/q/l/^E/^Y)?`:

| Answer | Meaning |
|---|---|
| `y` / `n` | Replace this one / skip it |
| `a` | Replace this one and every remaining match **in the current entry** |
| `l` | Replace this one, then move on to the next entry |
| `q` / `<Esc>` | Stop. Nothing else is touched, including the remaining entries |

What the flags do: `g` replaces every match on the line, not only the first.
`c` asks for confirmation. `e` stops an error appearing when a line has no
match left. That happens because `:grep` lists a line once **per match**, so a
line with two matches appears twice, and the second visit finds nothing.
`| update` writes each file after its changes, but only if it changed.

**By hand, seeing each change as you make it.** This uses only Vim built-ins,
with no prompt:

1. Put `oldName` in the search register. Either put the cursor on the word and
   press `*` (which also matches whole words only), or press `<leader>k` and
   type the pattern.
2. `cgn`, type `newName`, `<Esc>`. This changes the next match.
3. `.` changes the next match. `n` skips to the next match without changing it.
4. When this file is done, `]q` jumps to the next file in the quickfix list.
   Repeat steps 3 and 4.
5. `:wa`, or `<C-s>` in each buffer, to save.

:::caution[`/` is not search here]
In this configuration, `/` in Normal mode opens **Telescope find_files** (see
[Keymaps](/docs/neovim/keymaps)). To search inside the buffer, use
`<leader>k` (opens `/` with the previous pattern already filled in),
`<leader>K` (the search history window), `?` to search backwards, or `*` / `#`
on a word.
:::

### Step 3b: Replace every instance

Drop the `c`:

```vim
:cdo s/oldName/newName/ge | update
```

or work file by file instead of entry by entry:

```vim
:cfdo %s/oldName/newName/ge | update
```

| Command | Runs on | Use it when |
|---|---|---|
| `:cdo` | each **entry** in the list (a line) | you trimmed the list and want *only* those lines changed |
| `:cfdo` | each **file** in the list, once | you want every match in those files changed, including any you filtered out of the list. It is also faster across hundreds of matches |

**Check and undo.** [`mini.diff`](/docs/neovim/plugins) marks changed lines
with `~` in the sign column, and `:Git diff` (from `mini.git`) shows the whole
change. To undo a replace across all files:

```vim
:cfdo undo | update
```

That undoes the latest change in each file, which is the substitution, as long
as you have done nothing else in those files since. Every file is under git
anyway, so `git checkout -- .` or `git restore` also works.

### Replacing inside one file only

Without the quickfix step:

```vim
:%s/oldName/newName/gc
```

[`'inccommand'`](/docs/neovim/options#search) is `nosplit`, so as you type, Neovim
highlights the replacement **live in the buffer** before you press `<CR>`.

Two shortcuts:

- `<leader>S` types `:%s//` and puts the cursor between the slashes. Type
  `oldName/newName`, then `<End>` and the flags.
- An empty pattern means "the last search". So `*` on a word, followed by
  `:%s//newName/g`, replaces that word without typing it again.

To limit the change to some lines, select them in Visual mode first (`a` in
this configuration starts linewise Visual, `A` starts characterwise) and press
`:`. Neovim fills in `:'<,'>` for you.

### Things that catch you out

**ripgrep and `:s` speak different regex.** The search finds matches with
ripgrep's syntax, while the replace step uses Vim's. A pattern that works in
one may not work in the other:

| Want | ripgrep / pickers | `:s` |
|---|---|---|
| Whole word | `-w oldName` or `\boldName\b` | `\<oldName\>` |
| Literal text, no regex | `-F` or `<C-e>` in live grep | `\VoldName` |
| Alternatives | `foo\|bar` → `foo|bar` | `foo\|bar` |
| Grouping | `(foo)` | `\(foo\)`, or `\v(foo)` |
| Case-insensitive | `-i` | `\c` anywhere in the pattern |

For plain identifiers this never matters. For anything with punctuation, the
simplest fix is `-F` on the search and `\V` on the replace.

**Some files are never searched.** ripgrep skips anything in `.gitignore`,
hidden files and folders (`.github/`, `.env`), and binary files. Add
`--hidden` to include hidden files, or `-uu` to include ignored ones too:
`:grep! -uu --hidden oldName`.

**Changes are not saved unless you save them.** [Autosave](/docs/reference/lua/plugins/QDtb/autosave)
only writes on `FocusLost` and when Neovim exits. That is why every command
above ends in `| update`. If you leave it off, `:wa` writes everything at
once.

### If you want a plugin for this

The quickfix route covers everything above. Some plugins offer a dedicated
buffer where you type the search and the replacement and see a live preview
of the result in every file:
[grug-far.nvim](https://github.com/MagicDuck/grug-far.nvim) is the current
favourite, and [nvim-spectre](https://github.com/nvim-pack/nvim-spectre) is
the older one. To add one, put it in [`plugin/packages.lua`](/docs/neovim/plugins)
with `load = false` and add its command (such as `GrugFar`) to the
`CmdUndefined` map, so that it costs nothing until you first use it.
