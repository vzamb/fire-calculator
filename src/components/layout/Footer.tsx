import { Github } from 'lucide-react';

const GITHUB_URL = 'https://github.com/vzamb/fire-calculator';
const BMC_URL = 'https://buymeacoffee.com/vzamb';

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background/80 mt-auto">
      <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-6 gap-4">
        <p className="text-sm text-muted-foreground">
          Built by{' '}
          <a
            href="https://github.com/vzamb"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-foreground transition-colors"
          >
            Valerio Zamboni
          </a>
        </p>

        <div className="flex items-center gap-4">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
          <a
            href={BMC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5"
          >
            <span>☕</span>
            Buy me a coffee
          </a>
        </div>
      </div>
    </footer>
  );
}
