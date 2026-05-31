# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**distill** — A personal, free-to-run AI voice recorder and multimodal note-taking web app inspired by Plaud Note. Built with Next.js 14 App Router, Tailwind CSS, shadcn/ui, and Dexie.js (IndexedDB). AI features use the Groq API (Whisper + Llama 3) with user-supplied API keys stored in localStorage.

## Commands

```bash
# Local dev (requires Node 22+)
npm run dev        # Start Next.js dev server (http://localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npm run type-check # tsc --noEmit

# Releases (run on main with a clean working dir)
npm run release         # Interactive — prompts for version bump
npm run release:patch   # 1.0.0 → 1.0.1  (bug fixes)
npm run release:minor   # 1.0.0 → 1.1.0  (new features)
npm run release:major   # 1.0.0 → 2.0.0  (breaking changes)
# Requires GITHUB_TOKEN env var with repo + write:packages scopes.
# Pushing the tag triggers .github/workflows/release.yml which builds
# and pushes the GHCR image automatically.

# Container (Podman) — production image
podman build -t distill .         # Build image using Containerfile
podman run -p 3000:3000 distill   # Run it

# Or with podman-compose
podman-compose up --build           # Build + start
podman-compose down                 # Stop

# Android APK (requires Android SDK at ~/Android/Sdk + openjdk-21-jdk)
npm run build:capacitor   # static export → cap sync android
npm run android:apk       # build debug APK → android/app/build/outputs/apk/debug/app-debug.apk
npm run android:release   # build release APK (must be signed separately)
npm run android:open      # open in Android Studio
# Note: Gradle requires GRADLE_OPTS=-Dorg.gradle.java.home=/usr/lib/jvm/java-21-openjdk-amd64
# This is baked into the android:apk and android:release scripts above.
```

`next.config.ts` uses `output: 'standalone'` so the container copies only the minimal `.next/standalone` tree — no `node_modules` in the final image.

## Architecture

### Storage
All user data lives in **IndexedDB via Dexie.js** (`lib/db.ts`). No backend server. The Dexie schema has three tables: `recordings` (metadata + blobs), `notes` (rich-text + image attachments keyed by recordingId + timestamp), `settings` (API keys, templates). API keys are stored in `localStorage` (never in IndexedDB or sent anywhere other than the respective AI API).

### AI Pipeline (`lib/ai/`)
Two-step pipeline, both calls go client-side to Groq:
1. `transcribe.ts` — sends audio blob to Groq Whisper-large-v3 → returns timestamped transcript segments
2. `process.ts` — sends transcript to Llama 3 with one of three prompt templates → returns `{ summary, actionItems, mindMap }` as structured JSON

Templates are stored in Dexie `settings` table and editable in Settings UI.

### Audio Capture (`lib/audio/`)
- `recorder.ts` — wraps `MediaRecorder` API for mic recording; emits waveform amplitude data via a callback for the visualizer
- `screenCapture.ts` — wraps `getDisplayMedia({ audio: true })` for meeting/tab audio capture
- Both produce a single `Blob` (webm/opus) handed to the AI pipeline

### App Router Layout
```
app/
  layout.tsx          # Root layout: sidebar + main content area
  page.tsx            # Redirects to /recordings
  recordings/
    page.tsx          # Dashboard: list of all recordings
    [id]/
      page.tsx        # Detail view: player + transcript (left) + AI tabs (right)
  settings/
    page.tsx          # API key management + template editor
  favorites/
    page.tsx          # Filtered view of starred recordings
components/
  recorder/           # WaveformVisualizer, RecordButton, ModeToggle
  player/             # AudioPlayer with clickable timestamp seek
  transcript/         # TranscriptView with highlighted active segment
  ai/                 # SummaryPanel, ActionItemsList, MindMapView
  notes/              # RichTextEditor, ImageAttachment
  ui/                 # shadcn/ui re-exports (do not edit directly)
lib/
  db.ts               # Dexie schema and typed table helpers
  audio/              # recorder.ts, screenCapture.ts
  ai/                 # transcribe.ts, process.ts, prompts.ts
```

### Key Patterns
- **No server components for data** — all data fetching is in client components using Dexie hooks (`useLiveQuery`). Server components are used only for static shell/layout.
- **API keys** — read from `localStorage` key `groq_api_key` (and optionally `openai_api_key`). The Settings page writes them. Never passed through any server route.
- **Timestamps** — transcript segments carry `start`/`end` in seconds; the audio player exposes `currentTime`; `TranscriptView` highlights the matching segment via a `useSyncedTranscript` hook.
- **Mind Map** — rendered as nested `<ul>` with CSS indent + connecting lines, parsed from LLM-returned markdown outline. No external mindmap library.
