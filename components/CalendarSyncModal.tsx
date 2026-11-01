import React, { useState, useEffect } from 'react';
import { ProjectData, Task, Meeting } from '../types';
import { GoogleCalendarIcon } from './icons/GoogleCalendarIcon';
import { OutlookIcon } from './icons/OutlookIcon';
import { SyncArrowsIcon } from './icons/SyncArrowsIcon';
import {
    CalendarSyncConfig,
    loadSyncConfig,
    saveSyncConfig,
    generateICS,
    parseICS,
    syncWithServerFeed,
    fetchExternalFeed,
    downloadICSFile,
    getGoogleSubscribeUrl,
    getOutlookSubscribeUrl,
} from '../services/calendarSync';

interface CalendarSyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectData: ProjectData;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
}

type TabType = 'overview' | 'google' | 'outlook' | 'settings';

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
    isOpen,
    onClose,
    projectData,
    onSetData,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [config, setConfig] = useState<CalendarSyncConfig>(loadSyncConfig);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [syncMessageType, setSyncMessageType] = useState<'success' | 'error'>('success');
    const [copiedFeed, setCopiedFeed] = useState(false);

    // External import inputs
    const [googleUrlInput, setGoogleUrlInput] = useState('');
    const [outlookUrlInput, setOutlookUrlInput] = useState('');
    const [isImportingUrl, setIsImportingUrl] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setConfig(loadSyncConfig());
            setSyncMessage(null);
        }
    }, [isOpen]);

    const feedUrl = `${window.location.origin}/api/calendar/feed.ics`;
    const webcalUrl = `webcal://${window.location.host}/api/calendar/feed.ics`;

    const handleCopyFeed = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedFeed(true);
        setTimeout(() => setCopiedFeed(false), 2200);
    };

    const handleUpdateConfig = (updates: Partial<CalendarSyncConfig>) => {
        const updated = { ...config, ...updates };
        setConfig(updated);
        saveSyncConfig(updated);
    };

    const handleManualSync = async () => {
        setIsSyncing(true);
        setSyncMessage(null);
        try {
            const res = await syncWithServerFeed(projectData);
            setSyncMessageType('success');
            setSyncMessage(`Synchronized ${res.itemsCount} items successfully with Google Calendar & Outlook.`);
            setConfig(loadSyncConfig());
        } catch (err: any) {
            setSyncMessageType('error');
            setSyncMessage(`Sync warning: ${err.message || 'Check connection'}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDownloadICS = () => {
        const icsContent = generateICS(projectData, config.syncScope);
        downloadICSFile('benchline-workspace-calendar', icsContent);
        setSyncMessageType('success');
        setSyncMessage('Downloaded benchline-workspace-calendar.ics successfully.');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (!content) return;
            try {
                const parsed = parseICS(content, 'google');
                if (parsed.tasks.length === 0 && parsed.meetings.length === 0) {
                    setSyncMessageType('error');
                    setSyncMessage('No valid VEVENT records found in the uploaded .ics file.');
                    return;
                }

                onSetData((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        tasks: [...prev.tasks, ...parsed.tasks],
                        meetings: [...prev.meetings, ...parsed.meetings],
                    };
                });

                setSyncMessageType('success');
                setSyncMessage(`Imported ${parsed.tasks.length} tasks and ${parsed.meetings.length} meetings from file.`);
            } catch (err: any) {
                setSyncMessageType('error');
                setSyncMessage(`Failed to parse .ics: ${err.message}`);
            }
        };
        reader.readAsText(file);
    };

    const handleImportExternalFeed = async (source: 'google' | 'outlook') => {
        const targetUrl = source === 'google' ? googleUrlInput : outlookUrlInput;
        if (!targetUrl.trim()) return;

        setIsImportingUrl(true);
        setSyncMessage(null);
        try {
            const parsed = await fetchExternalFeed(targetUrl.trim(), source);
            if (parsed.tasks.length === 0 && parsed.meetings.length === 0) {
                setSyncMessageType('error');
                setSyncMessage(`No events found at the specified ${source === 'google' ? 'Google' : 'Outlook'} URL.`);
                return;
            }

            onSetData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    tasks: [...prev.tasks, ...parsed.tasks],
                    meetings: [...prev.meetings, ...parsed.meetings],
                };
            });

            if (source === 'google') {
                handleUpdateConfig({ googleFeedUrl: targetUrl });
            } else {
                handleUpdateConfig({ outlookFeedUrl: targetUrl });
            }

            setSyncMessageType('success');
            setSyncMessage(`Imported ${parsed.meetings.length} meetings and ${parsed.tasks.length} tasks from ${source === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}.`);
        } catch (err: any) {
            setSyncMessageType('error');
            setSyncMessage(`Import failed: ${err.message}`);
        } finally {
            setIsImportingUrl(false);
        }
    };

    const handleLoadSampleEvents = (source: 'google' | 'outlook') => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);

        if (source === 'google') {
            const sampleMeetings: Meeting[] = [
                {
                    id: `g-sample-${Date.now()}-1`,
                    title: 'Sprint Retrospective & Roadmap Review',
                    date: tomorrow,
                    startTime: '10:00',
                    endTime: '11:00',
                    attendees: projectData.people.slice(0, 3).map((p) => p.id),
                    color: '#4285F4',
                    agenda: 'Review sprint deliverables and assign Q4 priorities in Google Meet.',
                    source: 'google',
                    location: 'https://meet.google.com/sai-sync',
                },
                {
                    id: `g-sample-${Date.now()}-2`,
                    title: 'UX Design Critique & Sparkboard Prototype',
                    date: dayAfter,
                    startTime: '14:30',
                    endTime: '15:30',
                    attendees: projectData.people.slice(1, 4).map((p) => p.id),
                    color: '#34A853',
                    agenda: 'Feedback on dot-grid canvas pattern, Gantt bar colors, and Kanban drag-drop.',
                    source: 'google',
                    location: 'Design Studio & Google Meet',
                },
            ];

            const sampleTask: Task = {
                id: `g-task-${Date.now()}`,
                name: 'Review Google Calendar API Webhooks',
                startDate: tomorrow,
                endDate: dayAfter,
                assignedTo: projectData.people.slice(0, 1).map((p) => p.id),
                color: '#4285F4',
                completion: 25,
                source: 'google',
                notes: 'Imported from Google Calendar work tasks',
            };

            onSetData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    meetings: [...prev.meetings, ...sampleMeetings],
                    tasks: [...prev.tasks, sampleTask],
                };
            });

            setSyncMessageType('success');
            setSyncMessage('Added 2 Google Calendar sample meetings & 1 task to your workspace!');
        } else {
            const sampleMeetings: Meeting[] = [
                {
                    id: `o-sample-${Date.now()}-1`,
                    title: 'Weekly Executive & Steering Committee Briefing',
                    date: tomorrow,
                    startTime: '13:00',
                    endTime: '14:00',
                    attendees: projectData.people.slice(0, 2).map((p) => p.id),
                    color: '#0078D4',
                    agenda: 'Leadership update on milestones, budget allocation, and team velocity in Teams.',
                    source: 'outlook',
                    location: 'Microsoft Teams Meeting',
                },
                {
                    id: `o-sample-${Date.now()}-2`,
                    title: 'Client Milestone Sign-off Call',
                    date: dayAfter,
                    startTime: '16:00',
                    endTime: '17:00',
                    attendees: projectData.people.slice(2, 4).map((p) => p.id),
                    color: '#005A9E',
                    agenda: 'Review deployment checklist and acceptance criteria.',
                    source: 'outlook',
                    location: 'Teams Conference Room A',
                },
            ];

            onSetData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    meetings: [...prev.meetings, ...sampleMeetings],
                };
            });

            setSyncMessageType('success');
            setSyncMessage('Added 2 Microsoft Outlook sample meetings to your workspace!');
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-900 rounded-2xl max-w-3xl w-full mx-auto overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-orange-50/50 via-white to-blue-50/40 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#ef754e]/10 border border-[#ef754e]/20 flex items-center justify-center text-[#ef754e] shadow-sm">
                            <SyncArrowsIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                Calendar Synchronization
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                    Live Sync
                                </span>
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Two-way sync & live iCal subscriptions for Google Calendar and Microsoft Outlook
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Sub-navigation Tabs */}
                <div className="px-6 pt-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 flex gap-2">
                    <button
                        id="modal-tab-overview"
                        onClick={() => setActiveTab('overview')}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                            activeTab === 'overview'
                                ? 'border-[#ef754e] text-[#ef754e] bg-white dark:bg-gray-900 shadow-sm'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        Overview & Feeds
                    </button>
                    <button
                        id="modal-tab-google"
                        onClick={() => setActiveTab('google')}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                            activeTab === 'google'
                                ? 'border-[#ef754e] text-[#ef754e] bg-white dark:bg-gray-900 shadow-sm'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        <GoogleCalendarIcon className="w-4 h-4" />
                        Google Calendar
                    </button>
                    <button
                        id="modal-tab-outlook"
                        onClick={() => setActiveTab('outlook')}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                            activeTab === 'outlook'
                                ? 'border-[#ef754e] text-[#ef754e] bg-white dark:bg-gray-900 shadow-sm'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        <OutlookIcon className="w-4 h-4" />
                        Microsoft Outlook
                    </button>
                    <button
                        id="modal-tab-settings"
                        onClick={() => setActiveTab('settings')}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                            activeTab === 'settings'
                                ? 'border-[#ef754e] text-[#ef754e] bg-white dark:bg-gray-900 shadow-sm'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        Sync Settings
                    </button>
                </div>

                {/* Status Message Banner */}
                {syncMessage && (
                    <div
                        className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between ${
                            syncMessageType === 'success'
                                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800'
                                : 'bg-red-50 text-red-800 dark:bg-red-950/70 dark:text-red-300 border-b border-red-200 dark:border-red-800'
                        }`}
                    >
                        <span>{syncMessage}</span>
                        <button onClick={() => setSyncMessage(null)} className="text-xs opacity-70 hover:opacity-100">
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* TAB 1: OVERVIEW & FEEDS */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Hero Card */}
                            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50/70 to-amber-50/50 dark:from-gray-800 dark:to-gray-800/80 border border-orange-200/60 dark:border-gray-700">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                                            Active Calendar Synchronization
                                        </h3>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {projectData.tasks.length} tasks and {projectData.meetings.length} meetings are currently available for sync.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <GoogleCalendarIcon className="w-3.5 h-3.5" />
                                                Google: {config.googleConnected ? 'Connected' : 'Disconnected'}
                                            </span>
                                            <span className="text-gray-300 dark:text-gray-600">|</span>
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <OutlookIcon className="w-3.5 h-3.5" />
                                                Outlook: {config.outlookConnected ? 'Connected' : 'Disconnected'}
                                            </span>
                                            <span className="text-gray-300 dark:text-gray-600">|</span>
                                            <span>
                                                Last Synced: {config.lastSyncedAt ? new Date(config.lastSyncedAt).toLocaleTimeString() : 'Ready'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleManualSync}
                                            disabled={isSyncing}
                                            className="px-4 py-2 rounded-lg bg-[#ef754e] hover:bg-[#e0643d] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <SyncArrowsIcon className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Feed URLs Card */}
                            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Live Calendar Feed (iCal / Webcal)
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        Subscribe to this feed in Google Calendar or Outlook to have updates reflect automatically.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={feedUrl}
                                        className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-gray-800 dark:text-gray-200"
                                    />
                                    <button
                                        onClick={() => handleCopyFeed(feedUrl)}
                                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors whitespace-nowrap"
                                    >
                                        {copiedFeed ? 'Copied!' : 'Copy URL'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <a
                                        href={getGoogleSubscribeUrl(feedUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all flex items-center gap-3 text-left group"
                                    >
                                        <GoogleCalendarIcon className="w-6 h-6 flex-shrink-0" />
                                        <div>
                                            <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1">
                                                Subscribe in Google Calendar
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </div>
                                            <div className="text-[11px] text-gray-500">Opens Google Calendar subscription</div>
                                        </div>
                                    </a>

                                    <a
                                        href={getOutlookSubscribeUrl(feedUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-sky-50/40 dark:hover:bg-sky-950/20 transition-all flex items-center gap-3 text-left group"
                                    >
                                        <OutlookIcon className="w-6 h-6 flex-shrink-0" />
                                        <div>
                                            <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-[#0078D4] dark:group-hover:text-[#0078D4] flex items-center gap-1">
                                                Subscribe in Outlook Calendar
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </div>
                                            <div className="text-[11px] text-gray-500">Opens Outlook web subscription</div>
                                        </div>
                                    </a>
                                </div>
                            </div>

                            {/* Manual Import / Export Actions */}
                            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                        Offline Calendar Backup (.ics)
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Import or export standard iCalendar files for Outlook Desktop or local archiving.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors">
                                        Import .ics
                                        <input type="file" accept=".ics,text/calendar" onChange={handleFileUpload} className="hidden" />
                                    </label>
                                    <button
                                        onClick={handleDownloadICS}
                                        className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        Download .ics
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: GOOGLE CALENDAR */}
                    {activeTab === 'google' && (
                        <div className="space-y-6">
                            {/* Google Connection Header */}
                            <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <GoogleCalendarIcon className="w-8 h-8" />
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            Google Calendar Integration
                                        </h3>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Sync events with your Google account and Google Meet
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.googleConnected}
                                        onChange={(e) => handleUpdateConfig({ googleConnected: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#4285F4]"></div>
                                </label>
                            </div>

                            {/* Account & Details */}
                            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Google Account Email
                                    </label>
                                    <input
                                        type="email"
                                        value={config.googleAccountEmail}
                                        onChange={(e) => handleUpdateConfig({ googleAccountEmail: e.target.value })}
                                        placeholder="your.email@gmail.com"
                                        className="w-full text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <div>
                                        <div className="text-xs font-medium text-gray-800 dark:text-gray-200">Automatic Sync</div>
                                        <div className="text-[11px] text-gray-500">Sync project changes automatically</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={config.googleAutoSync}
                                        onChange={(e) => handleUpdateConfig({ googleAutoSync: e.target.checked })}
                                        className="h-4 w-4 text-[#4285F4] rounded border-gray-300"
                                    />
                                </div>
                            </div>

                            {/* Import External Google Feed */}
                            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Import from Google Calendar (Secret iCal Address)
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        In Google Calendar, go to <i>Settings &rarr; Integrate calendar &rarr; Secret address in iCal format</i>, then paste it here:
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={googleUrlInput}
                                        onChange={(e) => setGoogleUrlInput(e.target.value)}
                                        placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                                        className="flex-1 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                                    />
                                    <button
                                        onClick={() => handleImportExternalFeed('google')}
                                        disabled={isImportingUrl || !googleUrlInput.trim()}
                                        className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                                    >
                                        {isImportingUrl ? 'Importing...' : 'Import'}
                                    </button>
                                </div>

                                <div className="pt-2 flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Want to test without a Google account?</span>
                                    <button
                                        id="modal-load-sample-google"
                                        onClick={() => handleLoadSampleEvents('google')}
                                        className="text-[#4285F4] hover:underline font-medium"
                                    >
                                        Load Sample Google Events
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: MICROSOFT OUTLOOK */}
                    {activeTab === 'outlook' && (
                        <div className="space-y-6">
                            {/* Outlook Connection Header */}
                            <div className="p-4 rounded-xl border border-sky-100 dark:border-sky-900/40 bg-sky-50/40 dark:bg-sky-950/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <OutlookIcon className="w-8 h-8" />
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            Microsoft Outlook Integration
                                        </h3>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Sync events with Outlook.com, Microsoft 365, and Microsoft Teams
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.outlookConnected}
                                        onChange={(e) => handleUpdateConfig({ outlookConnected: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#0078D4]"></div>
                                </label>
                            </div>

                            {/* Account & Details */}
                            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Outlook / Microsoft 365 Email
                                    </label>
                                    <input
                                        type="email"
                                        value={config.outlookAccountEmail}
                                        onChange={(e) => handleUpdateConfig({ outlookAccountEmail: e.target.value })}
                                        placeholder="your.name@outlook.com or company.com"
                                        className="w-full text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <div>
                                        <div className="text-xs font-medium text-gray-800 dark:text-gray-200">Automatic Sync</div>
                                        <div className="text-[11px] text-gray-500">Sync project changes automatically</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={config.outlookAutoSync}
                                        onChange={(e) => handleUpdateConfig({ outlookAutoSync: e.target.checked })}
                                        className="h-4 w-4 text-[#0078D4] rounded border-gray-300"
                                    />
                                </div>
                            </div>

                            {/* Import External Outlook Feed */}
                            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Import from Outlook (Shared/Published ICS URL)
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        In Outlook Web, go to <i>Settings &rarr; Calendar &rarr; Shared calendars &rarr; Publish a calendar</i>, copy the ICS link, and paste it here:
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={outlookUrlInput}
                                        onChange={(e) => setOutlookUrlInput(e.target.value)}
                                        placeholder="https://outlook.live.com/owa/calendar/.../reachcalendar.ics"
                                        className="flex-1 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                                    />
                                    <button
                                        onClick={() => handleImportExternalFeed('outlook')}
                                        disabled={isImportingUrl || !outlookUrlInput.trim()}
                                        className="px-3.5 py-2 rounded-lg bg-[#0078D4] hover:bg-[#005a9e] text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                                    >
                                        {isImportingUrl ? 'Importing...' : 'Import'}
                                    </button>
                                </div>

                                <div className="pt-2 flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Want to test without an Outlook account?</span>
                                    <button
                                        id="modal-load-sample-outlook"
                                        onClick={() => handleLoadSampleEvents('outlook')}
                                        className="text-[#0078D4] hover:underline font-medium"
                                    >
                                        Load Sample Outlook Meetings
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: SYNC SETTINGS */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Sync Frequency & Trigger
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: '15m', label: 'Every 15 min' },
                                        { id: '1h', label: 'Every hour' },
                                        { id: 'daily', label: 'Daily' },
                                        { id: 'manual', label: 'Manual only' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleUpdateConfig({ syncInterval: opt.id as any })}
                                            className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                                                config.syncInterval === opt.id
                                                    ? 'border-[#ef754e] bg-[#ef754e]/10 text-[#ef754e] font-semibold'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Items to Include in Sync
                                </h4>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.syncScope.tasks}
                                            onChange={(e) =>
                                                handleUpdateConfig({
                                                    syncScope: { ...config.syncScope, tasks: e.target.checked },
                                                })
                                            }
                                            className="h-4 w-4 text-[#ef754e] rounded border-gray-300"
                                        />
                                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                            Tasks with start & end dates
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.syncScope.assignments}
                                            onChange={(e) =>
                                                handleUpdateConfig({
                                                    syncScope: { ...config.syncScope, assignments: e.target.checked },
                                                })
                                            }
                                            className="h-4 w-4 text-[#ef754e] rounded border-gray-300"
                                        />
                                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                            Timed task assignments
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.syncScope.meetings}
                                            onChange={(e) =>
                                                handleUpdateConfig({
                                                    syncScope: { ...config.syncScope, meetings: e.target.checked },
                                                })
                                            }
                                            className="h-4 w-4 text-[#ef754e] rounded border-gray-300"
                                        />
                                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                            Scheduled meetings & attendee lists
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Sync Direction
                                </h4>
                                <div className="space-y-2 text-xs">
                                    {[
                                        { id: 'two-way', title: 'Two-Way Sync (Recommended)', desc: 'Export Benchline items and import external Google / Outlook items' },
                                        { id: 'export-only', title: 'Export Only', desc: 'Publish Benchline events to Google & Outlook without importing external events' },
                                        { id: 'import-only', title: 'Import Only', desc: 'Read Google & Outlook calendars into Benchline without modifying external accounts' },
                                    ].map((dir) => (
                                        <label key={dir.id} className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <input
                                                type="radio"
                                                name="syncDirection"
                                                checked={config.syncDirection === dir.id}
                                                onChange={() => handleUpdateConfig({ syncDirection: dir.id as any })}
                                                className="mt-0.5 text-[#ef754e]"
                                            />
                                            <div>
                                                <div className="font-semibold text-gray-800 dark:text-gray-200">{dir.title}</div>
                                                <div className="text-[11px] text-gray-500">{dir.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        RFC 5545 iCalendar standard compliant
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            id="modal-done-btn"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarSyncModal;
