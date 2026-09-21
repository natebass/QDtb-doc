---
title: "Deployment"
description: "The GitHub Actions workflow that builds and publishes the site"
sidebar_label: "Deployment"
sidebar_position: 6
---

# Deployment

The site is published to GitHub Pages at
[natebass.github.io/qdtb-doc](https://natebass.github.io/qdtb-doc/) by
[`.github/workflows/deploy.yml`](https://github.com/natebass/QDtb-doc/blob/master/.github/workflows/deploy.yml).

Two jobs: **Build** produces the static site and uploads it as an artifact;
**Deploy** publishes that artifact. They are separate because the second needs
permissions the first should not have.

## When it runs

```yaml
on:
  push:
    branches: [master]
    paths-ignore:
      - "README.md"
      - "AGENTS.md"
      - "CLAUDE.md"
  workflow_dispatch:
```

Every push to `master`, except when the only files changed are the three at
the top of the repository that are not part of the site. `workflow_dispatch`
adds a manual **Run workflow** button, which is how you redeploy without an
empty commit.

`paths-ignore` is an allowlist by omission: a push touching `README.md` **and**
anything else still builds. It only skips when *every* changed file matches.

## Permissions and concurrency

```yaml
permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false
```

The three permissions are the minimum GitHub Pages deployment needs.
`contents: read` is notably **not** `write` — this workflow never pushes a
commit. That is the difference between the modern Pages deployment and the old
`gh-pages` branch approach, which `pnpm deploy` still implements for manual
use.

`id-token: write` is for OIDC: `deploy-pages` proves the workflow's identity
to the Pages service rather than using a token.

`cancel-in-progress: false` is the right setting for a deployment, and the
opposite of what you want for tests. Cancelling a half-finished deploy can
leave the site in a state that matches neither commit; letting the runs queue
means each finishes and the last one wins.

## The build job

```yaml
- uses: actions/checkout@v7
  with:
    fetch-depth: 0
```

`fetch-depth: 0` fetches the full history rather than the default shallow
clone. Docusaurus reads git history for last-updated timestamps, and a shallow
clone gives every file the same date.

```yaml
- name: Install pnpm and Node
  uses: pnpm/setup@v2.1.0
  with:
    cache: true
    require-lockfile: true
```

One step for both. `cache: true` restores the pnpm store between runs, which
is most of the difference between a one-minute build and a three-minute one.
`require-lockfile: true` fails the run if `pnpm-lock.yaml` is missing or out
of date with the manifests, so CI cannot silently resolve different versions
from a local install.

Node's version comes from the `engines` and `devEngines` fields in the root
`package.json` — `>=26` — rather than from a `node-version` input here.

```yaml
- name: Build plugin
  run: pnpm build-plugin

- name: Build website
  env:
    BASE_URL: /${{ github.event.repository.name }}/
    URL: https://${{ github.repository_owner }}.github.io
  run: pnpm build
```

**`build-plugin` first.** `documentation` depends on `nvim-docusaurus` as
`workspace:*`, whose `main` points at `dist/index.js`. Without this step
Docusaurus cannot load the plugin, and the error names a missing module rather
than a missing build.

**The two environment variables are derived, not hard-coded.**
`docusaurus.config.ts` reads them:

```ts
url: process.env.URL || "https://natebass.github.io",
baseUrl: process.env.BASE_URL || "/qdtb-doc/",
```

So a fork builds with its own owner and repository name and works at its own
Pages URL, with no configuration change. The defaults in the config are the
same values, so a local build matches production.

```yaml
- uses: actions/upload-pages-artifact@v5
  with:
    path: ./documentation/build
```

`documentation/build`, not the repository root — the site is one package in a
workspace.

## The deploy job

```yaml
deploy:
  needs: build
  environment:
    name: github-pages
    url: ${{ steps.deployment.outputs.page_url }}
  steps:
    - uses: actions/deploy-pages@v5
      id: deployment
```

It has no `checkout` and no build: it takes the artifact the previous job
uploaded and publishes it. `needs: build` is what makes that ordering real.

The `environment` block is what puts the live URL on the run summary and in
the repository's Environments tab. `github-pages` is also where a required
reviewer or a branch restriction would be configured, if this ever needed one.

## Requirements on the repository

GitHub Pages must be set to **Source: GitHub Actions** in
`Settings → Pages`. With the older "Deploy from a branch" setting,
`deploy-pages` fails with a permissions error that does not say the source is
wrong.

## Deploying by hand

```bash
pnpm deploy
```

That is `docusaurus deploy`, which builds and pushes to the `gh-pages` branch
— a different mechanism from the one above, requiring `contents: write` and a
`GIT_USER`. It is kept because `preset-classic` provides it, not because it is
used.

To redeploy the current `master` without changing anything, use the
**Run workflow** button instead.

## When a deploy fails

| Symptom | Cause |
|---|---|
| `Cannot find module 'nvim-docusaurus'` | The `Build plugin` step failed or was skipped |
| `Docusaurus found broken links` | A link to a page that does not exist. The log lists both ends — it is [strict on purpose](/docs/docusaurus/site#strictness) |
| Lockfile errors in the install step | `require-lockfile: true` and `pnpm-lock.yaml` is out of date. Run `pnpm install` locally and commit the result |
| `deploy-pages` permissions error | Pages is not set to deploy from GitHub Actions |
| The site builds but links 404 | `BASE_URL` — check it ends with a slash and matches the repository name |

Reproduce a CI build locally with the same environment:

```bash
BASE_URL=/qdtb-doc/ URL=https://natebass.github.io pnpm build
pnpm serve
```
