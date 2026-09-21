---
title: "Modules"
description: "The six PowerShell modules, and the layout they share"
sidebar_label: "Overview"
sidebar_position: 0
---

# Modules

Six modules under
[`powershell/Modules/`](https://github.com/natebass/QDtb/tree/master/powershell/Modules).
They are on `$env:PSModulePath` already — the
[profile prepends the directory](/docs/powershell#the-module-path) — so
`Import-Module <name>` works with no install step.

| Module | Version | What it is for |
|---|---|---|
| [ClaudeCron](/docs/powershell/modules/claude-cron) | 1.1.0 | Queue Claude prompts and shell commands, and run them on a schedule or when quota returns |
| [QDtb.Utility](/docs/powershell/modules/qdtb-utility) | 1.0.0 | Git repository housekeeping, a rainbow prompt, and image conversion |
| [QDtb.TailwindToCSS](/docs/powershell/modules/qdtb-tailwindtocss) | 0.0.1 | Turn a string of Tailwind classes into plain CSS |
| [QDtb.SvgToReact](/docs/powershell/modules/qdtb-svgtoreact) | 0.0.1 | Turn a folder of SVGs into typed React components |
| [PodcastDownload](/docs/powershell/modules/podcast-download) | 0.0.1 | Download episodes from an RSS file |
| [DocumentationStation](/docs/powershell/modules/documentation-station) | 0.0.1 | A stub |

## The shape they share

Every module is a manifest, a root module that loads files, and functions in
folders:

```text
<Name>/
  <Name>.psd1        manifest: version, description, FunctionsToExport
  <Name>.psm1        root module: dot-sources the function files
  Functions/         or Source/
    Private/         helpers
    Public/          the exported surface
  Test/              or Resources/ — the Pester suite
  README.md          where there is one
```

The `.psm1` is always the same loop:

```powershell
foreach ($scope in @('Private', 'Public')) {
    $folder = Join-Path $PSScriptRoot 'Functions' $scope
    if (-not (Test-Path -LiteralPath $folder)) { continue }
    foreach ($file in (Get-ChildItem -LiteralPath $folder -Filter '*.ps1' -File -Recurse | Sort-Object FullName)) {
        . $file.FullName
    }
}
```

**`Private` before `Public`**, so a public function can rely on the helpers it
is built from. `Join-Path` rather than a literal separator, because these are
developed on Linux Mint where a backslash is a filename character rather than
a directory separator.

### Two things that shape those loaders

The loops are not identical, and the differences are all scar tissue:

- **`Source` vs `Functions`.** `QDtb.Utility`'s folder was renamed from
  `Functions` to `Source` and the loader was not, so the module imported
  cleanly and **exported nothing whatsoever** — every name in
  `FunctionsToExport` simply missing. Every suite now has a test for
  "exports anything at all" because of it.
- **`-Exclude '*.Tests.ps1'`.** `DocumentationStation`'s test suite used to
  live in `Source/`, which the loader globs — so `Import-Module` dot-sourced
  it and ran the `Describe` blocks as a side effect. The suite has moved, and
  the exclusion stays to keep it that way.

`QDtb.SvgToReact` and `QDtb.TailwindToCSS` are the two that have not been
converted to the guarded loop. They still use `Get-ChildItem -Path
"$PSScriptRoot\Classes"` with a literal backslash and no `Test-Path` guard,
which works on Linux only because PowerShell is forgiving about the separator
in a glob.

### `FunctionsToExport`

Every manifest lists its public functions explicitly rather than using `'*'`.
That is what makes the "exports every function the manifest promises" test in
each suite meaningful: the manifest is a claim, and the test checks it.

## Importing one

```powershell
Import-Module ClaudeCron
Get-Command -Module ClaudeCron
Get-Help Add-ClaudeCronPrompt -Full
```

Every function has comment-based help. `-Full` shows the parameters, the
examples and the notes.

While editing a module, `-Force` reloads it:

```powershell
Import-Module ClaudeCron -Force
```

## Testing

All six are covered — see [Testing](/docs/powershell/testing).

```powershell
./Invoke-Tests.ps1 -Path 'Claude Cron'
```
