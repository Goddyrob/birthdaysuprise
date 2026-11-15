# Dearli Soft UI and creation policy

## Design

`src/soft-ui.css` owns the pearl/blush surfaces, burgundy accent, raised/inset/pressed states, focus treatment and responsive layout. Georgia and the system sans stack are the two type families. Existing handwritten styles map to Georgia italics. `SoftUI.tsx` supplies the completion checklist and field errors; `DearliIcons.tsx` contains editable SVG primitives. The gallery retains its dark scene. No new dependency or framework is introduced.

Main text is dark on pearl; secondary text and placeholders use darker muted colors. Shadows supplement visible boundaries and labels. Icon targets use explicit equal dimensions, and gallery captions remain wrapping controlled textareas with stable photo keys. Reduced motion and forced-colors overrides are included.

## New creation requirements

Shared policy: `shared/creationValidation.js`. Applied before frontend upload and in backend creation, never on legacy metadata/unlock reads.

- Recipient and sender: nonblank, at most 100 characters, replacing the known sample names.
- Passcode: 4–12 digits. A fresh creator starts with an empty passcode.
- At least one creator-selected image: supported local image data or an owned persisted storage reference. Bundled illustrations and arbitrary remote demo URLs do not satisfy this check. Existing storage-ownership validation still applies.
- Letter: title, greeting and closing, plus an original message with at least 20 non-space characters, at most 12 paragraphs. Known sample paragraphs do not count toward completion. This length rule is a practical completion check, not a semantic assessment of sentiment.
- Music, photo captions and seal colors remain optional. Existing decorative scene defaults remain valid.

When only gallery images are supplied, the first personal image becomes the submitted cover without replacing the local draft. Valid local inputs can begin submission; media upload happens next, then persistence, then the link is shown. Upload receipts and stable creation IDs retain retry/idempotency behavior. Required-content errors retain work, select the relevant tab and focus the first invalid control. Old drafts can still reopen; incomplete/sample drafts must be personalized before creating a new link. Existing links are not revalidated.

## AdMob

See `ADMOB_PRIVACY.md`. The owner confirmed the production unit is Rewarded on 15 November 2026. Debug always uses Google sample IDs; production IDs remain release-only. Consent-test device/geography overrides are empty. Creator seal rewards are optional; recipients have no placement. No live ad was requested or clicked during development.

`public/app-ads.txt` includes the owner-provided authorized seller. The developer domain confirmed by the owner is `https://godswillrobwet.netlify.app`, so its root `/app-ads.txt` is authoritative for store crawling. A copy was committed to that portfolio repository. A successful repository commit alone does not prove Netlify deployed it or AdMob verified it. Verify the public plain-text response, store listing and subsequent AdMob crawl status. Google documents a wait of at least 24 hours: https://developers.google.com/admob/android/next-gen/app-ads .

## Verification commands

```sh
npm run lint
node --test tests/*.test.mjs
npm run build -- --configLoader native
npx cap sync android
# Build android/app debug in Android Studio with existing wrapper/JDK.
```

On restricted PowerShell use `npm.cmd`. Browser regressions use an installed Playwright runtime via `DEARLI_PLAYWRIGHT_MODULE`, Chrome at `DEARLI_CHROME` (the harness currently uses the standard Windows Chrome path), `DEARLI_TEST_URL` and `DEARLI_TEST_OUTPUT`; run `node tests/soft-ui.browser.cjs` against the built preview. Browser API routes in this harness are explicitly mocked; they do not prove production persistence. Separate device verification uses clearly marked synthetic records and restores the original device draft.

Observed results, APK fingerprint, deployment state and unexecuted checks are recorded in the delivered test report. Release signing, production privacy-message configuration, Play disclosures and app-link verification remain separate release work.
