---
title: "Completions"
description: "Hand-written completions for eza, stylua, pwsh, vercel and lazynpm"
sidebar_label: "Completions"
sidebar_position: 5
---

# Completions

Five files in
[`fish/completions/`](https://github.com/natebass/QDtb/tree/master/fish/completions).
Fish reads `completions/<cmd>.fish` the first time you press `<Tab>` after
typing `<cmd>`, so none of them costs anything until it is used.

| File | Lines | Why it is here |
|---|---|---|
| `eza.fish` | 139 | eza's own completion is not always packaged |
| `vercel.fish` | 35 | The Vercel CLI ships no Fish completion |
| `stylua.fish` | 26 | Same |
| `pwsh.fish` | 12 | PowerShell's own completion does not cover its CLI flags |
| `lazynpm.fish` | 5 | Five flags, and none of them documented anywhere convenient |

All five are for tools this configuration uses elsewhere: `eza` in the
[`f` function](/docs/fish/functions#f--jump-and-look-around) and four
[abbreviations](/docs/fish/abbreviations), `stylua` from Neovim's `<leader>w`, `pwsh`
from the `` ` `` abbreviation, and `vercel` for deploying this documentation
site's sibling projects.

## How a completion file is written

Every line is one `complete` call. The flags that matter:

| Flag | Meaning |
|---|---|
| `-c <cmd>` | The command being completed |
| `-s <char>` | A short option, `-x` |
| `-l <name>` | A long option, `--name` |
| `-d "text"` | The description shown beside the candidate |
| `-r` | This option **requires** an argument |
| `-a "…"` | The candidate arguments for it |
| `-F` | Complete a filename for the argument |
| `-x` | Exclusive — offer only these candidates, not files as well |
| `-n "<condition>"` | Only offer this when the condition is true |
| `-e` | Erase existing completions for the command |

Candidate lists can carry their own descriptions, separated by a tab:

```fish
complete -c eza -l color -l colour -d "When to use terminal colours" -x -a "
    always\t'Always use colour'
    auto\t'Use colour if standard output is a terminal'
    never\t'Never use colour'
"
```

The `-x` is what stops Fish offering filenames alongside `always`, `auto` and
`never`.

## `eza.fish`

The longest of the five, and organised the way eza's own `--help` is:
meta-options, display options, filtering, sorting, long-view fields, and
"optional extras" — the features eza only has when it was built with them.

Two patterns are worth copying:

- **Both spellings on one line.** `-l color -l colour` registers the British
  and American spellings as the same option, rather than as two completions
  that would both show up in the list.
- **Value lists with descriptions.** `--time-style` offers `default`, `iso`,
  `long-iso`, `full-iso`, `relative` and `+FORMAT`, each with a line of its
  own explaining what it prints.

The "Optional extras" section at the end covers `--git`, `--git-repos`,
`--git-repos-no-status`, `--extended` and `--context`, which is the set that
depends on how eza was compiled.

## `vercel.fish`

The only one that is not a flat list. It builds the completions in loops:

```fish
set -l vercel_basic_commands deploy build cache dev env git help init …
set -l vercel_advanced_commands activity agent ai-gateway alerts alias api …

complete -c vercel -e
complete -c vc -e

for command in $vercel_basic_commands
    complete -c vercel -n __fish_use_subcommand -a $command -f
    complete -c vc -n __fish_use_subcommand -a $command -f
end
```

Four things are going on:

1. **`complete -c vercel -e` first.** It erases whatever completions were
   already registered — including any the Vercel CLI installed itself — so the
   list is this file's and not a merge of two.
2. **`vc` gets everything `vercel` does.** Every loop runs twice, once per
   name, because `vc` is the CLI's own short alias.
3. **`-n __fish_use_subcommand`** means "only while no subcommand has been
   typed yet", which is what keeps `vercel deploy <Tab>` from offering
   `deploy` again.
4. **`-f`** on each subcommand stops Fish falling back to filenames.

The commands are split into `basic` and `advanced` as two variables, though
both loops treat them identically — the split is documentation rather than
behaviour.

A third loop adds `--help`/`-h` to every subcommand, and a final one adds the
global options — `--cwd`, `--local-config`, `--global-config`, `--debug`,
`--no-color`, `--non-interactive`, `--scope`, `--token` — to `vercel` and `vc`
themselves. `--token` deliberately has no candidate list.

## `stylua.fish`

Twenty-six lines covering every flag of
[stylua](https://github.com/JohnnyMorganz/StyLua), which is what Neovim's
`<leader>w` runs through `npx`.

The valuable half is the enumerated values, because these are the ones nobody
remembers:

| Option | Candidates |
|---|---|
| `--color` | `always` `ansi` `auto` `never` |
| `--output-format` | `standard` `summary` `json` |
| `--call-parentheses` | `Always` `NoSingle` `String` |
| `--indent-type` | `Tabs` `Spaces` |
| `--line-endings` | `Unix` `Windows` `WindowsOld` `Auto` |
| `--quote-style` | `Auto` `ForceSingle` `ForceDouble` |
| `--syntax` | `All` `Lua51` `Lua52` `Lua53` `Lua54` `Luau` |

Note the capitalisation: stylua's values are case-sensitive and title-cased,
which is exactly the sort of thing a completion should carry so you do not
have to.

## `pwsh.fish`

Twelve lines for PowerShell's command-line flags — the ones you use when
launching `pwsh` from Fish rather than from inside PowerShell.

| Option | Note |
|---|---|
| `--Login` | Start a login shell |
| `--NoLogo` | Hide the startup banner |
| `--NoExit` | Stay after running the startup commands |
| `--NoProfile` | Skip the profile — the flag [the PowerShell docs](/docs/powershell/xdg-setup) use for every reproducible invocation |
| `--NonInteractive` | No prompt |
| `--File` | `-r -F`: takes a filename |
| `--Command` | `-r`: takes a string |
| `--EncodedCommand` | `-r`: takes base64 |
| `--WorkingDirectory` | `-r -a '(__fish_complete_directories)'` |
| `--ConfigurationName` | `-r` |
| `--Version` | `-r` |
| `--Help` | |

`--WorkingDirectory` is the one that shows the pattern for a custom candidate
source: `-a '(…)'` runs the command inside and uses its output as the
candidate list.

## `lazynpm.fish`

Five lines, for [lazynpm](https://github.com/jesseduffield/lazynpm):

```fish
complete -c lazynpm -s h -l help    -d 'Display help'
complete -c lazynpm -s p -l path -r -F -d 'Path of package'
complete -c lazynpm -s v -l version -d 'Print the current version'
complete -c lazynpm -s d -l debug   -d 'Run in debug mode with logging'
complete -c lazynpm -s c -l config  -d 'Print the current default config'
```

The whole surface of the tool. `-p` is the only one that takes an argument,
and `-r -F` says so and completes a path for it.

## Adding one

A new file, named after the command, is all it takes — Fish finds it the next
time you complete that command, with no reload:

```fish
# fish/completions/mytool.fish
complete -c mytool -s v -l verbose -d 'Verbose output'
complete -c mytool -l mode -r -x -a 'fast slow' -d 'Operating mode'
```

To check what Fish currently knows for a command:

```bash
complete -C 'mytool -'
```
