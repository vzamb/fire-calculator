import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, RotateCcw, Share2, Check, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useFireStore } from '@/store/fireStore';
import { useT } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/types';
import { generateShareUrl } from '@/lib/sharing';

export function Header() {
  const { theme, setTheme, resetInputs, locale, setLocale, currency, setCurrency, inputs } = useFireStore();
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleShare = async () => {
    const url = generateShareUrl(inputs);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Logo & title */}
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

        {/* ─── Desktop controls (sm and up) ─── */}
        <div className="hidden sm:flex items-center gap-1">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="EUR">€ EUR</option>
            <option value="USD">$ USD</option>
            <option value="GBP">£ GBP</option>
            <option value="CHF">CHF</option>
          </select>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="en">🇬🇧 English</option>
            <option value="it">🇮🇹 Italiano</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-muted-foreground text-xs"
          >
            {copied ? (
              <><Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /><span className="text-emerald-500">{t.linkCopied}</span></>
            ) : (
              <><Share2 className="w-3.5 h-3.5 mr-1" />{t.shareResults}</>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetInputs}
            className="text-muted-foreground text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            {t.reset}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>

        {/* ─── Mobile controls (below sm) ─── */}
        <div className="flex sm:hidden items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground h-9 w-9"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Overflow menu */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-muted-foreground h-9 w-9"
              aria-label="Menu"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border bg-card shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
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
                    onChange={(e) => setLocale(e.target.value as Locale)}
                    className="mt-1 w-full h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="it">🇮🇹 Italiano</option>
                  </select>
                </div>

                <div className="border-t border-border my-1" />

                {/* Share */}
                <button
                  onClick={() => { handleShare(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                >
                  {copied ? (
                    <><Check className="w-4 h-4 text-emerald-500" /><span className="text-emerald-500">{t.linkCopied}</span></>
                  ) : (
                    <><Share2 className="w-4 h-4 text-muted-foreground" />{t.shareResults}</>
                  )}
                </button>

                {/* Reset */}
                <button
                  onClick={() => { resetInputs(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                  {t.reset}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
