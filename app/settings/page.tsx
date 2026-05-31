'use client';

import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface EnvStatus {
  groqEnvSet: boolean;
}

interface ApiKeyFieldProps {
  label: string;
  storageKey: string;
  placeholder: string;
  helpUrl: string;
  envActive?: boolean;
}

function ApiKeyField({ label, storageKey, placeholder, helpUrl, envActive }: ApiKeyFieldProps) {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setValue(localStorage.getItem(storageKey) ?? '');
  }, [storageKey]);

  const save = () => {
    if (value.trim()) {
      localStorage.setItem(storageKey, value.trim());
    } else {
      localStorage.removeItem(storageKey);
    }
    toast.success(`${label} saved.`);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {label}
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
          title="Get API key"
        >
          <Info className="w-3.5 h-3.5" />
        </a>
      </Label>

      {envActive && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Key loaded from <code className="font-mono text-xs">GROQ_API_KEY</code> environment variable — no manual entry needed.
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={envActive ? 'Optional override (leave blank to use .env key)' : placeholder}
            className="pr-10 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button onClick={save} className="gap-2">
          <Save className="w-4 h-4" />
          Save
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Stored only in your browser&apos;s localStorage. The server-side API routes prefer the{' '}
        <code className="font-mono">.env</code> key; localStorage is the fallback.
      </p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);

  useEffect(() => {
    fetch('/api/env-status')
      .then((r) => r.json())
      .then(setEnvStatus)
      .catch(() => setEnvStatus({ groqEnvSet: false }));
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* SAP page header */}
      <div className="px-4 md:px-8 py-4 border-b border-border bg-card">
        <h1 className="text-base font-semibold">Settings</h1>
        <p className="text-xs text-muted-foreground">API keys and storage preferences</p>
      </div>

      <div className="px-4 md:px-8 py-6 max-w-2xl space-y-4">
        {/* API Keys panel */}
        <div className="border border-border bg-card rounded-sm">
          <div className="px-4 py-2.5 border-b border-border bg-muted/30">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Provider Keys</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Proxied server-side — key stays out of the client bundle.
            </p>
          </div>
          <div className="p-4 space-y-5">
            <ApiKeyField
              label="Groq API Key (Recommended)"
              storageKey="groq_api_key"
              placeholder="gsk_..."
              helpUrl="https://console.groq.com/keys"
              envActive={envStatus?.groqEnvSet}
            />
            <Separator />
            <ApiKeyField
              label="OpenAI API Key (Fallback)"
              storageKey="openai_api_key"
              placeholder="sk-..."
              helpUrl="https://platform.openai.com/api-keys"
            />
          </div>
        </div>

        {/* Storage info panel */}
        <div className="border border-border bg-card rounded-sm">
          <div className="px-4 py-2.5 border-b border-border bg-muted/30">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Storage</h2>
          </div>
          <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type</span>
            <span>IndexedDB (local browser storage)</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Data ownership</span>
            <span>100% yours — no server involved</span>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
