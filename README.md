# Darktechmeme

Dark Techmeme applies a focused dark theme to techmeme.com so reading is easier on your eyes on both desktop Safari and mobile Safari.
### Focused Contrast
- Headline hierarchy and links remain clear while backgrounds and side areas shift to a comfortable dark palette.
### Mac + iPhone Ready
- Install once from the App Store and enable it in Safari Extensions on Mac and iPhone.
### Lightweight
- Targets only Techmeme pages with minimal overhead and no unnecessary controls.


### Example:

<img width="60%" height="60%" alt="s2" src="https://github.com/user-attachments/assets/edd13075-3d85-45d8-94e0-f3f286c5f32b" />
<img width="60%" height="60%" alt="s1" src="https://github.com/user-attachments/assets/02eceeff-9508-4df3-8b64-246cefb64acf"/>
<br>
<img width="30%" height="30%" alt="i1" src="https://github.com/user-attachments/assets/b37bd1fa-2b84-4766-b6ac-0fea885d3c2c" />


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

## Disclaimer
- This project is not affiliated with Techmeme, Apple, or any third-party sites linked on Techmeme.
- “Techmeme” and related marks are property of their respective owners.
- Use at your own risk; you are responsible for complying with all relevant terms of service. 
