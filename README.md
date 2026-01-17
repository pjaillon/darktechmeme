# darktechmeme

Safari Web Extension that applies a dark-mode theme to techmeme.com on macOS (and iOS via the iOS app target).

Example:

<img width="50%" height="50%" alt="image" src="https://github.com/user-attachments/assets/2d316be1-605a-43c3-a41a-32f8f07f8491" />

## Project layout
- `darktechmeme/` — web extension source (manifest, CSS, icons)
- `darktechmeme-safari/` — Xcode project wrapper for Safari Extension app

## Run locally (macOS)
1) Open `darktechmeme-safari/darktechmeme/darktechmeme.xcodeproj`.
2) Select the `macOS (App)` scheme and your Mac as the destination.
3) Set Signing & Capabilities for `macOS (App)` and `macOS (Extension)` with your Team.
4) Run the app, then enable the extension in Safari -> Settings -> Extensions.

## Run on iPhone
1) Select the `iOS (App)` scheme and your connected device.
2) Set Signing & Capabilities for `iOS (App)` and `iOS (Extension)` with your Team.
3) Run on device, then enable the extension in iOS Settings -> Safari -> Extensions.

## App Store
See `darktechmeme-safari/APP_STORE_CHECKLIST.md` for submission steps.

## Disclaimer
- This project is not affiliated with Techmeme, Apple, or any third-party sites linked on Techmeme.
- “Techmeme” and related marks are property of their respective owners.
- Use at your own risk; you are responsible for complying with all relevant terms of service. 
