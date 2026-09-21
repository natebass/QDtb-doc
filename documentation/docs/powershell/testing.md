---
title: "Testing and analysis"
description: "Invoke-Tests.ps1, the hermetic sandbox, and the PSScriptAnalyzer settings"
sidebar_label: "Testing"
sidebar_position: 3
---

# Testing and analysis

```powershell
./Invoke-Tests.ps1
```

That runs every module's Pester suite, checks that none of them touched
anything outside its sandbox, and lints the tree. One module at a time:

```powershell
./Invoke-Tests.ps1 -Path 'Claude Cron'
./Invoke-Tests.ps1 -SkipAnalyzer
```

Requires Pester 5+ and PSScriptAnalyzer:

```powershell
Install-Module Pester, PSScriptAnalyzer -Scope CurrentUser
```

## What hermetic means here

A test is hermetic when its result depends on nothing but the code under test.
Not on the directory it was started from, not on the machine's crontab or home
directory, not on the network, and not on someone being there to press a key.

That is a general principle, but here it came from specific damage. The
comments in the suites record it:

- **`QDtb.Utility`** called `Start-MyProject` for real. That fetches a
  hard-coded repository, starts `npm run dev` and `uv run fastapi dev` as
  background jobs, and then blocks on `Read-Host "Press Enter to exit"` — so
  running the tests **hung the whole run** until somebody noticed. Another
  test downloaded a file from the network onto a desktop.
- **`QDtb.SvgToReact`** writes `script.log` and creates `icon/` relative to the
  current directory, so its tests left both behind in whatever folder
  `Invoke-Pester` happened to be run from.
- **`ClaudeCron`** manages a real queue, a real crontab entry and a real
  systemd timer.
- **`DocumentationStation`** and **`PodcastDownload`** had their test files
  inside the source folder the module loader globs, so `Import-Module` ran the
  `Describe` blocks as a side effect of importing.

Every one of those is a boundary. The sandbox is how they are all moved.

## The sandbox

`Tests/TestSandbox.psm1` exports two functions, used from `BeforeAll` and
`AfterAll`:

```powershell
BeforeAll {
    Import-Module …/Tests/TestSandbox.psm1 -Force
    Import-Module (Join-Path $script:ModuleRoot 'QDtb.Utility.psd1') -Force
    $script:Sandbox = New-PesterSandbox -Name 'QDtb-utility'
}

AfterAll {
    Remove-Module QDtb.Utility -Force -ErrorAction SilentlyContinue
    Remove-PesterSandbox -Sandbox $script:Sandbox
    Remove-Module TestSandbox -Force -ErrorAction SilentlyContinue
}
```

### `New-PesterSandbox -Name <label>`

Creates `"$TEMP/pester-<label>-<8 hex chars>"` and then redirects four things
at it:

| Variable | Why |
|---|---|
| `HOME` | Anything resolving a path under the home directory writes here |
| `USERPROFILE` | The same, on Windows |
| `XDG_CONFIG_HOME` | `<sandbox>/home/.config` |
| `XDG_DATA_HOME` | `<sandbox>/home/.local/share` |

Then `Push-Location` into the sandbox, so anything written relative to the
current directory lands there too. The original values are kept on the
returned object, which is what `Remove-PesterSandbox` restores from.

The `-Name` is in the directory name on purpose: a sandbox left behind by an
interrupted run says which suite it came from.

### `Remove-PesterSandbox -Sandbox <object>`

`Pop-Location`, restore the four variables, delete the directory — and it
refuses to delete anything that is not obviously its own:

```powershell
$temp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$target = [System.IO.Path]::GetFullPath($Sandbox.Path)
if ($target.StartsWith($temp) -and (Split-Path $target -Leaf).StartsWith('pester-')) {
    Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction SilentlyContinue
}
else {
    Write-Warning "Refusing to remove '$target': it is not a sandbox this module created."
}
```

Both halves matter. Without them, a `Recurse -Force` delete driven by a
mangled path is how a cleanup step becomes data loss. It also accepts `$null`
and returns, so it is safe in an `AfterAll` that runs after a failure.

### ClaudeCron's extra guard

`ClaudeCron` does not use the shared sandbox — it redirects `CLAUDE_CRON_HOME`
instead — and then refuses to run at all until it has proved the redirect took:

```powershell
$resolvedRoot = (Get-ClaudeCronConfig).Root
if ($resolvedRoot -ne $script:TestHome) {
    throw "Refusing to run: ClaudeCron resolved its root to '$resolvedRoot', not the test directory …"
}
```

The reason is in the comment above it: these tests call
`Clear-ClaudeCronQueue -All`. If `CLAUDE_CRON_HOME` were not picked up — a
stale module still loaded, an ordering change, a typo in the variable name —
that call would empty the **real** queue. Checking before the first
destructive test is cheap; finding out afterwards is not.

## The fingerprint

