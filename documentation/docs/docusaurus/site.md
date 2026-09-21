---
title: "The site"
description: "package.json, docusaurus.config.ts, the theme and the components"
sidebar_label: "The site"
sidebar_position: 3
---

# The site

Docusaurus 3.10.2, with the classic preset, one local plugin and a custom
theme layer.

## `documentation/package.json`

### The Docusaurus packages

| Package | Version | Role |
|---|---|---|
| `@docusaurus/core` | 3.10.2 | The framework |
| `@docusaurus/preset-classic` | 3.10.2 | Docs, blog, pages and the theme, bundled as one preset |
| `@docusaurus/theme-common` | 3.10.2 | Shared theme utilities, needed by the swizzled components |
| `@docusaurus/faster` | 3.10.2 | The Rust toolchain — Rspack instead of webpack, SWC instead of Babel, Lightning CSS instead of PostCSS |

`@docusaurus/faster` is opt-in, and it is turned on in the config:

```ts
future: {
  v4: true,
  faster: true,
},
```

The comment there explains the pair: `v4: true` already implies
`fasterByDefault`, and naming `faster` as well keeps the intent explicit and
matches the upstream recommendation. `v4` opts into Docusaurus v4's breaking
changes early, so the next major is not a migration.

### The theme

There is no third-party theme. `preset-classic` provides the layout, and
everything visual comes from:

- **`src/css/custom.css`** — 471 lines of Infima variable overrides plus
  component rules.
- **`src/theme/NotFound/`** — a swizzled 404 page, the only theme component
  replaced.
- **`prism-react-renderer`** — syntax highlighting, GitHub theme in light mode
  and Dracula in dark.

### Everything else

| Package | Used for |
|---|---|
| `@fortawesome/*` (5 packages) | Icons on the homepage |
| `nvim-docusaurus` | `workspace:*` — [the local plugin](/docs/docusaurus/nvim-docusaurus) |
| `clsx` | Conditional class names |
| `@mdx-js/react` | MDX runtime |
| `react`, `react-dom` | ^19 |
| `typescript` | ^7, dev only |

`"engines": { "node": ">=26" }`, and `"version": "1.0.2"` — the site is
versioned although nothing consumes the number.

## `docusaurus.config.ts`

### Site identity and URLs

```ts
url: process.env.URL || "https://natebass.github.io",
baseUrl: process.env.BASE_URL || "/qdtb-doc/",
trailingSlash: false,
organizationName: "natebass",
projectName: "QDtb-doc",
```

Both URLs read an environment variable first, which is what lets
[the deploy workflow](/docs/docusaurus/deployment) derive them from the
repository rather than hard-coding them. The defaults are the same values, so
a local build matches production.

`baseUrl` is `/qdtb-doc/` because the site is served from a project page
rather than a user page. It is why every internal link starts `/docs/…` and
Docusaurus prefixes it, and why `docusaurus serve` gives you
`localhost:3000/qdtb-doc/`.

### Strictness

```ts
onBrokenLinks: "throw",
onDuplicateRoutes: "throw",
onBrokenAnchors: "warn",
markdown: {
  format: "detect",
  hooks: {
    onBrokenMarkdownLinks: "throw",
    onBrokenMarkdownImages: "throw",
  },
},
```

Four of the five throw. `onBrokenAnchors` is the exception, and the config
says why: Docusaurus discovers anchors from Markdown headings only, so an `id`
set on JSX — `#usefulness-ratings` on the homepage — is reported as broken
although it resolves fine.

`markdown.format: "detect"` means `.md` is parsed as CommonMark and `.mdx` as
MDX. That is what lets the generated reference pages contain `<C-s>` and
`fun(): boolean` without escaping every angle bracket as JSX.

`onBrokenMarkdownLinks` moved from a top-level option into `markdown.hooks`;
the old spelling is deprecated.

### Fonts

```ts
headTags: [
  { tagName: "link", attributes: { rel: "preconnect", href: "https://fonts.googleapis.com" } },
  { tagName: "link", attributes: { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" } },
],
stylesheets: [
  { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400..900&family=JetBrains+Mono:wght@400..700&display=swap", … },
],
```

Inter for text, JetBrains Mono for code, and two decisions worth keeping:

- **Loaded from `<head>`, not through `@import` in `custom.css`.** An
  `@import` forces the browser to parse the site's CSS before it can even
  discover the font CSS, which serialises two round trips that could have been
  parallel. The `preconnect` pair opens the connections earlier still.
- **`wght@400..900` is a range, not a list.** That pulls one variable font per
  family instead of ten static weights, and makes intermediate weights such as
  450 render properly — which `custom.css` uses for sidebar links.

### The preset

```ts
presets: [["classic", {
  docs: { sidebarPath: "./sidebars.ts", editUrl: undefined },
  blog: { showReadingTime: true, editUrl: undefined },
  theme: { customCss: "./src/css/custom.css" },
}]],
```

