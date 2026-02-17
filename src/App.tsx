import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { InputPanel } from '@/components/layout/InputPanel';
import { ResultsDashboard } from '@/components/results/ResultsDashboard';
import { useFireStore } from '@/store/fireStore';
import { I18nContext, getTranslations } from '@/lib/i18n';
import { extractSharedInputs } from '@/lib/sharing';

function App() {
  const { theme, setTheme, locale, setInputs } = useFireStore();
  const t = getTranslations(locale);

  // Apply theme on mount
  useEffect(() => {
    setTheme(theme);
    // Check for shared inputs in URL
    const shared = extractSharedInputs();
    if (shared) {
      setInputs(shared);
      // Clean the hash
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <I18nContext.Provider value={t}>
    <div className="min-h-screen bg-background">
      {/* Decorative background gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-orange-500/5 via-red-500/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-500/5 via-violet-500/5 to-transparent blur-3xl" />
      </div>

      <Header />

      <main className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Inputs Panel */}
          <aside className="w-full lg:w-[380px] lg:shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
            <InputPanel />
          </aside>
          {/* Right: Results */}
          <div className="flex-1 min-w-0">
            <ResultsDashboard />
          </div>
        </div>
      </main>
    </div>
    </I18nContext.Provider>
  );
}

export default App;
