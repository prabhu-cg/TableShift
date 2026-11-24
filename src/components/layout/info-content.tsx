/** Shared copy for the About, Privacy and Terms drawers (header and footer). */

export function AboutContent() {
  return (
    <>
      <p>
        TableShift helps product and UX designers find better mobile layouts for existing desktop data
        tables. Paste a screenshot of a table and it suggests the three mobile patterns that fit best,
        with the reasoning.
      </p>
      <p>
        An AI vision model reads the table structure from your screenshot. TableShift&rsquo;s own rules
        then score five responsive patterns, so the same table always gets the same recommendations. You
        can correct any detected column before relying on the result.
      </p>
      <p>No accounts, no dashboards. Paste a screenshot and go.</p>
    </>
  );
}

export function PrivacyContent() {
  return (
    <>
      <p>
        A screenshot is sent to the configured external AI provider only when you select Analyse
        screenshot, so the model can read the table. Until then it stays in your browser tab.
      </p>
      <p>
        TableShift doesn&rsquo;t store your screenshot, doesn&rsquo;t write it to logs and doesn&rsquo;t use
        it for training. The provider handles it under its own terms, so avoid screenshots that contain
        confidential or personal data.
      </p>
      <p>
        There are no accounts, no analytics and no cookies. The only thing TableShift saves in your
        browser is your light or dark theme preference.
      </p>
    </>
  );
}

export function TermsContent() {
  return (
    <>
      <p>TableShift is provided as-is, free of charge, with no warranty of any kind.</p>
      <p>
        You&rsquo;re responsible for the screenshots you analyse and how you use the results. The
        extracted table and the recommendations are guidance, so always review them before relying on
        them.
      </p>
      <p>The tool may change, break or go offline at any time without notice.</p>
    </>
  );
}
