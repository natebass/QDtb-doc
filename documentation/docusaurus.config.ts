import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "QDtb documentation",
  tagline: "Personal developer environment documentation",
  favicon: "img/favicon.ico",
  future: {
    // `v4: true` implies `fasterByDefault`; naming Faster as well keeps the
    // intent explicit and matches the upstream recommendation to pair them.
    v4: true,
    faster: true,
  },
  url: process.env.URL || "https://natebass.github.io",
  baseUrl: process.env.BASE_URL || "/qdtb-doc/",
  trailingSlash: false,
  organizationName: "natebass",
  projectName: "QDtb-doc",
  onBrokenLinks: "throw",
  // Stays at "warn": Docusaurus only discovers anchors from Markdown headings,
  // so an `id` set on JSX (e.g. #usefulness-ratings on the homepage) is
  // reported as broken even though it resolves fine in the browser.
  onBrokenAnchors: "warn",
  onDuplicateRoutes: "throw",
  markdown: {
    format: "detect",
    // Top-level `onBrokenMarkdownLinks` is deprecated in favour of this hook.
    hooks: {
      onBrokenMarkdownLinks: "throw",
      onBrokenMarkdownImages: "throw",
    },
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  // Loaded from <head> rather than via `@import` in custom.css, which forced
  // the browser to parse our CSS before it could even discover the font CSS.
  // The `wght@a..b` ranges pull one variable font per family instead of ten
  // static weights, and make intermediate weights (e.g. 450) render properly.
  headTags: [
    {
      tagName: "link",
      attributes: { rel: "preconnect", href: "https://fonts.googleapis.com" },
    },
    {
      tagName: "link",
      attributes: {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: "anonymous",
      },
    },
  ],
  stylesheets: [
    {
      href: "https://fonts.googleapis.com/css2?family=Inter:wght@400..900&family=JetBrains+Mono:wght@400..700&display=swap",
      rel: "stylesheet",
      type: "text/css",
    },
  ],
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: undefined,
        },
        blog: {
          showReadingTime: true,
          editUrl: undefined,
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  plugins: ["nvim-docusaurus"],
  themeConfig: {
    image: "img/logo.jpeg",
    colorMode: {
      defaultMode: "dark",
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
    navbar: {
      logo: {
        alt: "QDtb Logo",
        src: "img/logo.jpeg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "configSidebar",
          position: "left",
          label: "Neovim",
        },
        {
          type: "docSidebar",
          sidebarId: "powershellSidebar",
          position: "left",
          label: "PowerShell",
        },
        {
          type: "docSidebar",
          sidebarId: "fishSidebar",
          position: "left",
          label: "Fish",
        },
        {
          type: "docSidebar",
          sidebarId: "otherSidebar",
          position: "left",
          label: "Other",
        },
        {
          type: "docSidebar",
          sidebarId: "docusaurusSidebar",
          position: "left",
          label: "Documentation",
        },
        { to: "/faq", position: "right", label: "FAQ" },
        {
          href: "https://github.com/natebass/QDtb",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Introduction",
              to: "/docs",
            },
            {
              label: "Lua Reference",
              to: "/docs/reference",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/natebass/QDtb",
            },
            {
              label: "FAQ",
              to: "/faq",
            },
            {
              label: "Privacy Policy",
              to: "/privacy",
            },
          ],
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      // prism-react-renderer bundles json/yaml/typescript but not these.
      // `powershell` in particular is used by docs/powershell/* and was
      // rendering unhighlighted.
      additionalLanguages: [
        "lua",
        "bash",
        "json",
        "powershell",
        "vim",
        "toml",
        "diff",
      ],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
