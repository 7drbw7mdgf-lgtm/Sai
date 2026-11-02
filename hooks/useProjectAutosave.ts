import { useCallback, useEffect, useRef, useState } from 'react';
import { ProjectData } from '../types';
import { didSavedProjectFailToLoad, PROJECT_STORAGE_KEY, writeProject } from '../services/projectStorage';

export type SaveNotice = 'save-failed' | 'other-tab' | 'load-failed' | null;

const SAVE_DELAY_MS = 400;

// Saves after changes settle and when the page is hidden, so a closing tab keeps recent work.
export function useProjectAutosave(projectData: ProjectData | null): { notice: SaveNotice; dismissNotice: () => void } {
    const [notice, setNotice] = useState<SaveNotice>(() => didSavedProjectFailToLoad() ? 'load-failed' : null);
    const latest = useRef(projectData);
    latest.current = projectData;
    const lastSaved = useRef(projectData ? JSON.stringify(projectData) : null);
    const pausedForOtherTab = useRef(false);

    const flush = useCallback(() => {
        if (pausedForOtherTab.current || !latest.current) return;
        const serialized = JSON.stringify(latest.current);
        if (serialized === lastSaved.current) return;
        if (writeProject(serialized)) {
            lastSaved.current = serialized;
            setNotice(current => current === 'save-failed' ? null : current);
        } else {
            setNotice('save-failed');
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(flush, SAVE_DELAY_MS);
        return () => window.clearTimeout(timer);
    }, [projectData, flush]);

    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') flush();
        };
        // Saving here would silently replace what another tab just saved, so this tab stops until reloaded.
        const handleStorage = (event: StorageEvent) => {
            if (event.key === PROJECT_STORAGE_KEY && event.newValue !== null && event.newValue !== lastSaved.current) {
                pausedForOtherTab.current = true;
                setNotice('other-tab');
            }
        };
        window.addEventListener('pagehide', flush);
        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener('pagehide', flush);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('storage', handleStorage);
        };
    }, [flush]);

    return { notice, dismissNotice: () => setNotice(null) };
}
