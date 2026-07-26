# Rallysh Firebase setup

The Firebase web configuration has been connected to `index.html`.

## Console steps still required

1. Firebase Console > Authentication > Sign-in method > enable **Email/Password**.
2. Firestore Database > Rules: replace the rules with `firebase-firestore.rules` and publish.
3. Storage > Rules: replace the rules with `firebase-storage.rules` and publish.
4. Add a billing budget alert in Google Cloud Billing.

## Google sign-in

The **Continue with Google** button works in the browser/PWA version of Rallysh after Google is enabled in Firebase Authentication.

Google deliberately blocks OAuth inside Android WebViews. For the Play Store build, a native Android update must use Firebase Authentication with Android Credential Manager, register `com.gauravsigmano1.rallysh` as an Android app in Firebase, add the upload and Play App Signing SHA-1/SHA-256 fingerprints, download `google-services.json`, and rebuild. Do not try to force the browser popup inside the WebView.

## Important launch limitation

Profile data, match posts, and photos now save to Firebase. A pending score does not change a rating in this client build.

Final match approval and ranking updates must be performed by a trusted Cloud Function, not the mobile app. Deploying Cloud Functions requires the Blaze plan and a Firebase CLI environment. Until that function is built, keep the app in closed testing and do not describe the ranking as verified.

The share URL uses `https://rallysh.web.app`. Set up Firebase Hosting on that domain before using opponent approval links. The Android app must then be rebuilt and signed because the UI is bundled into the app.
