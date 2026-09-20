import React, { type ReactNode } from "react";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import styles from "./privacy.module.css";

const LAST_UPDATED = "September 20, 2026";

export default function Privacy(): ReactNode {
  return (
    <Layout
      title="Privacy Policy"
      description="Privacy policy for the QDtb Neovim plugins and PowerShell modules"
    >
      <main className={styles.privacyContainer}>
        <div className={styles.privacyHeader}>
          <Heading as="h1">Privacy Policy</Heading>
          <p className={styles.updated}>Last updated: {LAST_UPDATED}</p>
        </div>

        <section className={styles.section}>
          <Heading as="h2" id="scope">
            Scope
          </Heading>
          <p>
            This policy covers my custom code including but not limited to the
            Neovim plugins and PowerShell modules
          </p>
        </section>

        <section className={styles.section}>
          <Heading as="h2" id="what-is-collected">
            What the QDtb code collects
          </Heading>
          <p>
            Nothing. The QDtb Neovim plugins and PowerShell modules contain no
            analytics, telemetry, crash reporting, or usage tracking. They do
            not create accounts, and they do not send your code, keystrokes,
            file names, shell history, or machine identifiers anywhere.
          </p>
          <p>
            Any data these plugins and modules read or write stays on your own
            machine.
          </p>
        </section>

        <section className={styles.section}>
          <Heading as="h2" id="network">
            Network access
          </Heading>
          <p>
            The QDtb code makes network requests for installing Neovim plugins
            from GitHub and Emacs from Melpa.
          </p>
        </section>

        <section className={styles.section}>
          <Heading as="h2" id="third-party">
            Third-party software
          </Heading>
          <p>Known third-party libraries that collect data are:</p>
          <ul>
            <li>
              <b>WakaTime</b> — records coding activity and sends it to
              WakaTime's servers. See the{" "}
              <a
                href="https://wakatime.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                WakaTime privacy policy
              </a>
              .
            </li>
            <li>
              <b>GitHub Copilot for Vim and Neovim</b> — sends editor context to
              GitHub/Microsoft to generate completions. See the{" "}
              <a
                href="https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Microsoft Copilot privacy documentation
              </a>
              .
            </li>
          </ul>
          <p>
            Other bundled plugins are not known to track users or collect data.
            Remove the plugins you do not want before installing.
          </p>
        </section>

        <section className={styles.section}>
          <Heading as="h2" id="this-site">
            The website
          </Heading>
          <p>
            This site is a static Docusaurus build hosted on GitHub Pages. It
            sets no tracking cookies and runs no analytics. Fonts are loaded
            from Google Fonts, and GitHub Pages and Google may log requests
            (including IP addresses) as part of serving the site.
          </p>
        </section>

        <section className={styles.section}>
          <Heading as="h2" id="changes">
            Changes
          </Heading>
          <p>
            If this policy changes, the date at the top of this page changes
            with it. The history is in the site's Git repository.
          </p>
        </section>

        <section className={styles.section}>
          <Heading as="h2" id="contact">
            Contact
          </Heading>
          <p>
            Questions about this policy, or a privacy or security concern, can
            go to{" "}
            <a href="mailto:nate.bass@outlook.com">nate.bass@outlook.com</a>.
          </p>
        </section>
      </main>
    </Layout>
  );
}
