---
title: "ClaudeCron"
description: "Queue Claude prompts and shell commands, and run them on a schedule or when quota comes back"
sidebar_label: "ClaudeCron"
sidebar_position: 10
---

# ClaudeCron

> Queue Claude prompts and shell commands to run at a time, on an interval, or
> as soon as the AI quota resets.

By a distance the largest module here — around 2,600 lines across nine files —
and the only one with a README of its own. This page is the shape of it; the
[module README](https://github.com/natebass/QDtb/blob/master/powershell/Modules/Claude%20Cron/README.md)
is the manual, and it goes much further on scheduling, cron syntax and keeping
a laptop awake.

## The problem

You run out of quota at 11pm with three things you still wanted Claude to do.
Queue them, go to bed, and the worker sends them the moment the window resets.

## Install

The module is already on `$env:PSModulePath` through the
[profile](/docs/powershell#the-module-path), so an import is enough:

```powershell
Import-Module ClaudeCron
Set-ClaudeCronConfig -ClaudeCommand /home/nwb/.local/bin/claude
```

Point `ClaudeCommand` at an **absolute** path — a scheduled run has a much
shorter `PATH` than a login shell — and at the `~/.local/bin/claude` symlink
rather than the versioned binary it resolves to, so a CLI update does not
leave the config pointing at a version that is gone.

Sign in once before queueing anything. A scheduled run cannot complete a login
prompt.

## How it works

Nothing runs on a timer inside the module. A scheduler — cron, a systemd
timer, or the built-in worker loop — calls `Invoke-ClaudeCronQueue`, and that
one call does everything:

1. If the queue is paused for a quota reset that has not happened yet, it
   returns immediately.
2. Otherwise it collects every job whose `RunAfter` has passed, ordered by
   `Priority` then age, and runs them **one at a time**.
3. A prompt job runs `claude --print --permission-mode auto <prompt>` in the
   job's working directory. Everything it prints, on both streams, is appended
   to that job's log.
4. Exit 0 → `Done`, or rescheduled if it repeats. Any other exit → the attempt
   counter goes up, the job is pushed back a few minutes, and after
   `MaxAttempts` it becomes `Failed`. Quota exhaustion does not count as an
   attempt — see [below](#quota-handling).

A lock file stops two drains overlapping, so cron firing every ten minutes
while a long job runs is safe: the second drain notices the lock, logs that it
is skipping, and exits.

## Quick start

```powershell
# Whenever quota is next available.
Add-ClaudeCronPrompt 'Add Pester tests for QDtb.SvgToReact' -Name svg-tests -WorkingDirectory ~/src/QDtb

# At a time tonight.
Add-ClaudeCronPrompt 'Write release notes from the last 20 commits' -At '23:30'

# On an interval, or a cron expression.
Add-ClaudeCronPrompt 'Triage new GitHub issues' -Cron '0 8 * * 1-5'
Add-ClaudeCronCommand 'git -C ~/src/QDtb pull --ff-only' -Every 1h

Get-ClaudeCronJob | Format-Table Id, Name, Status, RunAfter, RunCount
Get-ClaudeCronStatus
Invoke-ClaudeCronQueue
Get-ClaudeCronLog svg-tests -Tail 40
```

Three aliases cover what you type most: `ccadd`, `ccq` and `ccrun`.

## The files

| File | Lines | Holds |
|---|---|---|
| `Functions/Private/Store.ps1` | 324 | Paths, config and state on disk, job read/write, ids, timestamps, history |
| `Functions/Private/Runner.ps1` | 451 | Process invocation, quota and auth detection, the lock |
| `Functions/Private/Schedule.ps1` | 221 | The cron parser, interval parsing, next-run arithmetic |
| `Functions/Private/Log.ps1` | 126 | Logging, rotation, desktop notifications |
| `Functions/Public/Queue.ps1` | 567 | `Add-`, `Get-`, `Set-`, `Remove-`, `Clear-`, `Get-…Log` |
| `Functions/Public/Worker.ps1` | 370 | `Invoke-…Queue`, `Start-…Worker`, `Get-…Status`, stale-job recovery |
| `Functions/Public/Install.ps1` | 385 | The crontab block and the systemd unit |
| `Functions/Public/Configuration.ps1` | 120 | `Get-`/`Set-ClaudeCronConfig` |
| `Functions/Public/Quota.ps1` | 91 | `Get-`/`Set-`/`Clear-ClaudeCronQuota` |
| `Functions/Public/Aliases.ps1` | 5 | `ccadd`, `ccq`, `ccrun` |

## Command reference

| Command | What it does |
|---|---|
| `Add-ClaudeCronPrompt` | Queue a Claude prompt. `-At`, `-Every`, `-Cron`, `-Model`, `-WorkingDirectory`, `-Priority`, `-MaxRuns`, `-ClaudeArgs` |
| `Add-ClaudeCronCommand` | Queue a shell command. Same switches, plus `-Shell pwsh\|sh` |
| `Get-ClaudeCronJob` | List jobs. Filter by name or id, `-Status`, `-Due` |
| `Set-ClaudeCronJob` | Change a job in place: reschedule, re-prioritise, `-Enable`, `-Disable` |
| `Remove-ClaudeCronJob` | Delete a job and its log |
| `Clear-ClaudeCronQueue` | Drop finished jobs, or `-All` |
| `Get-ClaudeCronLog` | A job's captured output, or the module log with no argument. `-Tail`, `-Wait` |
| `Invoke-ClaudeCronQueue` | Run everything due. `-Limit`, `-Identity`, `-Force` |
| `Start-ClaudeCronWorker` | Poll in the foreground until Ctrl+C |
| `Get-ClaudeCronStatus` | Counts by state, quota block, next run, installed schedulers |
| `Get-`/`Set-`/`Clear-ClaudeCronQuota` | Inspect, set or lift the quota pause |
| `Get-`/`Set-ClaudeCronConfig` | Read and write settings |
| `Install-`/`Uninstall-ClaudeCronSchedule` | The crontab entry |
| `Install-`/`Uninstall-ClaudeCronTimer` | The systemd user timer |
| `Get-ClaudeCronSchedule` | Which schedulers are installed |
| `Get-ClaudeCronDrainCommand` | The exact command line a scheduler should run |

Everything that changes state supports `-WhatIf`, including both installers —
use it to see the crontab block or unit file before writing it.

## Configuration

`Set-ClaudeCronConfig` writes `~/.config/claude-cron/config.json`.

| Setting | Default | Notes |
|---|---|---|
| `ClaudeCommand` | `claude` | Make this absolute for scheduled runs |
| `DefaultClaudeArgs` | `--print --permission-mode auto` | What makes an unattended run possible |
| `DefaultModel` | *(empty)* | Passed as `--model` when set |
| `DefaultWorkingDirectory` | `~/Desktop` | Per-job `-WorkingDirectory` overrides it |
| `PollSeconds` | `300` | How often `Start-ClaudeCronWorker` drains |
| `QuotaResetHours` | `5` | Fallback pause when the CLI reports no reset time |
| `MaxAttempts` | `3` | Retries before a job is `Failed` |
| `JobTimeoutMinutes` | `60` | Longer runs are killed and recorded as exit 124 |
| `NotifyCommand` | *(empty)* | e.g. `notify-send "{title}" "{message}"` |
| `MaxLogSizeMB` | `5` | `claude-cron.log` rotates past this; `0` disables |

`{title}` and `{message}` are handed to the shell **as arguments** rather than
pasted into the command, so a job name containing `$(...)`, backticks or `&`
is treated as text and never executed.

`CLAUDE_CRON_HOME` moves the whole data directory. Both installers resolve the
root at install time and write it into the crontab block or unit file, because
neither cron nor systemd inherits the `XDG_CONFIG_HOME` your shell may have
set — without that, the scheduler would quietly drain a different queue from
the one you can see.

:::warning[The working directory is the blast radius]
`--permission-mode auto` lets Claude work unattended, which is the point of
the queue. Everything under `DefaultWorkingDirectory`, or a per-job
`-WorkingDirectory`, can be rewritten by a run nobody is watching. Point it at
somewhere you would be comfortable restoring from git or a backup, rather than
at `$HOME`.
:::

:::note[cron has no session bus]
`notify-send` from a crontab drain has nothing to talk to. Use the systemd
timer if you want desktop notifications — it runs inside your login session.
:::

## Quota handling

The feature the module exists for. When a prompt job fails and its output
looks like a quota or rate limit, the runner:

- puts the job **straight back on the queue** as `Pending`, without spending a
  retry attempt;
- pauses the whole queue until the reset time;
- abandons the rest of that drain, so twenty queued prompts do not each burn a
  failed call against a limit that is already gone.

The reset time comes from the CLI's machine-readable sentinel
(`Claude AI usage limit reached|<unix seconds>`) when present; failing that, a
wall-clock time in the message ("resets at 6pm"); failing both,
`QuotaResetHours` from now.

`Start-ClaudeCronWorker` sleeps until a minute past the reset rather than
waking every five minutes to do nothing.

You can drive the pause yourself:

```powershell
Set-ClaudeCronQuota -In 5h        # or -Until '18:00'
Get-ClaudeCronQuota               # Blocked, BlockedUntil, Remaining
Clear-ClaudeCronQuota
Invoke-ClaudeCronQueue -Force     # ignore the pause for one drain
```

Only prompt jobs can trigger the pause. A command job that exits non-zero is
just a failed command, even if its output mentions a rate limit.

### A signed-out CLI is handled differently

An expired login looks like a failure on every job, but it is not transient
and it is not a quota window — nothing will succeed until a human signs in. So
the job keeps its full retry budget and the drain stops after the first
failure, rather than marching through the queue turning it into `Failed`.

No pause is set, because there is no reset time to wait for. The next drain
tries again, which picks the queue back up on its own once you have logged in.

## Scheduling

Pick one. Running cron **and** the systemd timer means they fight over the
lock and log a lot of "another worker holds the lock".

| Option | Command | Best for |
|---|---|---|
| crontab | `Install-ClaudeCronSchedule -Cron '*/10 * * * *'` | A machine that is always on |
| systemd user timer | `Install-ClaudeCronTimer -OnCalendar '*:0/10'` | **Recommended** — `Persistent=true` catches up after a suspend |
| A worker you watch | `Start-ClaudeCronWorker -PollSeconds 120` | Setting up, or a supervised session |

The crontab installer only ever touches the lines between its own markers, and
if `crontab -l` fails for any reason other than "no crontab for \<user\>", the
install is abandoned rather than writing a crontab containing only its own
block.

The systemd option is recommended for one reason: if the timer's window was
missed because the machine was asleep, systemd fires it as soon as the machine
comes back. Cron does not catch up. Enable lingering so the timer survives
logout:

```bash
loginctl enable-linger $USER
```

The README's
[Keeping Linux Mint awake](https://github.com/natebass/QDtb/blob/master/powershell/Modules/Claude%20Cron/README.md#keeping-linux-mint-awake)
section covers the other half of that problem — a queued job cannot run on a
suspended machine.

## Files on disk

Everything under `~/.config/claude-cron`, or `$CLAUDE_CRON_HOME`:

```text
config.json              settings written by Set-ClaudeCronConfig
state.json               quota block and last drain time
queue/*.json             one file per job — readable, and safe to delete by hand
logs/<id>.log            captured output per job, one appended block per run
logs/claude-cron.log     what the module itself did (rotated at MaxLogSizeMB)
logs/cron.log            whatever the scheduled command printed
history.jsonl            one line per finished run, kept after jobs are cleared
worker.lock              JSON: pid, start time and host of the drain in progress
```

`config.json`, `state.json` and the job files are written to a temp sibling and
renamed into place, so a crash or a concurrent read never sees a half-written
file.

`logs/cron.log` is written by the shell redirection in the crontab line, not
by the module, so `MaxLogSizeMB` does not reach it.

### The lock is not just a pid

`worker.lock` records the pid **and the moment that process started**, and the
module compares both. A pid alone is not enough: pids get reused, and a
recycled one would make a dead lock look alive forever. Locks it can prove are
stale, it clears.

A job stuck on `Running` means a worker was killed mid-run. The next drain
notices, counts an attempt, and puts the job back to `Pending` by itself.

## Tests

43 tests covering the cron parser, interval parsing, quota and auth detection,
the job lifecycle, retries and the quota pause. They run against a throwaway
`CLAUDE_CRON_HOME` and never call the Claude CLI, so they cost no quota.

This suite has a guard the others do not — it refuses to start until it has
proved the redirect took hold, because its tests call
`Clear-ClaudeCronQueue -All`. See
[Testing](/docs/powershell/testing#claudecrons-extra-guard).
