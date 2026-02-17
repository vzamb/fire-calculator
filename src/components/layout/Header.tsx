import { useState } from 'react';
import { Moon, Sun, RotateCcw, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useFireStore } from '@/store/fireStore';
import { useT } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/types';
import { generateShareUrl } from '@/lib/sharing';

export function Header() {
  const { theme, setTheme, resetInputs, locale, setLocale, currency, setCurrency, inputs } = useFireStore();
  const t = useT();
  const [copied, setCopied] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleShare = async () => {
    const url = generateShareUrl(inputs);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    // Clean hash from URL silently
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
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
          <div>
            <h1 className="text-base font-bold tracking-tight">
              {t.appTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1">
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
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
