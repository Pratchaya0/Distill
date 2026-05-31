# Changelog

All notable changes to Distill are documented here.

## [1.0.0] - 2026-05-31

### ✨ Features

- MediaRecorder mic capture with live scrolling waveform visualiser
- Screen/tab audio capture via `getDisplayMedia` (web only)
- Groq API pipeline: Whisper-large-v3 transcription + Llama 3.3-70b processing
- AI outputs: executive summary, action items (persistent checkboxes), mind map
- Thai/English language toggle per recording (defaults to Thai 🇹🇭)
- Rich-text notes (Tiptap editor) with image attachments anchored to timestamps
- Clickable transcript segments seek the audio player
- Custom prompt template editor with 5 built-in templates
- SAP Horizon design system — fully responsive with mobile bottom nav + top bar
- Dark mode support (Evening Horizon palette)
- Server-side API proxy routes for web — keys never exposed in the client bundle
- Dexie.js IndexedDB storage — fully local, zero server cost
- **Android APK via Capacitor** — distributable APK, no server or auth needed
- Wake Lock keeps screen on during recording
- `@capacitor/preferences` secure storage for API keys on native
- Podman/Docker multi-stage Containerfile + `compose.yaml`
- MIT License — free and open source
- GitHub Actions CI/CD: APK + GHCR image built and attached on every release tag
