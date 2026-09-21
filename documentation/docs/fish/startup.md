---
title: "Startup"
description: "conf.d, config.fish, and what runs before you get a prompt"
sidebar_label: "Startup"
sidebar_position: 2
---

# Startup

Fish sources every `conf.d/*.fish` in filename order, then `config.fish`. Four
of the five files in `conf.d/` do startup work; the fifth is the
[abbreviations](/docs/fish/abbreviations).

```text
conf.d/00-brew.fish        Homebrew paths and completions
conf.d/10-env.fish         $EDITOR, $VISUAL, greeting
conf.d/20-vite-plus.fish   source ~/.vite-plus/env.fish
conf.d/99-zoxide.fish      zoxide init, as `j`
conf.d/abbreviations.fish  the abbreviation layer
config.fish                an ASCII fish
```

The numbers are the whole ordering mechanism. `00-brew` has to be first
because it puts `/home/linuxbrew/.linuxbrew/bin` on `$PATH`, and `99-zoxide`
has to be last because it checks whether `zoxide` is on that `$PATH`.

## `00-brew.fish` — Homebrew

```fish
if test -d /home/linuxbrew/.linuxbrew
    set -gx HOMEBREW_PREFIX "/home/linuxbrew/.linuxbrew"
    set -gx HOMEBREW_CELLAR "/home/linuxbrew/.linuxbrew/Cellar"
    set -gx HOMEBREW_REPOSITORY "/home/linuxbrew/.linuxbrew/Homebrew"
    fish_add_path -g /home/linuxbrew/.linuxbrew/bin /home/linuxbrew/.linuxbrew/sbin
    ...
end
```

This is `brew shellenv` written out by hand, and that is the point: the usual
form is

```fish
eval (/home/linuxbrew/.linuxbrew/bin/brew shellenv)
```

which runs a subprocess and evaluates its output on **every** shell start.
Setting the four variables directly costs nothing.

Three details:

- **`test -d` guards the whole block**, so the file is a no-op on a machine
  without Homebrew rather than an error.
- **`fish_add_path -g`** rather than `set -gx PATH`: it is idempotent, so
  re-sourcing the file does not accumulate duplicates, and it prepends without
  needing to spell out the existing `$PATH`.
- **Completions are prepended with `set -p`**, not appended. Homebrew's
  completions for a tool take precedence over the system's, which is what you
  want when Homebrew's copy is the newer one. Both
  `share/fish/completions` and `share/fish/vendor_completions.d` are checked,
  and each is guarded by its own `test -d`.

`HOMEBREW_CELLAR` and `HOMEBREW_REPOSITORY` are set although nothing in this
configuration reads them: Homebrew itself does, and so do formulae that shell
out.

## `10-env.fish` — the environment

Four lines, and three of them are about Emacs:

```fish
set -gx ALTERNATE_EDITOR ""
set -gx EDITOR emacsclient -t
set -gx VISUAL emacsclient -c -a emacs
set -g fish_greeting ""
```

| Variable | Value | Effect |
|---|---|---|
| `ALTERNATE_EDITOR` | *empty string* | An **empty** value tells `emacsclient` to start an Emacs daemon when there is not one already, instead of failing. Unsetting it and setting it to `""` are different things. |
| `EDITOR` | `emacsclient -t` | `-t` is a terminal frame: git, `crontab -e` and anything else that blocks gets an editor in the same terminal |
| `VISUAL` | `emacsclient -c -a emacs` | `-c` is a new GUI frame; `-a emacs` falls back to plain Emacs if the daemon cannot be reached |
| `fish_greeting` | *empty* | Suppresses the "Welcome to fish" banner |

:::note[Neovim is not the editor here]
`$EDITOR` points at Emacs, not at Neovim, even though this repository is
mostly a Neovim configuration. See the Emacs configuration in `GNU Emacs/` for what that
side of things looks like.

`fish_greeting` is set with `-g`, not `-U`. The universal variable
(`set -U fish_greeting ""`) is what most guides suggest, but it would be
written into `fish_variables` — which this repository ignores — so the setting
would not travel with the configuration.
:::

## `20-vite-plus.fish` — Vite+ {#vite}

One line:

```fish
source "$HOME/.vite-plus/env.fish"
```

:::danger[This one is not guarded]
Every other file in `conf.d/` checks that what it needs exists before touching
it. This one does not. On a machine where Vite+ has not been installed, every
new shell prints

```text
source: Error encountered while sourcing file '~/.vite-plus/env.fish':
source: No such file or directory
```

The fix is the same shape as the others:

```fish
test -f "$HOME/.vite-plus/env.fish"; and source "$HOME/.vite-plus/env.fish"
```
:::

The file it sources puts the `vp` binary on `$PATH`, which the `t` and
(commented-out) `f` abbreviations use.

## `99-zoxide.fish` — smarter `cd`

```fish
if type -q zoxide
    zoxide init fish --cmd j | source
end
```

`--cmd j` is the interesting part: zoxide's command is normally `z`, and here
it is **`j`**. So `j foo` jumps to the most frecent directory matching `foo`,
and `ji` opens the interactive picker.

`j` was chosen because `z` is a Vim fold prefix in muscle memory and `j` is
under the index finger. It is also what the
[`f` function](/docs/fish/functions#f--jump-and-look-around) calls.

`type -q` is the guard, and it runs last so that a zoxide installed through
Homebrew — put on `$PATH` by `00-brew.fish` — is found.

Five abbreviations drive zoxide directly:

| Abbreviation | Expands to |
|---|---|
| `B` | `zoxide query -i` — interactive query |
| `L` | `zoxide query` — print the best match |
| `o` | `zoxide add` — add a directory by hand |
| `O` | `zoxide remove` |

## `config.fish`

An ASCII fish, in a comment block. Nothing executable.

That is not an oversight. `config.fish` runs *after* `conf.d/`, which makes it
the wrong place for anything another file might depend on, and it cannot be
reordered without editing it. Everything real lives in `conf.d/`, where the
filename is the ordering.