`editUrl: undefined` removes the "Edit this page" links. Most of the interest
here is generated, and an edit link on a generated page points at something
that will be overwritten on the next build.

### Theme configuration

```ts
colorMode: { defaultMode: "dark", respectPrefersColorScheme: true },
docs: { sidebar: { hideable: true, autoCollapseCategories: true } },
tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
```

Dark by default, but `respectPrefersColorScheme` means the system preference
wins on a first visit. `autoCollapseCategories` matters for the
[Lua reference](/docs/reference), which is four levels deep.

The table of contents goes down to `h4`, which is what puts the per-option
headings on the [Options page](/docs/neovim/options) into the sidebar.

### Prism

```ts
additionalLanguages: ["lua", "bash", "json", "powershell", "vim", "toml", "diff"],
```

`prism-react-renderer` bundles JSON, YAML and TypeScript but not these. The
comment names the symptom: `powershell` is used throughout `docs/powershell/*`
and was rendering unhighlighted.

`fish` is **not** in the list, so the Fish snippets fall back to plain text.

### Navigation

Five sidebars, one per navbar entry:

| Sidebar | Navbar label | Source |
|---|---|---|
| `configSidebar` | Neovim | Explicit, plus an autogenerated `reference` category |
| `powershellSidebar` | PowerShell | Autogenerated from `docs/powershell` |
| `fishSidebar` | Fish | Autogenerated from `docs/fish` |
| `otherSidebar` | Other | Autogenerated from `docs/other` |
| `docusaurusSidebar` | Documentation | Autogenerated from `docs/docusaurus` |

The Neovim sidebar is explicit because its order is editorial — General,
Options, Keymaps, Plugins, Custom Plugins, Color Themes — and only the
generated reference at the end is autogenerated.

:::note[The reference category has no link]
```ts
{ type: "category", label: "Lua Reference", items: [{ type: "autogenerated", dirName: "reference" }] }
```

Deliberately no `link`. `docs/reference/index.md` is inside the autogenerated
directory and appears as its first item, so giving the category a doc link as
well would list that page twice.
:::

## `src/`

```text
src/
├── components/
│   ├── ColorPalette.tsx        swatch grid, click to copy
│   ├── ColorPreview.tsx        an older single-theme preview
│   ├── KeyboardMap/            the interactive keyboard
│   └── ThemeGallery/           the colour theme gallery
├── data/
│   ├── keymaps.ts              every mapping, by hand
│   └── theme-highlights.json   every scheme's real colours
├── pages/
│   ├── index.tsx               the homepage
│   ├── faq.tsx
│   └── privacy.tsx
├── theme/NotFound/             a swizzled 404
└── css/custom.css
```

`ColorPreview.tsx` predates the
[theme gallery](/docs/neovim/color-themes) and is no longer used by any page.
It derives syntax colours arithmetically from the background and foreground
rather than reading them from the scheme, which is what the gallery replaced.

### `custom.css`

Infima's variables first — the indigo primary, Inter and JetBrains Mono, an
8px radius — then two site-specific tokens deliberately prefixed so they
cannot collide with Infima's own:

```css
--qdtb-hero-background: #1a67c8;
--qdtb-surface-border: var(--ifm-color-emphasis-200);
```

Four of the rules below exist because something was wrong, and each says so:

- **`:focus-visible`** — Infima ships none, so keyboard focus was invisible on
  buttons, cards and hero links. That is WCAG 2.4.7.
- **`prefers-reduced-motion`** — Infima zeroes its own transition tokens, but
  not the smooth scrolling, transitions and transforms declared in this file.
- **The navbar blur sits on `::before`, not on `.navbar`.**
  `backdrop-filter` makes an element the containing block for its
  `position: fixed` descendants, and Docusaurus renders the mobile menu as a
  child of `.navbar` — so filtering the navbar collapsed the opened menu into
  a 60px box.
- **The theme-switch transition lists its selectors.** It used to be a `*`
  rule, which attached a transition to every node on the page — thousands on a
  long reference page — and made switching themes stutter.

`.hero__title` and `.hero__subtitle` use `clamp()` for fluid type, because
3.5rem wrapped onto three lines on a phone; the subtitle's colour is
`rgba(255,255,255,0.92)` rather than `opacity: 0.7`, which had dropped contrast
on the blue to 3.5:1.

## Static pages

Three pages outside the docs, at the site root:

| Route | File | Contents |
|---|---|---|
| `/` | `src/pages/index.tsx` | Hero, custom plugin cards, and features graded by who they are for |
| `/faq` | `src/pages/faq.tsx` | |
| `/privacy` | `src/pages/privacy.tsx` | Privacy policy for the plugins and PowerShell modules |

The homepage grades its feature list — "1. Intended for the public", and so on
— which is the honest framing for a personal configuration published in the
open.