`Invoke-Tests.ps1` does not take the suites' word for it. It takes a snapshot
of the machine state no test is allowed to change, before and after:

```powershell
function Get-HermeticFingerprint {
    $crontab = if (Get-Command crontab -CommandType Application -EA SilentlyContinue) {
        (& crontab -l 2>&1 | Out-String)
    } else { '(no crontab command)' }
    $units = Get-ChildItem "$HOME/.config/systemd/user" -Filter '*claude-cron*' …
    $store = Get-ChildItem "$HOME/.config/claude-cron" -Recurse -File …
    …
}
```

Three things: **the user's crontab**, **the systemd user units**, and **the
real ClaudeCron store**. If any of them differs afterwards, the run is
reported as non-hermetic and fails — whatever Pester thought of the
assertions:

```powershell
if ($leaks) { throw "Tests are not hermetic: they changed $($leaks -join ', ')." }
if ($results.FailedCount -gt 0) { throw "$($results.FailedCount) test(s) failed." }
```

The order is deliberate. A suite that quietly reaches outside its sandbox is a
problem worth failing over even when its tests pass.

It also counts strays — `pester-*` directories left in the temp directory —
which means a suite failed before its `AfterAll`, or does not have one. Those
are reported but do not fail the run.

The summary looks like this:

```text
========================================================================
Suites   : 6
Tests    : 118 passed, 0 failed, 0 skipped
Hermetic : yes - crontab, systemd units and the real store are untouched
Analyzer : 0 finding(s)
========================================================================
```

## Why the runner points at folders

```powershell
$suites = Get-ChildItem (Join-Path $root 'Modules') -Directory | … ForEach-Object {
    foreach ($folder in @('Test', 'Tests', 'Resources')) { … }
}
```

Pester is given each module's **test folder**, never the module tree. The
comment says why: the suites import their modules by path, and a stray
discovery pass over the module source is what used to make `Import-Module` run
the test files.

Three folder names are checked because the modules do not agree on one —
`Test/` in most, `Resources/` in `QDtb.SvgToReact` and `QDtb.TailwindToCSS`. A
folder only counts when it actually contains a `*.Tests.ps1`.

If nothing matches, the runner throws rather than reporting a clean run of
zero suites.

## Not `$ErrorActionPreference = 'Stop'`

There is a comment where that line would normally be:

> Pester and its mocks emit non-terminating errors as part of normal
> operation, and promoting those to exceptions makes unrelated tests fail
> inside the runner while passing under a plain `Invoke-Pester`.

Success is decided by the Pester result object at the end instead, which is
the thing that actually knows.

## PSScriptAnalyzer

```powershell
Invoke-ScriptAnalyzer -Path $root -Recurse -Severity Warning, Error `
    -Settings (Join-Path $root 'PSScriptAnalyzerSettings.psd1')
```

**The whole tree**, not just `Modules/`. The comment gives the reason:
`Scripts/` had 28 calls passing `-ForegroundColor` to `Write-Information`,
which that cmdlet does not accept, and nothing was looking at it.

`PSScriptAnalyzerSettings.psd1` excludes one rule:

```powershell
@{
    ExcludeRules = @(
        'PSAvoidUsingWriteHost'
    )
}
```

And it explains itself rather than just listing the rule:

> These modules are interactive console utilities: coloured output is the
> feature, and `Write-Host` is the only cmdlet that takes `-ForegroundColor`.
> The alternative was tried here already and did not work — the calls had been
> switched to `Write-Information` while keeping `-ForegroundColor`, which that
> cmdlet does not accept, so every one of those functions threw on its first
> line of output.

That is the same bug from two directions, and it is why the exclusion is an
exclusion rather than a fix.

`Invoke-ScriptAnalyzer` picks the settings file up automatically when run from
this folder; `Invoke-Tests.ps1` passes it explicitly so the result does not
depend on where you are standing.

Where a single call has to be exempted instead, the suppression is inline and
carries a justification:

```powershell
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
    Justification = 'Creates a disposable temp directory for a test run.')]
```

## Writing a new suite

1. Put it in `Modules/<Name>/Test/<Name>.Tests.ps1`. Not in the folder the
   module loader globs.
2. `BeforeAll`: import `Tests/TestSandbox.psm1`, import the module **by path**
   from `$PSScriptRoot`, then `New-PesterSandbox -Name '<short-label>'`.
3. `AfterAll`: `Remove-Module`, `Remove-PesterSandbox`, `Remove-Module
   TestSandbox`.
4. Mock every boundary — `git`, `Start-Job`, `Receive-Job`, `Read-Host`,
   `Invoke-WebRequest`, the location stack. What is left is the control flow,
   which is the part worth testing anyway.
5. Start with the two tests every suite here has: that the module exports
   every name its manifest promises, and that it exports anything at all. The
   second one exists because `QDtb.Utility`'s loader globbed `Functions/Public`
   while the folder was `Source/Public` — so the module imported cleanly and
   exported nothing whatsoever.
