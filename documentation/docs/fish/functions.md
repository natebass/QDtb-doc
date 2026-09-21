---
title: "Functions"
description: "The prompt, the window title, and the five commands in fish/functions"
sidebar_label: "Functions"
sidebar_position: 4
---

# Functions

Eight files in
[`fish/functions/`](https://github.com/natebass/QDtb/tree/master/fish/functions).
Fish autoloads `functions/<name>.fish` the first time `<name>` is called, so
none of these costs anything at startup — with one exception: `fish_prompt` is
called before the first prompt is drawn, so its file is read immediately.

| File | Defines |
|---|---|
| `fish_prompt.fish` | `fish_prompt`, plus three private helpers |
| `fish_title.fish` | `fish_title` |
| `f.fish` | `f` |
| `gitq.fish` | `gitq` |
| `multicd.fish` | `multicd` |
| `better_history_first.fish` | `better_history_first` |
| `better_history_second.fish` | `better_history_second` |
| `better_history_third.fish` | `better_history_third` |

## The prompt

`fish_prompt.fish` holds four functions. Only `fish_prompt` is autoloadable by
name; the other three are defined as a side effect of the file being read,
which is why they live in this file rather than in three of their own.

What it renders:

```text
 QDtb-doc ⬢ 26.9.0  ➜
 └ directory  └ runtime badges  └ green on success, red on failure
```

Just the directory's basename, badges for the runtimes the project uses, and
an arrow whose colour is the exit status. No git branch, no hostname, no
timestamp — the branch is in the
[window title](#the-window-title) instead.

### `fish_prompt`

```fish
function fish_prompt --description 'A minimal fish prompt with runtime badges.'
    set -l last_status $status
    ...
end
```

The first line is the important one. `$status` changes after **every**
command, including the ones this function runs itself, so it has to be
captured before anything else happens. Read it two lines later and you get the
status of `set_color`, which is always 0.

`fish_is_root_user` swaps the `➜` for a `#`.

### `__fish_find_git_root`

Walks up from `$PWD` looking for a `.git`, and caches the answer against the
directory it was asked about:

```fish
if set -q __fish_git_root_cache_pwd; and test "$__fish_git_root_cache_pwd" = "$PWD"
    test -n "$__fish_git_root_cache"; and echo $__fish_git_root_cache
    return
end
```

It uses `test -e`, not `test -d`, and the comment says why: **git worktrees
and submodules use a `.git` file rather than a directory.** Checking for a
directory would make the prompt behave differently inside a worktree.

A negative result is cached too — as an empty string — so a directory outside
any repository is only walked once.

### `__fish_project_segments`

The badges, and the reason the caching exists:

| Badge | Shown when | Value |
|---|---|---|
| `⬢ 26.9.0` (green) | the repo root or `$PWD` has a `package.json`, and `node` exists | `node -v`, with the leading `v` stripped |
|  `3.13.1` (yellow) | any of `requirements.txt`, `setup.py`, `pyproject.toml`, `poetry.lock`, `Pipfile` is present | `python -V`, falling back to `python3` |

Building this costs a directory walk plus `node -v` and `python -V` — two
process spawns — and a prompt is drawn on every Enter. So the result is cached
against `"$git_root:$PWD"` and only rebuilt when you move.

Both branches are guarded with `type -q`, so a machine without Node or Python
gets no badge rather than an error on every prompt.

`__fish_project_has` checks the git root **and** `$PWD`, which is what makes
the badges work in a monorepo: a `package.json` in the package you are
standing in counts, even when the repository root has none.

### `__fish_get_arrow_color`

```fish
if test -n "$code"; and test "$code" -ne 0
    set_color -o red
    return
end
set_color -o green
```

The `test -n` comes first on purpose: `test "" -ne 0` is an error, not a
false, so the empty case has to be excluded before the numeric comparison is
attempted.

## The window title

`fish_title.fish` sets the terminal title to

```text
~/S/K/QDtb-doc | master@origin
```

`prompt_pwd` is Fish's own abbreviating path function — `~/S/K/QDtb-doc`
rather than the full path. Then, when the directory is inside a repository,
the branch and the first remote are appended as `branch@remote`, or just the
branch when there is no remote.

Two details:

- **`command git`**, not `git`. It bypasses any function or alias named `git`,
  so a wrapper someone adds later cannot break the title.
- **`>/dev/null 2>&1` on the `rev-parse`.** Outside a repository, git prints to
  stderr, and stderr from a title function ends up on your screen.

Fish passes the command about to run as `$argv[1]`. This function accepts it
into `$command` and then does not use it — so the title shows the directory,
not the running command.

## `f` — jump and look around

```fish
function f --description 'Change directory and list contents helper.'
    if test (count $argv) -eq 0
        eza --tree --level=2
    else
        j $argv; and pwd
        and git log --oneline -1
        and git status
        and eza
    end
end
```

With no argument, `f` prints a two-level tree of where you are. With one, it
is the "arrive somewhere and get oriented" command: `j` jumps
([zoxide](/docs/fish/startup#99-zoxidefish--smarter-cd)), then the path, the last
commit, the working tree status, and the directory listing.

The `and`s chain on success, so a failed jump stops the whole sequence rather
than printing four things about the directory you did not leave. The trade is
that the chain also stops outside a repository, where `git log` exits non-zero
— so `eza` does not run there.

`f` is why the `f` abbreviation is
[commented out](/docs/fish/abbreviations#commented-out).

## `gitq` — add, commit, push

```fish
function gitq --description 'Git add, commit, and push'
    set -l msg $argv
    if test -z "$msg"
        set msg "### QUICK-COMMIT ###"
    end
    git add -A
    git commit -m "$msg"
    git push
end
```

The whole sequence in one word, with a placeholder message when you do not
supply one. The placeholder is deliberately ugly — it is meant to be found
later.

:::warning[No `and` between the steps]
Unlike [`f`](#f--jump-and-look-around), the three git commands run
unconditionally. A failing `git commit` — nothing staged, a rejected hook, a
missing identity — is followed by `git push` anyway, which pushes whatever was
already committed. Chaining them with `and` would stop at the first failure.
:::

## `multicd` — dots to directories

```fish
function multicd
    echo cd (string repeat -n (math (string length -- $argv[1]) - 1) ../)
end
```

It **prints** a command rather than running one, because it is called from an
[abbreviation](/docs/fish/abbreviations#the-regex-abbreviation) whose expansion is the
function's output. Typing `...` puts `cd ../../` on the command line, where
you can see it before pressing Enter.

`string length -- $argv[1]` counts the dots; one fewer `../` than there are
dots is the right number, since `..` is one level. The `--` stops a leading
dash in the argument being read as an option.

## The history helpers

Three one-line functions, each returning a slot from Fish's history:

```fish
function better_history_first
    echo $history[2]
end
```

| Function | Returns | Bound to |
|---|---|---|
| `better_history_first` | `$history[2]` | `!!` |
| `better_history_second` | `$history[3]` | `2` |
| `better_history_third` | `$history[4]` | `3` |

They exist to be called by `abbr --function`, so what they print lands in the
command line for editing. See
[the note on the index](/docs/fish/abbreviations#function-backed-abbreviations).
