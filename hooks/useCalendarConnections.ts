import { useEffect, useRef, useSyncExternalStore } from 'react';
import { ProjectData } from '../types';
import { AccountLinks, CalendarAuthExpiredError, CalendarProvider, CalendarProviderId, runSync } from '../services/calendarEngine';
import { createGoogleProvider, createMicrosoftProvider } from '../services/calendarProviders';
import { loadSyncConfig } from '../services/calendarSync';

export interface ConnectionState {
    status: 'disconnected' | 'connecting' | 'connected' | 'expired';
    account?: string;
    lastSyncedAt?: string;
    error?: string;
}

export interface CalendarSyncState {
    connections: Record<CalendarProviderId, ConnectionState>;
    isSyncing: boolean;
    lastMessage?: { type: 'success' | 'error'; text: string };
}

type SetProjectData = (data: (prev: ProjectData | null) => ProjectData | null) => void;

export const calendarProviders: Record<CalendarProviderId, CalendarProvider> = {
    google: createGoogleProvider(process.env.GOOGLE_CALENDAR_CLIENT_ID || ''),
    outlook: createMicrosoftProvider(process.env.MICROSOFT_CALENDAR_CLIENT_ID || ''),
};

const PROVIDER_IDS: CalendarProviderId[] = ['google', 'outlook'];
const LINKS_KEY = 'benchline-calendar-links';
const INTERVALS_MS: Record<string, number> = { '15m': 15 * 60_000, '1h': 60 * 60_000, daily: 24 * 60 * 60_000 };

let state: CalendarSyncState = {
    connections: { google: { status: 'disconnected' }, outlook: { status: 'disconnected' } },
    isSyncing: false,
};
const listeners = new Set<() => void>();

const setState = (next: Partial<CalendarSyncState>) => {
    state = { ...state, ...next };
    listeners.forEach(listener => listener());
};

const setConnection = (id: CalendarProviderId, next: ConnectionState) =>
    setState({ connections: { ...state.connections, [id]: next } });

const loadLinks = (provider: CalendarProviderId, account: string): AccountLinks => {
    try {
        const all = JSON.parse(localStorage.getItem(LINKS_KEY) || '{}');
        return all[`${provider}:${account}`] || { items: {} };
    } catch {
        return { items: {} };
    }
};

const saveLinks = (provider: CalendarProviderId, account: string, links: AccountLinks) => {
    try {
        const all = JSON.parse(localStorage.getItem(LINKS_KEY) || '{}');
        all[`${provider}:${account}`] = links;
        localStorage.setItem(LINKS_KEY, JSON.stringify(all));
    } catch (error) {
        console.error('Failed to save calendar links:', error);
    }
};

// Must be called directly from a click, because both providers open a sign-in window.
export async function connectCalendar(id: CalendarProviderId): Promise<void> {
    setConnection(id, { status: 'connecting' });
    try {
        const account = await calendarProviders[id].signIn();
        setConnection(id, { status: 'connected', account });
    } catch (error: any) {
        setConnection(id, { status: 'disconnected', error: error?.message || 'Sign-in failed.' });
    }
}

export function disconnectCalendar(id: CalendarProviderId): void {
    calendarProviders[id].signOut();
    setConnection(id, { status: 'disconnected' });
}

export async function syncCalendars(getData: () => ProjectData | null, setData: SetProjectData): Promise<CalendarSyncState['lastMessage']> {
    if (state.isSyncing) return undefined;
    const connected = PROVIDER_IDS.filter(id => state.connections[id].status === 'connected');
    if (connected.length === 0) return undefined;

    setState({ isSyncing: true, lastMessage: undefined });
    const config = loadSyncConfig();
    const totals = { created: 0, updated: 0, pulledChanges: 0, imported: 0, failed: 0 };
    const problems: string[] = [];
    let current = getData();

    for (const id of connected) {
        if (!current) break;
        const connection = state.connections[id];
        const provider = calendarProviders[id];
        try {
            const result = await runSync(provider, current, config, loadLinks(id, connection.account || ''));
            saveLinks(id, connection.account || '', result.links);
            current = result.patch(current);
            setData(prev => prev && result.patch(prev));
            totals.created += result.created;
            totals.updated += result.updated;
            totals.pulledChanges += result.pulledChanges;
            totals.imported += result.imported;
            totals.failed += result.failed;
            setConnection(id, { ...connection, lastSyncedAt: new Date().toISOString(), error: undefined });
        } catch (error: any) {
            if (error instanceof CalendarAuthExpiredError) {
                setConnection(id, { status: 'expired', account: connection.account, error: 'Sign-in expired. Connect again to keep syncing.' });
                problems.push(`${provider.label} sign-in expired.`);
            } else {
                console.error(`${provider.label} sync failed:`, error);
                setConnection(id, { ...connection, error: error?.message || 'Sync failed.' });
                problems.push(`${provider.label}: ${error?.message || 'sync failed'}.`);
            }
        }
    }

    const parts = [
        totals.created && `${totals.created} added to your Benchline calendar`,
        totals.updated && `${totals.updated} updated there`,
        totals.pulledChanges && `${totals.pulledChanges} ${totals.pulledChanges === 1 ? 'change' : 'changes'} brought back`,
        totals.imported && `${totals.imported} ${totals.imported === 1 ? 'event' : 'events'} read from your main calendar`,
        totals.failed && `${totals.failed} could not be saved`,
    ].filter(Boolean);

    setState({
        isSyncing: false,
        lastMessage: problems.length > 0 || totals.failed > 0
            ? { type: 'error', text: [...problems, ...parts].join(' · ') }
            : { type: 'success', text: parts.length > 0 ? parts.join(' · ') : 'Everything is already up to date.' },
    });
    return state.lastMessage;
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const useCalendarConnections = (): CalendarSyncState => useSyncExternalStore(subscribe, () => state);

// Keeps syncing on the chosen interval, but only after the user has run a sync themselves this visit.
export function useCalendarAutoSync(projectData: ProjectData | null, setData: SetProjectData): void {
    const dataRef = useRef(projectData);
    dataRef.current = projectData;
    const setDataRef = useRef(setData);
    setDataRef.current = setData;

    useEffect(() => {
        const timer = window.setInterval(() => {
            const interval = INTERVALS_MS[loadSyncConfig().syncInterval];
            if (!interval) return;
            const syncedTimes = PROVIDER_IDS
                .map(id => state.connections[id])
                .filter(connection => connection.status === 'connected' && connection.lastSyncedAt)
                .map(connection => new Date(connection.lastSyncedAt!).getTime());
            if (syncedTimes.length > 0 && Date.now() - Math.min(...syncedTimes) >= interval) {
                syncCalendars(() => dataRef.current, updater => setDataRef.current(updater));
            }
        }, 60_000);
        return () => window.clearInterval(timer);
    }, []);
}
