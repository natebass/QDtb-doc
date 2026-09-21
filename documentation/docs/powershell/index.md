---
title: "PowerShell"
description: "The profiles, the execution policy, and how the module path is wired up"
sidebar_label: "Overview"
sidebar_position: 1
---

# PowerShell

[`QDtb/powershell/`](https://github.com/natebass/QDtb/tree/master/powershell)
holds two profiles, two settings files, a test runner, and six modules. It is
run on Linux Mint through `pwsh`, reachable from Fish with the
[`` ` `` abbreviation](/docs/fish/abbreviations#the-rest).

| Path | What it is |
|---|---|
| `Microsoft.PowerShell_profile.ps1` | The interactive profile |
| `Microsoft.VSCode_profile.ps1` | Loaded instead, inside the VS Code terminal |
| `powershell.config.json` | One setting: the execution policy |
| `PSScriptAnalyzerSettings.psd1` | Lint rules — see [Testing](/docs/powershell/testing#psscriptanalyzer) |
| `Invoke-Tests.ps1` | Runs every suite and checks it left nothing behind |
| `Modules/` | Six modules — see [Modules](/docs/powershell/modules) |
| `Tests/TestSandbox.psm1` | The shared sandbox the suites work inside |
| `Scripts/` | Loose scripts, run by hand rather than imported |

Where PowerShell looks for all of this on Linux is a subject of its own:
[XDG paths](/docs/powershell/xdg-setup).

## `Microsoft.PowerShell_profile.ps1`

The interactive profile, and it does exactly two things.

### The prompt

```powershell
& ([scriptblock]::Create((oh-my-posh init pwsh --config "…/gruvbox.omp.json")))
```

[oh-my-posh](https://ohmyposh.dev) with the bundled `gruvbox` theme, loaded
from the cache directory it downloads themes into.

The `[scriptblock]::Create(...)` wrapper is the documented form.
`oh-my-posh init pwsh` prints a block of PowerShell; compiling that string into
a script block and invoking it with `&` is what defines the `prompt` function
in the current session. `Invoke-Expression` would do the same thing with worse
scoping.

:::note[The theme path is absolute, and local]
`/home/nwb/.cache/oh-my-posh/themes/gruvbox.omp.json` is a hard-coded path
under one user's home directory, and `.cache` is not something oh-my-posh
guarantees to keep. On another machine, or after a cache clear, the profile
starts with an error.
:::

### The module path

```powershell
if ($IsWindows) {
    $nvimModulePath = Join-Path $env:LOCALAPPDATA "nvim\powershell\Modules"
}
else {
    $nvimModulePath = "/home/nwb/.var/app/dev.neovide.neovide/config/nvim/powershell/Modules"
}

if (Test-Path $nvimModulePath) {
    $env:PSModulePath = "$nvimModulePath$([System.IO.Path]::PathSeparator)$env:PSModulePath"
}
```

This is what makes `Import-Module ClaudeCron` work without a symlink or an
install step: the `Modules/` directory in this repository is **prepended** to
`$env:PSModulePath`, so PowerShell discovers all six modules where they
already live.

Three things it gets right:

- **`Test-Path` first.** On a machine where the config is not installed,
  nothing is prepended rather than a nonexistent path being added.
- **`[System.IO.Path]::PathSeparator`**, not a literal `:`. That is `;` on
  Windows and `:` elsewhere, and hard-coding either is how a profile ends up
  working on one platform only.
- **Prepending, not appending.** A module here shadows one of the same name
  installed through `Install-Module`, which is the right way round while you
  are developing them.

The `$IsWindows` branch points at `%LOCALAPPDATA%\nvim`, Neovim's normal
Windows config location. The else branch is the Flatpak path — the same
`~/.var/app/dev.neovide.neovide/config/nvim` root the rest of this repository
uses.

### The rest of the file

Two comment blocks. The first is a one-line Pester invocation kept as a
reminder:

```powershell
Invoke-Pester -Container (New-PesterContainer -ScriptBlock {
  Describe "Test" { It "Pass" { $true | Should -Be $true } }
}) -Output None
```

The second is ASCII art. Neither runs.

## `Microsoft.VSCode_profile.ps1`

PowerShell loads **this file instead of** `Microsoft.PowerShell_profile.ps1`
when it is hosted inside VS Code — not as well as. So anything the two need in
common has to be in both, which is why the module-path block is duplicated
here verbatim.

The difference is the prompt:

```powershell
function prompt { Write-RainbowPrompt }
```

`Write-RainbowPrompt` comes from
[QDtb.Utility](/docs/powershell/modules/qdtb-utility) — three chevrons in
rotating colours. No oh-my-posh, because the VS Code integrated terminal is a
different enough environment to want a prompt with no external dependency.

There is also a commented-out `fnm env --use-on-cd` line, from when Node
versions were managed per directory.

:::warning[An ordering problem]
`prompt` is defined on line 6, but `$env:PSModulePath` is not extended until
line 17 — and `Write-RainbowPrompt` lives in a module on that path.

It works anyway, because a `function` body is not resolved until it is called,
and by the time VS Code draws the first prompt the whole profile has run. It
is still the wrong order, and it would break the moment anything called
`prompt` during the profile.
:::

## `powershell.config.json`

```json
{ "Microsoft.PowerShell:ExecutionPolicy": "RemoteSigned" }
```

One line. `RemoteSigned` allows local scripts to run unsigned and requires a
signature on anything downloaded from the internet.

On Linux this is close to decorative — PowerShell's execution policy is a
Windows feature, and `Get-ExecutionPolicy` reports `Unrestricted` there
regardless. The file is in the repository so that the same configuration on
Windows gets the policy without a `Set-ExecutionPolicy` run as administrator.

This file only takes effect when it sits in PowerShell's config directory,
which on Linux is `~/.config/powershell/` — see
[XDG paths](/docs/powershell/xdg-setup).

## `Scripts/`

Loose scripts, not part of any module and not on `$env:PSModulePath`. They are
run by hand:

```powershell
./Scripts/Get-GitStatusAllBranches.ps1
```

`PSScriptAnalyzer` still covers them —
[`Invoke-Tests.ps1` lints the whole tree](/docs/powershell/testing#psscriptanalyzer),
not just `Modules/`, and the reason is in a comment there: `Scripts/` had 28
calls passing `-ForegroundColor` to `Write-Information`, which that cmdlet
does not accept, and nothing was looking at it.
