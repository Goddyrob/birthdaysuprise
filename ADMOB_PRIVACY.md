# Dearli optional rewarded ads

Integration reviewed against official Google and Capacitor documentation on 15 November 2026.

## Implementation

- Capacitor 8.6.2 local Android plugin (`DearliAdsPlugin`), registered by `MainActivity`.
- Google GMA Next-Gen SDK 1.6.0 and UMP 4.0.0. Existing Gradle 8.14.3, AGP 8.13.0, JDK 21, min SDK 24 and compile/target SDK 36 are retained.
- `android/admob.properties` is the central build configuration. Debug uses Google's sample App ID and rewarded unit; release binds the owner's production IDs. IDs cannot be supplied by the web layer. Never install or use a release build for ad development/testing.
- Exactly one placement: an adult creator can opt to complete a rewarded ad to unlock sage and antique-gold envelope seals on that device. Wine remains free. New links require an explicit envelope-style choice, including the free Wine option; they never require watching an ad. No banner, interstitial, app-open or receiver placement exists. No preloader/mediation adapters are configured.
- Native `OnUserEarnedRewardListener` alone persists the cosmetic entitlement. Native sessions prevent duplicate credit; dismiss/fail/cancel/timeout callbacks cannot grant it. The reward is local, non-monetary and non-transferable. Server-side reward verification is not configured or needed for this local cosmetic; do not reuse this mechanism for balances or paid goods.
- Existing drafts, submission, sharing, media and receiver journeys have no ad dependency.

## Consent and privacy choices

Creators self-confirm 18+ before using the optional ad. This is self-confirmation, not verified age. Children/under-age users can use standard features without requesting ads. The owner must still choose and comply with the actual Play target-audience/Families settings; this UI does not establish policy compliance.

No ad SDK initialization, ad request or consent form is triggered by recipient screens. The native bridge may be registered there, but its load routine only obtains the local UMP object. On a new eligible creator session, UMP consent information is refreshed for a previous adult opt-in. On the first explicit opt-in, the refresh happens before the required consent form. Consent is managed by UMP, not by a copied/locally invented consent string.

`canRequestAds()` gates both initialization and loading. Required consent forms finish before initialization, which runs on a background thread. No form/consent/load failure grants a reward. A failed optional flow displays recovery text and leaves standard actions available. Eligible cached UMP choices may be used after a refresh failure as Google documents.

Consent forms are loaded separately from presentation so cancellation cannot show a late form. The network timeout pauses while a person reads the form; it resumes for ad loading after a choice. The debug-only `DearliAdsTest` bridge can reset sample-app UMP choices for testing; it cannot grant rewards and is absent from release source sets. Temporary registered-device/EEA overrides were used for consent testing and are empty in the delivered normal debug configuration.

Creator Settings includes an **Ad privacy options** entry only when UMP reports it required. Opening it calls UMP's privacy-options form. There are no cached/preloaded ads to invalidate after a changed choice, and a subsequent request rechecks UMP. Configure and publish the applicable European/UK/Swiss and US-state messages in AdMob Privacy & messaging for the production App ID. A production consent form cannot be validated with the shared Google debug App ID; verify production-account configuration with registered test devices before release, without requesting live ads during development.

## Actual SDK data and app data

Google documents SDK collection/sharing of IP address (potential approximate location), ad/app interactions, diagnostics and device/account identifiers for advertising, analytics and fraud prevention. Removing advertising-ID access does not mean no SDK data is collected. UMP sends/retains information needed to determine and store applicable consent choices. Consult the SDK disclosures linked below when filling Play forms.

The app manifest removes `com.google.android.gms.permission.AD_ID`. The merged debug manifest was inspected: no AD_ID permission; SDK dependencies add network-state/basic-phone-state/wake-lock/foreground-service and library receiver permissions. No runtime location, contacts or phone-number permission is requested by this integration. Review the final release merged manifest and SDK versions again before publication.

Dearli does not pass names, photos, audio, letters, passcodes, surprise IDs, custom targeting data or an SSV user ID into ad requests. Its existing Supabase upload/sharing behavior remains separate. The local ad preferences retain the adult opt-in flag, seal entitlement, completion identifier and count; UMP retains its own choices. Uninstalling/clearing app storage removes local unlock data. Existing draft/media retention and cloud-deletion procedures still need to be stated accurately in the public app privacy policy.

## Privacy policy / Play release checklist

- Publish an accurate, publicly accessible Dearli privacy policy with owner support/deletion contact and actual backend retention/deletion details. Do not claim a public policy is deployed merely because this note exists.
- In Play Console declare **Contains ads**. Optional rewarded ads still count as ads.
- Review Data safety for app user-provided photos/audio/messages and SDK approximate location, interactions, diagnostics and identifiers. Declare relevant collection/sharing/purposes and actual optionality; do not answer “no data collected” or “anonymous” based only on removed AD_ID permission.
- Configure AdMob app/store association, applicable privacy messages, serving readiness, rewarded-unit reward description, and app-ads.txt where required. These account-side settings were not silently changed.
- Confirm target audience, content rating and ad-content settings; do not assume this adult opt-in replaces legal/Play obligations.
- Review the final release manifest/dependency versions, keep production IDs release-only, and complete release signing, Play testing and review. Never share private signing keys/passwords in chat.
- Deploy the shared seal-color rendering changes to the web frontend if browser recipients must display the extra colors; existing deployed recipients otherwise retain the standard appearance. The backend's JSON configuration already preserves the optional field; no database migration is required.

## Official sources

- https://developers.google.com/admob/android/next-gen/quick-start
- https://developers.google.com/admob/android/next-gen/rewarded/single-load
- https://developers.google.com/admob/android/next-gen/privacy
- https://developers.google.com/admob/android/next-gen/privacy/play-data-disclosure
- https://capacitorjs.com/docs/plugins/android

Device observations, unexecuted checks and APK details belong in the delivered AdMob test report; documentation is not a claim that all tests passed.
