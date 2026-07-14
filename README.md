# Ace Rank

Ace Rank is a mobile-first tennis ranking demo for friendly clubs, social groups, and informal ladders. Log singles or doubles matches, calculate an Elo-style rating, share a court photo and venue, and follow the match feed.

## Demo features

- Singles and doubles match logging
- Eight tennis scoring formats, including tiebreak-only formats
- Elo-style ratings with experience-based K-factors and score-margin adjustments
- Animated win and loss results
- Top-three podium and full player rankings
- Recent five-match activity feed
- Court photo uploads and location/venue tagging
- Like and comment controls in the feed (prototype interaction)
- Browser-local storage for demo data

## Run locally

Download or clone this repository, then open `index.html` in a modern browser.

For camera and location permissions, use a hosted HTTPS version instead of opening the file directly.

## Publish with GitHub Pages

1. Create a GitHub repository.
2. Upload `index.html`, `README.md`, `manifest.webmanifest`, `service-worker.js`, and `ace-rank-icon.svg` to the repository root.
3. In the repository, open **Settings** → **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/(root)` folder, then save.
6. Open the GitHub Pages URL that GitHub provides on your phone.

## Install on iPhone

1. Open the GitHub Pages URL in **Safari** (not a browser shortcut created from Chrome).
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Delete the old Ace Rank shortcut, then launch the new Home Screen app.

The updated app is configured as a standalone Progressive Web App, so it opens without Safari/Chrome navigation bars. It must be served over HTTPS (GitHub Pages provides this) for the install and offline cache to work.

## Rating model

All players start at a rating of 1200. Ratings use the Elo expected-score formula, a K-factor based on matches played, and a margin-of-victory multiplier. Doubles ratings are calculated from team averages, then split between teammates.

## Prototype notes

This is a single-device demo, not a production service. Match results, photos, likes, and comments are stored only in the browser’s local storage. It does not yet include accounts, shared data, opponent confirmation, moderation, real comments, or a backend.

Court-location lookups use the browser’s location permission and OpenStreetMap’s Nominatim reverse-geocoding service when available. Players can always type a venue name manually.

## Privacy

Location and photo sharing should be opt-in in a production release. Avoid exposing a private home address or any sensitive location in a public post.
