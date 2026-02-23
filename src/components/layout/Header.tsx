import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, RotateCcw, Share2, Check, Settings2, Github } from 'lucide-react';
import { useFireStore } from '@/store/fireStore';
import { useUIStore } from '@/store/uiStore';
import { useT } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/types';
import { generateShareUrl } from '@/lib/sharing';

const GITHUB_URL = 'https://github.com/vzamb/fire-calculator';
const BMC_URL = 'https://buymeacoffee.com/vzamb';

export function Header() {
  const { resetInputs, inputs } = useFireStore();
  const { theme, setTheme, locale, setLocale, currency, setCurrency } = useUIStore();
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const handleShare = async () => {
    const url = generateShareUrl(inputs);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [settingsOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto flex h-14 items-center justify-between px-4 sm:px-6">

        {/* ─── Logo & title ─── */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8">
            <img
              src="/fire.svg"
              alt="FIRE"
              className="w-5 h-5 opacity-90 saturate-[0.8] contrast-95 brightness-110"
              loading="eager"
              decoding="async"
            />
          </div>
          <h1 className="text-base font-bold tracking-tight">
            {t.appTitle}
          </h1>
        </div>

        {/* ─── Right controls ─── */}
        <div className="flex items-center gap-2">

          {/* GitHub — icon + label on desktop, icon-only on mobile */}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-secondary/50 transition-colors"
            aria-label="View on GitHub"
          >
            <Github className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          {/* Buy Me a Coffee — branded yellow button */}
          <a
            href={BMC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold bg-[#FFDD00] text-[#0d0d0d] hover:bg-[#f0cf00] transition-colors shrink-0"
          >
            ☕ Buy me a coffee
          </a>

          {/* Settings dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              aria-label="Settings"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-secondary/50 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {settingsOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-border bg-card shadow-xl py-2 z-50">

                {/* Currency */}
                <div className="px-3 py-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.currency}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1 w-full h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="EUR">€ EUR</option>
                    <option value="USD">$ USD</option>
                    <option value="GBP">£ GBP</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>

                {/* Language */}
                <div className="px-3 py-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Language
                  </label>
                  <select
                    value={locale}
                    onChange={(e) => { setLocale(e.target.value as Locale); }}
                    className="mt-1 w-full h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="it">🇮🇹 Italiano</option>
                  </select>
                </div>

                <div className="border-t border-border my-1" />

                {/* Theme */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                >
                  {theme === 'dark'
                    ? <><Sun className="w-4 h-4 text-muted-foreground" /> Light mode</>
                    : <><Moon className="w-4 h-4 text-muted-foreground" /> Dark mode</>
                  }
                </button>

                {/* Share */}
                <button
                  onClick={() => { handleShare(); setSettingsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                >
                  {copied
                    ? <><Check className="w-4 h-4 text-emerald-500" /><span className="text-emerald-500">{t.linkCopied}</span></>
                    : <><Share2 className="w-4 h-4 text-muted-foreground" />{t.shareResults}</>
                  }
                </button>

                {/* Reset */}
                <button
                  onClick={() => { resetInputs(); setSettingsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                  {t.reset}
                </button>

                <div className="border-t border-border my-1 sm:hidden" />

                {/* Buy Me a Coffee — shown in menu on mobile only */}
                <a
                  href={BMC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:hidden w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                  onClick={() => setSettingsOpen(false)}
                >
                  <span>☕</span> Buy me a coffee
                </a>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
