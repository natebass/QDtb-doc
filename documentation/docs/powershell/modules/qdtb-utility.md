---
title: "QDtb.Utility"
description: "Git repository housekeeping, a rainbow prompt, and image conversion"
sidebar_label: "QDtb.Utility"
sidebar_position: 20
---

# QDtb.Utility

> General utility functions.

The drawer. Nine exported functions across three files, plus a handful of
private helpers that are not exported and not all finished.

```powershell
Import-Module QDtb.Utility
Get-Command -Module QDtb.Utility
```

## Layout

```text
QDtb.Utility/
  QDtb.Utility.psd1        v1.0.0, PowerShellVersion 5.1
  QDtb.Utility.psm1        loads Source/Private then Source/Public
  Source/Public/
    Developer.ps1          528 lines — git
    Windows.ps1            395 lines — winget, images, icons
    Shell.ps1               44 lines — the prompt
  Source/Private/
    fs.ps1                 188 lines — file helpers
    med.ps1                 93 lines — media conversion
    template.ps1            29 lines — a sample-file writer
    dev.ps1, shell.ps1       0 lines — empty
  Test/AllQDtb.Tests.ps1   157 lines
```

:::warning[The loader has been wrong before]
`QDtb.Utility.psm1` says so in its own header: the folder was renamed from
`Functions` to `Source` and this file was not, so the module **imported
cleanly and exported nothing at all** — every name in `FunctionsToExport`
simply missing, with no error.

That is why every suite in this repository now has a test that asserts the
module exports something. See
[Testing](/docs/powershell/testing#writing-a-new-suite).
:::

`dev.ps1` and `shell.ps1` are zero bytes. They are loaded and contribute
nothing.

## Git

### `Invoke-GitStatusCheck`

The most developed function here. Finds git repositories under a root at a
configurable depth, runs `git fetch` and `git status --short` on each, and
prints a colour-coded summary table.

| Parameter | Meaning |
|---|---|
| `-Path` | Root to scan. Defaults to the current directory |
| `-Depth` | `1` root only, `2` root and children, `3` also grandchildren |
| `-FetchTimeout` | Seconds to wait on each `git fetch` |

The fetch is wrapped in `Start-Job` with a timeout, which is what keeps one
unreachable remote from stalling a scan of thirty repositories.

### `Update-GitRepository`

Recursively updates every git repository under a root.

### `Get-MyProjectGitStatus`

Status for a fixed list of repositories — the paths are hard-coded in the
function body, starting with `/home/nwb/Source/Repos/nate-opensac.org`. Useful
as-is only on the machine it was written for; editing the array is the
interface.

### `Sync-Fork`

Syncs a fork with its upstream: refuses to start if `git status --porcelain`
reports anything, adds an `upstream` remote, fetches, merges with `--ff-only`,
and pushes. `SupportsShouldProcess`, so `-WhatIf` shows the merge and the push
without doing either.

:::note[The upstream URL is derived oddly]
The `remote add upstream` line builds its URL by piping `origin`'s URL through
a chain of `-replace` operations that mostly replace things with themselves —
`'github.com', 'github.com'` and `':', ':'`. The net effect is stripping
`.git`, and the rest is inert.

For a fork, `upstream` is a *different* repository from `origin`, so deriving
one from the other cannot generally work. `git remote add upstream <url>` by
hand, once per clone, is what this is standing in for.
:::

### `Start-MyProject`

Sets a repository path by operating system, fetches, checks status, pulls when
clean, and starts the development jobs.

:::danger[Interactive and hard-coded]
This function fetches a hard-coded repository, starts `npm run dev` and
`uv run fastapi dev` as background jobs, and then blocks on
`Read-Host "Press Enter to exit"`.

Calling it from a test **hung the entire test run** until someone noticed and
pressed a key — which is the story the
[sandbox](/docs/powershell/testing#the-sandbox) came out of. Every boundary it
crosses is now mocked in the suite: `git`, `Start-Job`, `Receive-Job`,
`Read-Host` and the location stack.
:::

## Shell

### `Write-RainbowPrompt`

Three chevrons in dark red, green and magenta. It branches on
`[Environment]::OSVersion.Platform`: `❯❯❯` on Unix, `>>>` everywhere else,
since the pointed variant needs a font that has it.

This is the `prompt` function in
[`Microsoft.VSCode_profile.ps1`](/docs/powershell#microsoftvscode_profileps1).

It carries a `SuppressMessageAttribute` for `PSAvoidUsingWriteHost`, which is
also excluded globally — see
[PSScriptAnalyzer](/docs/powershell/testing#psscriptanalyzer). `Write-Host` is
the only cmdlet that takes `-ForegroundColor`, and the colour is the whole
point.

### `Write-ColorTable`

Every foreground colour against every background colour, as a grid. Sixteen by
sixteen. For picking colours that are readable in your terminal rather than in
the abstract.

It is **not** in `FunctionsToExport`, so it is private in practice. Reach it
through the module's scope:

```powershell
& (Get-Module QDtb.Utility) { Write-ColorTable }
```

## Windows and media

These three are exported but are the least portable things in the module.

### `ConvertTo-Icon`

Converts an image or SVG to `.ico`, with verbose output for debugging.

### `New-RandomColorGridImage`

Creates a PNG of randomly coloured pixels. `SupportsShouldProcess`, and it has
two parameter sets. There are two related scripts in
`powershell/Scripts/random_color_grid1.ps1` and `…2.ps1`.

### `Update-WingetPackage`

Updates a winget package by id, or all of them. Windows only — winget does not
exist elsewhere — and `SupportsShouldProcess`, so `-WhatIf` lists what would
be upgraded.

## The private helpers

Not exported. Listed because the module loads them and because two are
unfinished:

| Function | File | State |
|---|---|---|
| `Remove-File` | `fs.ps1` | Deletes files matching a pattern, after a configurable countdown |
| `Get-StorageAnalysis` | `fs.ps1` | Directory size in GB plus the ten largest files |
| `Compare-Directory` | `fs.ps1` | Compares two directories |
| `Edit-ContentAndFileName` | `fs.ps1` | **Broken.** Its own synopsis opens with "WARNING: Don't use this, it is currently broken by overwriting files with the wrong name." |
| `Convert-WebpToPng` | `med.ps1` | Converts `.webp` to `.png`; defaults to `/home/nwb/Downloads` |
| `Edit-LinuxMintIconCopyQ` | `med.ps1` | Resizes an icon into `/usr/share/icons/hicolor`; the input path is hard-coded |
| `Save-Sample` | `template.ps1` | Writes a sample file |

## Tests

`Test/AllQDtb.Tests.ps1`, 157 lines. It opens with the history above, and it
mocks `git`, `Start-Job`, `Receive-Job`, `Read-Host` and the location stack.
What is left is the control flow, which is the part worth testing anyway.

```powershell
./Invoke-Tests.ps1 -Path 'QDtb.Utility'
```
