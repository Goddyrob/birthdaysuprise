# Dearli Android preparation — 1.0.0

Status: Debug APK builds and USB-device tests have been performed. The private-link API fix was deployed and verified against production. Release signing, broader device testing, advertising account/privacy setup and Play review remain outstanding.

Optional creator-only AdMob rewards are implemented; see ADMOB_PRIVACY.md for actual SDK data handling, consent flow, test/release IDs and required disclosures. Debug builds use Google test IDs. Do not develop with live ads.

## Confirm before release
- Website/API: https://dearli.vercel.app (taken from existing project metadata; owner must confirm).
- Provisional application ID: net.godswillrobwet.dearli. Confirm before first Play upload; changing it later creates a different app.
- Version: 1.0 / versionCode 1; target and compile SDK 36, minimum SDK 24.
- Owner admin dashboard remains a website tool; native cross-origin admin cookies have deliberately not been enabled.

## Backend deployment and shared UI
The Android-origin CORS fix was deployed to the existing Vercel project and verified. New shared UI changes still require a separate reviewed deployment if browser recipients should show them. Public /api/surprises endpoints now allow https://localhost, Capacitor Android's local origin. No admin CORS access is granted. Keep Supabase service credentials on the server. Set VITE_PUBLIC_ORIGIN and VITE_API_ORIGIN before building if the real domain differs. Also update the manifest host and native URL checks when changing domains.

## Build on your computer
Install Node 22+ and Android Studio 2025.2.1+ with SDK 36 and the Gradle-compatible JDK.
1. npm ci
2. npm run android:sync
3. npm run android:open
4. In Android Studio, allow Gradle sync and install requested SDK/build tools.
5. Test on a real Android phone and emulator.
6. Build > Generate Signed App Bundle / APK > Android App Bundle.
7. Choose your existing upload key if this app already exists in Play Console. For a new app, create and securely back up an upload keystore locally. Do not send passwords or private keys in chat.
8. Select release. Upload app-release.aab from app/build/outputs/bundle/release to Play Console's internal test track first.

## Website links
The manifest and JavaScript handle https://dearli.vercel.app/surprise/<uuid>.
Automatic verified opening additionally needs your website to serve /.well-known/assetlinks.json containing the final application ID and the Play App Signing SHA-256 certificate fingerprint. Configure after app signing enrollment. Until verification succeeds, links may open in the browser.

## Required device checks
Create a surprise, upload photos/audio, close and reopen drafts, copy and open a shared link, unlock with correct/incorrect codes, run every animated scene, test audio interruption/resume, Android back, keyboard, system bars, small screens, slow/offline connections, and expired media URLs. Verify private content remains locked. Confirm release signing and launch without a development server.

## Play Console completion
Supply a public privacy-policy URL covering actual collection, storage, retention, deletion requests and support contact. Complete Data safety using the real backend behavior; the app transmits user photos, audio and message content, so do not declare no collection without checking Google's definitions. Supply store icon (512x512), feature graphic (1024x500), real phone screenshots, description, support contact, target audience, content rating and reviewer access instructions. Review policies for user-generated content against the sharing model before release. If account creation is added, implement applicable account deletion requirements. No payment system has been added.
New personal developer accounts may need a closed test with 12 continuously opted-in testers for 14 days before applying for production access. Google decides publication approval.

## Suggested listing copy
Name: Dearli
Short description: Create personal surprises with photos, music and heartfelt messages.
Description: Turn meaningful moments into a personal digital surprise. Customize a letter, add favourite photos and music, and share a private passcode-protected experience with someone special. Explore playful lamp and cake interactions and a floating memory gallery. Internet is required for cloud sharing and media.

## Outstanding owner information
Confirm live website and working API, final package identity, new or existing Play Console app, privacy-policy/support details, and signing setup. This source ZIP is not the file to upload to Play Console.
