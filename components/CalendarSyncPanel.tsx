import React, { useRef, useState } from 'react';
import { ProjectData } from '../types';
import { GoogleCalendarIcon } from './icons/GoogleCalendarIcon';
import { OutlookIcon } from './icons/OutlookIcon';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, FIELD, FormRow, OptionsGroup } from './OptionsControls';
import { CalendarProviderId } from '../services/calendarEngine';
import { CalendarSyncConfig, downloadICSFile, generateICS, loadSyncConfig, parseICS, saveSyncConfig } from '../services/calendarSync';
import { calendarProviders, connectCalendar, disconnectCalendar, syncCalendars, useCalendarConnections } from '../hooks/useCalendarConnections';

interface CalendarSyncPanelProps {
    projectData: ProjectData;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
}

const CALENDARS: { id: CalendarProviderId; icon: React.ReactNode; setupKey: string }[] = [
    { id: 'google', icon: <GoogleCalendarIcon className="h-6 w-6" />, setupKey: 'GOOGLE_CALENDAR_CLIENT_ID' },
    { id: 'outlook', icon: <OutlookIcon className="h-6 w-6" />, setupKey: 'MICROSOFT_CALENDAR_CLIENT_ID' },
];

const SCOPE_OPTIONS: { key: keyof CalendarSyncConfig['syncScope']; label: string }[] = [
    { key: 'tasks', label: 'Tasks' },
    { key: 'assignments', label: 'Assignments' },
    { key: 'meetings', label: 'Meetings' },
];

const formatSyncTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export const CalendarSyncPanel: React.FC<CalendarSyncPanelProps> = ({ projectData, onSetData }) => {
    const { connections, isSyncing, lastMessage } = useCalendarConnections();
    const [config, setConfig] = useState<CalendarSyncConfig>(loadSyncConfig);
    const [fileMessage, setFileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const anyConnected = CALENDARS.some(calendar => connections[calendar.id].status === 'connected');

    const updateConfig = (updates: Partial<CalendarSyncConfig>) => {
        const next = { ...config, ...updates };
        setConfig(next);
        saveSyncConfig(next);
    };

    const handleDownloadICS = () => {
        downloadICSFile('labtrail-workspace-calendar', generateICS(projectData, config.syncScope));
        setFileMessage({ type: 'success', text: 'Downloaded labtrail-workspace-calendar.ics.' });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const parsed = parseICS(String(event.target?.result || ''), 'google');
                if (parsed.tasks.length === 0 && parsed.meetings.length === 0) {
                    setFileMessage({ type: 'error', text: 'No events were found in that file.' });
                    return;
                }
                onSetData(prev => prev && {
                    ...prev,
                    tasks: [...prev.tasks, ...parsed.tasks],
                    meetings: [...prev.meetings, ...parsed.meetings],
                });
                setFileMessage({ type: 'success', text: `Imported ${parsed.tasks.length} tasks and ${parsed.meetings.length} meetings.` });
            } catch (err: any) {
                setFileMessage({ type: 'error', text: `Could not read that file: ${err.message}` });
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col gap-[25px]">
            <OptionsGroup title="Connected calendars">
                <p className="text-xs leading-relaxed text-[#50564d] dark:text-gray-400">
                    Labtrail puts your work in a new calendar named "Labtrail" and only reads your main calendar. You'll need to connect again after reloading this page.
                </p>
                {CALENDARS.map(({ id, icon, setupKey }) => {
                    const connection = connections[id];
                    const provider = calendarProviders[id];
                    const configured = provider.isConfigured();
                    const isConnected = connection.status === 'connected';
                    const statusText = !configured
                        ? `Needs setup: add ${setupKey} to .env.local`
                        : isConnected
                            ? `${connection.account}${connection.lastSyncedAt ? ` · Last synced ${formatSyncTime(connection.lastSyncedAt)}` : ' · Not synced yet'}`
                            : connection.status === 'connecting'
                                ? 'Waiting for sign-in...'
                                : connection.status === 'expired'
                                    ? 'Sign-in expired'
                                    : 'Not connected';
                    return (
                        <div key={id} data-calendar-row={id} className="flex flex-wrap items-center gap-3">
                            {icon}
                            <div className="min-w-0 flex-1">
                                <span className="block text-[13px] text-[#292c31] dark:text-gray-100">{provider.label}</span>
                                <span className="block break-words text-xs text-[#6d7368] dark:text-gray-400">{statusText}</span>
                                {connection.error && <span role="alert" className="block text-xs text-red-700 dark:text-red-400">{connection.error}</span>}
                            </div>
                            {isConnected ? (
                                <button type="button" onClick={() => disconnectCalendar(id)} disabled={isSyncing} className={BUTTON_SECONDARY}>Disconnect</button>
                            ) : (
                                <button type="button" onClick={() => connectCalendar(id)} disabled={!configured || connection.status === 'connecting'} className={BUTTON_SECONDARY}>
                                    {connection.status === 'expired' ? 'Connect again' : 'Connect'}
                                </button>
                            )}
                        </div>
                    );
                })}
            </OptionsGroup>

            <OptionsGroup title="Sync">
                <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => syncCalendars(() => projectData, onSetData)} disabled={!anyConnected || isSyncing} className={BUTTON_PRIMARY}>
                        {isSyncing ? 'Syncing...' : 'Sync now'}
                    </button>
                    {!anyConnected && <span className="text-xs text-[#6d7368] dark:text-gray-400">Connect a calendar to start.</span>}
                </div>
                {lastMessage && (
                    <p role="status" className={`text-xs leading-relaxed ${lastMessage.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                        {lastMessage.text}
                    </p>
                )}
                <FormRow label="Direction">
                    <select value={config.syncDirection} onChange={e => updateConfig({ syncDirection: e.target.value as CalendarSyncConfig['syncDirection'] })} className={`${FIELD} w-full max-w-[260px]`}>
                        <option value="two-way">Both ways</option>
                        <option value="export-only">Send to calendar only</option>
                        <option value="import-only">Read from calendar only</option>
                    </select>
                </FormRow>
                <FormRow label="Auto-sync">
                    <select value={config.syncInterval} onChange={e => updateConfig({ syncInterval: e.target.value as CalendarSyncConfig['syncInterval'] })} className={`${FIELD} w-full max-w-[260px]`}>
                        <option value="manual">Off</option>
                        <option value="15m">Every 15 minutes</option>
                        <option value="1h">Every hour</option>
                        <option value="daily">Daily</option>
                    </select>
                </FormRow>
                <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#50564d] dark:text-gray-300">
                    {SCOPE_OPTIONS.map(option => (
                        <label key={option.key} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={config.syncScope[option.key]}
                                onChange={e => updateConfig({ syncScope: { ...config.syncScope, [option.key]: e.target.checked } })}
                                className="h-4 w-4 rounded-[3px] accent-accent"
                            />
                            {option.label}
                        </label>
                    ))}
                </div>
            </OptionsGroup>

            <OptionsGroup title="File backup">
                <p className="text-xs leading-relaxed text-[#50564d] dark:text-gray-400">Import or save a standard .ics calendar file.</p>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className={BUTTON_SECONDARY}>Import .ics</button>
                    <input ref={fileInputRef} type="file" accept=".ics,text/calendar" onChange={handleFileUpload} className="hidden" aria-label="Import calendar file" />
                    <button type="button" onClick={handleDownloadICS} className={BUTTON_SECONDARY}>Download .ics</button>
                </div>
                {fileMessage && (
                    <p role="status" className={`text-xs ${fileMessage.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                        {fileMessage.text}
                    </p>
                )}
            </OptionsGroup>
        </div>
    );
};

export default CalendarSyncPanel;
