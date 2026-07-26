# Rallysh â€” Play Console release checklist

## Build and security

- [ ] Build a signed `app-release.aab`; do not upload a raw HTML file.
- [ ] Use package `com.gauravsigmano1.rallysh` only after checking it is available.
- [ ] Set `versionCode` to `1` for the first upload and increase it on every update.
- [ ] Target Android API 36 for a 2026 submission.
- [ ] Configure Play App Signing.
- [ ] Test camera, media upload, location opt-in, and sharing on physical Android devices.

## Store listing

- [ ] Paste content from `google-play-listing.md`.
- [ ] Replace every support-email and domain placeholder.
- [ ] Upload a 512 Ã— 512 PNG app icon.
- [ ] Upload a 1024 Ã— 500 feature graphic.
- [ ] Upload at least two real Android phone screenshots.
- [ ] Host `privacy-policy.html` on a public HTTPS URL and enter that URL in Play Console.

## App content and policy declarations

- [ ] Declare the correct target age group; Rallysh should normally target adults/teens, not children.
- [ ] Declare whether the app contains ads (choose â€œNoâ€ unless ads are actually added).
- [ ] Complete Data safety based on the production backend, not this browser-only demo.
- [ ] Declare optional camera/photos and location access only if the native wrapper requests them.
- [ ] Provide Play review login details and steps to reach profile, match creation, and approval flows.
- [ ] Ensure the production backend actually enforces opponent approval before changing rankings.

## Testing and launch

- [ ] Create an internal test release first.
- [ ] If the Play developer account is a personal account created after November 13, 2023, complete the required closed test with 12 opted-in testers for 14 continuous days.
- [ ] Test the signed AAB through Play internal testing before production rollout.
- [ ] Start with a staged production rollout.
