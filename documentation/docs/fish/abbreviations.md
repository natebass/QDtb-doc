---
title: "Abbreviations"
description: "The single-key command layer in conf.d/abbreviations.fish"
sidebar_label: "Abbreviations"
sidebar_position: 3
---

# Abbreviations

[`conf.d/abbreviations.fish`](https://github.com/natebass/QDtb/blob/master/fish/conf.d/abbreviations.fish)
is the largest file in the Fish configuration and the one that changes how the
shell feels. Almost every letter of the alphabet is an abbreviation, in both
cases, and so is every digit.

## Why abbreviations and not aliases

An abbreviation expands **in the command line**, in front of you, as soon as
you press space or Enter. An alias does not — it is substituted when the line
runs, so you never see what you actually invoked.

That matters at this density. `d` and `x` are one keystroke apart and mean
`git status` and `lazygit`; seeing the expansion is what keeps a mistyped key
from being a surprise. It also means your shell history contains the real
command, so searching it later works.

Three things in this file are still aliases — `qq`, `tmuxa`, `tmuxn` — and
those are the cases where the expansion would only be noise.

## The layout

The same scheme as the [Neovim leader
mappings](/docs/neovim/keymaps#the-alphabet-block): **lower case is the thing
you do constantly; upper case is the related, heavier, or read-only version.**

Most of the alphabet resolves into four groups.

### Finding files — `fdfind`

Fourteen of the twenty-six upper-case letters are `fdfind` with different
flags. `fdfind` is Debian's name for [fd](https://github.com/sharkdp/fd),
which is why none of these say `fd`.

| Key | Expands to | Finds |
|---|---|---|
| `Q` | `fdfind -tf` | files |
| `R` | `fdfind -td` | directories |
| `H` | `fdfind -t d` | directories (same thing, spelled differently) |
| `E` | `fdfind -tf -H` | files, including hidden |
| `u` | `fdfind -H` | anything, including hidden |
| `M` | `fdfind -H -I` | anything, hidden and ignored |
| `W` | `fdfind -a` | absolute paths |
| `T` | `fdfind -l` | long listing |
| `U` | `fdfind -e` | by extension |
| `N` | `fdfind -g` | by glob |
| `J` | `fdfind -p` | matching the full path |
| `S` | `fdfind -0 -tf \| xargs -0 wc -l` | line counts, NUL-separated so spaces in names survive |
| `D` | `fdfind \| tree --fromfile` | everything, drawn as a tree |

`A` is the odd one out — `eza --color=always -l --git --hyperlink --header -T Documents/ | less -R`,
a paged tree of `~/Documents` with git status. `--color=always` plus `less -R`
is the pair that keeps colour through the pipe.

### Git

Eleven keys, and the pairing is deliberate: the lower-case key is the one that
changes something, the upper-case key shows you something.

| Key | Expands to |
|---|---|
| `d` | `git status` |
| `h` | `git log --oneline -1` |
| `Z` | `git log --oneline -10` |
| `X` | `git diff` |
| `C` | `git remote -v` |
| `c` | `git pull` |
| `z` | `git push` |
| `y` | `git add -A; git commit -m` |
| `Y` | `git switch` |
| `I` | `git switch -c` |
| `i` | `git stash` |
| `x` | `lazygit` |

`y` ends at `-m`, so you type the message and it is one line: `y "fix the
thing"`. The whole add-commit-push sequence has a function of its own —
[`gitq`](/docs/fish/functions#gitq--add-commit-push).

### Package managers and project commands

| Key | Expands to | Ecosystem |
|---|---|---|
| `s` | `pnpm i;` | Node |
| `k` | `pnpm i` | Node — the same command as `s` |
| `g` | `pnpm dev;` | Node |
| `V` | `pnpm build;` | Node |
| `v` | `pnpm compile;` | Node |
| `F` | `pnpm lint:fix;` | Node |
| `5` | `pnpm upgrade --latest` | Node |
| `r` | `uv run ruff format; uv run ruff check --fix; uv run ty check` | Python |
| `b` | `uv run --env-file .env --package app fastapi dev backend/app/main.py` | Python |
| `6` | `uv sync --upgrade` | Python |
| `t` | `vp run test` | [Vite+](/docs/fish/startup#vite) |

Several end in `;`. That is so you can keep typing — `g` expands to
`pnpm dev;` and the cursor lands after the semicolon, ready for a second
command on the same line.

**`s` and `k` are the same command.** `pnpm i;` and `pnpm i` differ only by
the semicolon, which is one free key.

### Navigation

| Key | Expands to | What it does |
|---|---|---|
| `1` | `cd -` | Previous directory |
| `e` | `cdh` | Fish's own directory-history picker |
| `P` | `prevd` | Back through the directory stack |
| `p` | `nextd` | Forward |
| `n` | `dirs` | Show the stack |
| `K` | `pushd` | Push |
| `m` | `popd` | Pop |
| `,` | `pushd .` | Push the current directory without moving |
| `B` | `zoxide query -i` | Pick a directory interactively |
| `L` | `zoxide query` | Print the best match |
| `o` | `zoxide add` | Add a directory to the database |
| `O` | `zoxide remove` | Remove one |

`j` is not in this table because it is not an abbreviation: it is zoxide
itself, installed as `j` by
[`99-zoxide.fish`](/docs/fish/startup#99-zoxidefish--smarter-cd).

### The rest

| Key | Expands to |
|---|---|
| `-` | `nvim` |
| `` ` `` | `pwsh` |
| `w` | `exec fish` — reload the shell in place |
| `q` | `fastfetch --config ~/Downloads/a.jsonc --logo none` |
| `a` | `eza` |
| `G` | `eza -l --no-time --no-user --no-permissions **.txt` |
| `4` | `history --max 3` |
| `7` | `jq` |
| `8` | `rg` |
| `9` | `fzf` |
| `0` | `openssl rand -hex` |
| `l` | `openssl rand -base64` |

`-` for `nvim` is the shortest possible way to open the editor, and it pairs
with the `-` that opens `mini.files` inside it.

:::note[`q` points outside the repository]
`fastfetch --config ~/Downloads/a.jsonc` reads a config from the Downloads
folder, which is not in version control. On a machine without that file,
`q` fails.
:::

## Function-backed abbreviations

Three abbreviations expand to whatever a function *prints*, rather than to a
fixed string. This is `abbr --function`, which Fish gained in 3.6:

```fish
abbr -a !! --function better_history_first
abbr -a 2  --function better_history_second
abbr -a 3  --function better_history_third
```

Each function is one line:

```fish
function better_history_first
    echo $history[2]
end
```

| Abbreviation | Function | Prints |
|---|---|---|
| `!!` | `better_history_first` | `$history[2]` |
| `2` | `better_history_second` | `$history[3]` |
| `3` | `better_history_third` | `$history[4]` |

So typing `!!` and pressing space drops a previous command into the line,
where you can edit it before running it — which is the thing bash's `!!` does
not let you do.

:::note[The index starts at 2]
`$history[1]` is the most recent command. These start at `$history[2]`, so
`!!` recalls the command *before* the last one, `2` the one before that, and
so on. If the intent was bash's `!!` — repeat the last command — each index
is one too high.
:::

## The regex abbreviation

```fish
abbr --add dotdot --regex '^\.\.+$' --function multicd
```

This one matches a **pattern** rather than a literal. Any run of two or more
dots is passed to [`multicd`](/docs/fish/functions#multicd--dots-to-directories),
which prints the equivalent `cd` command:

| You type | You get |
|---|---|
| `..` | `cd ../` |
| `...` | `cd ../../` |
| `....` | `cd ../../../` |

The name `dotdot` is just the abbreviation's identity for `abbr --erase`; it
is never typed.

## Aliases

```fish
alias qq exit
alias tmuxa 'tmux attach -t'
alias tmuxn 'tmux new -s'
```

`alias` in Fish defines a function and, unlike an abbreviation, does not show
you the expansion. For these three there is nothing to see: `qq` is already
shorter than what it expands to, and the two tmux ones are mnemonics rather
than abbreviations of anything.

## Commented out

Four abbreviations are commented out rather than deleted, and they record
where the configuration moved:

```fish
# abbr --add t 'uv sync'                  →  t is now `vp run test`
# abbr --add F 'uv run ruff check --fix; uv run ruff format;'
# abbr --add f 'vp check --fix;'          →  f has no abbreviation now
# abbr --add A 'fdfind -tf -X rm -i'      →  "delete matched files... careful!"
```

The `A` one is worth leaving commented: `fdfind -tf -X rm -i` deletes every
file matching a pattern you have not typed yet, on one keystroke.

## Free keys

`f` and `j` are the only letters with no abbreviation. `j` is taken by zoxide.
`f` is taken by the [`f` function](/docs/fish/functions#f--jump-and-look-around), which
is why its commented-out abbreviation stayed commented out.
