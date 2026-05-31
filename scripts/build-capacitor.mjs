#!/usr/bin/env node
/**
 * Capacitor static export build.
 *
 * Next.js `output: 'export'` does not support server-side API routes.
 * The Capacitor WebView calls Groq directly (see lib/ai/groqClient.ts),
 * so the API proxy routes are not needed in the native build.
 *
 * This script temporarily moves app/api out of the way, runs the static
 * export, syncs with Capacitor, then restores app/api — even on failure.
 */

import { execSync } from 'child_process';
import { renameSync, existsSync } from 'fs';
import { join } from 'path';

const root = new URL('..', import.meta.url).pathname;
const apiDir = join(root, 'app/api');
const apiTemp = join(root, '.api_hidden'); // outside app/ so Next.js won't scan it

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: root });
}

// Stash API routes
if (existsSync(apiDir)) {
  renameSync(apiDir, apiTemp);
  console.log('→ Stashed app/api (not needed in native build)');
}

try {
  run('NEXT_BUILD_TARGET=capacitor npx next build');
  run('npx cap sync android');
  console.log('\n✓ Capacitor build complete. Open Android Studio with: npm run android:open');
} finally {
  // Always restore — never leave the repo in a broken state
  if (existsSync(apiTemp)) {
    renameSync(apiTemp, apiDir);
    console.log('→ Restored app/api');
  }
}
