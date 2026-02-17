import { useState, useEffect } from 'react';
import { useFireStore } from '@/store/fireStore';
import { useT } from '@/lib/i18n';
import { Save, Trash2, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FireInputs } from '@/types';

interface SavedProfile {
  id: string;
  name: string;
  inputs: FireInputs;
  savedAt: number;
}

const STORAGE_KEY = 'fire-calculator-profiles';

function loadProfiles(): SavedProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles: SavedProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function ProfileManager() {
  const { inputs, setInputs } = useFireStore();
  const t = useT();
  const [profiles, setProfilesState] = useState<SavedProfile[]>([]);
  const [name, setName] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setProfilesState(loadProfiles());
  }, []);

  const handleSave = () => {
    const profileName = name.trim() || t.defaultProfileName;
    const profile: SavedProfile = {
      id: Date.now().toString(36),
      name: profileName,
      inputs: JSON.parse(JSON.stringify(inputs)),
      savedAt: Date.now(),
    };
    const updated = [...profiles, profile];
    saveProfiles(updated);
    setProfilesState(updated);
    setName('');
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleLoad = (profile: SavedProfile) => {
    setInputs(profile.inputs);
  };

  const handleDelete = (id: string) => {
    const updated = profiles.filter((p) => p.id !== id);
    saveProfiles(updated);
    setProfilesState(updated);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{t.profiles}</span>
        </div>

        {/* Save new */}
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.profileName}
            className="flex-1 h-8 rounded-md border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            onClick={handleSave}
            className={cn(
              'h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors',
              justSaved
                ? 'bg-emerald-500/20 text-emerald-500'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            <Save className="w-3 h-3" />
            {justSaved ? t.profileSaved : t.saveProfile}
          </button>
        </div>

        {/* Saved profiles list */}
        {profiles.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">{t.noSavedProfiles}</p>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{profile.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(profile.savedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleLoad(profile)}
                  className="h-6 px-2 rounded text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {t.loadProfile}
                </button>
                <button
                  onClick={() => handleDelete(profile.id)}
                  className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
