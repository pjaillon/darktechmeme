# Mac App Store checklist for darktechmeme

## Xcode project
- Set a unique bundle ID for `macOS (App)` and `macOS (Extension)` targets.
- Ensure both targets use the same Team and Automatic signing.
- Confirm version and build numbers in `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`.
- Verify icons are correct in `Shared (App)/Assets.xcassets/AppIcon.appiconset`.
- Build and run the `macOS (App)` target once to confirm the extension loads in Safari.

## App Store Connect
- Create a new app record with the macOS bundle ID.
- Set category to Utilities (matches `LSApplicationCategoryType` in the project).
- Add app description, keywords, support URL, and privacy policy URL.
- Upload screenshots (Mac desktop) that show the extension enabled and in use.
- Configure App Privacy (data collection typically "No" for this extension).

## Archive and upload
- Product -> Archive in Xcode.
- Distribute App -> App Store Connect -> Upload.
- Resolve any validation issues from Xcode/Transporter.

## Submit for review
- Add “Notes for Review” explaining this is a Safari Extension for techmeme.com dark mode.
- Submit the build for review.
