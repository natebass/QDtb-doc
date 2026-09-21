---
title: "Scripts"
description: "fish/scripts, and why nothing in it runs automatically"
sidebar_label: "Scripts"
sidebar_position: 6
---

# Scripts

`fish/scripts/` is outside every directory Fish loads from. Nothing here runs
at startup, nothing is autoloaded, and nothing is on `$PATH`. It is a place
for scripts you run — or source — deliberately.

There is one.

## `pgvariables.fish`

Sets the five `PG*` environment variables `psql`, `pg_dump` and every
libpq-based client read, so a session can talk to a database without a
connection string on every command.

```bash
source fish/scripts/pgvariables.fish
```

It runs in three passes:

1. **Report.** Prints the current value of `PGUSER`, `PGDATABASE`, `PGHOST`
   and `PGPORT`, or `[Not Set]`. `PGPASSWORD` is reported as
   `[Set - Hidden]` — it says whether there is one, never what it is.
2. **Prompt.** Reads new values with `read -P`. The password uses `read -s`,
   so it is not echoed, and is followed by a bare `echo` to end the line the
   silent read left open.
3. **Apply.** Defaults `PGHOST` to `localhost` and `PGPORT` to `5432` when
   left blank, then exports all five with `set -gx`.

| Variable | Read by | Default if blank |
|---|---|---|
| `PGUSER` | every libpq client | — |
| `PGPASSWORD` | every libpq client | — |
| `PGDATABASE` | every libpq client | — |
| `PGHOST` | every libpq client | `localhost` |
| `PGPORT` | every libpq client | `5432` |

:::warning[Source it, do not run it]
```bash
./fish/scripts/pgvariables.fish   # does nothing useful
source fish/scripts/pgvariables.fish
```

The shebang at the top (`#!/usr/bin/env fish`) makes the file look runnable,
but `set -gx` sets variables in the shell that executes it. Running it starts
a *child* shell, which exits immediately and takes the variables with it. Only
`source` affects the shell you are sitting in.
:::

:::note[`PGPASSWORD` in the environment]
Every process the shell starts inherits it, and on Linux the environment of a
process is readable through `/proc` by the same user. For a local development
database that is usually fine. For anything else, PostgreSQL's own
[`~/.pgpass`](https://www.postgresql.org/docs/current/libpq-pgpass.html) file
— mode `0600`, one line per host — is the mechanism intended for the job, and
libpq reads it with no environment variable at all.

There is a PowerShell counterpart to this script,
`powershell/Scripts/Set-PgEnv.ps1`.
:::

## Adding a script

Anything that should be a *command* belongs in
[`fish/functions/`](/docs/fish/functions), one function per file named after it — Fish
autoloads those, so they cost nothing until called.

`fish/scripts/` is for the other case: something you want to keep with the
configuration, run occasionally, and deliberately *not* have loaded into every
shell.
