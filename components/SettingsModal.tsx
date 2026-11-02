
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppSettings, ColorSettings, ProjectData, TypographySettings, WidgetLayout } from '../types';
import LabtrailLogo from './LabtrailLogo';
import CalendarSyncPanel from './CalendarSyncPanel';
import { BUTTON_SECONDARY, FIELD, FormRow, LINE, OptionsGroup } from './OptionsControls';

export type PageId = 'general' | 'calendar' | 'home';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSettings: AppSettings;
    onSave: (settings: AppSettings) => void;
    defaultLayout: WidgetLayout[];
    projectData: ProjectData | null;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    initialPage?: PageId;
}


const PAGES: { id: PageId; title: string; description: string }[] = [
    { id: 'general', title: 'General', description: 'Personalize the way Labtrail looks and works on this computer.' },
    { id: 'calendar', title: 'Calendar sync', description: 'Connect your calendars and control how often they refresh.' },
    { id: 'home', title: 'Home screen', description: 'Manage the layout of your dashboard widgets.' },
];

// Searchable groups; titles rank above the terms inside them.
const SETTINGS_INDEX: { page: PageId; group: string; terms: string }[] = [
    { page: 'general', group: 'Application theme', terms: 'light dark mode appearance color scheme' },
    { page: 'general', group: 'Accent color', terms: 'theme highlight swatch' },
    { page: 'general', group: 'Sidebar', terms: 'background icon color navigation' },
    { page: 'general', group: 'Global font', terms: 'font family base size text' },
    { page: 'general', group: 'Light mode colors', terms: 'body text headings links' },
    { page: 'general', group: 'Dark mode colors', terms: 'body text headings links' },
    { page: 'general', group: 'Task defaults', terms: 'duration days new tasks preferences' },
    { page: 'calendar', group: 'Calendar sync', terms: 'google outlook microsoft subscribe account ical ics feed url import export download backup auto-sync interval frequency' },
    { page: 'home', group: 'Dashboard layout', terms: 'reset default widgets arrangement' },
];

const ColorRow: React.FC<{ label: string; color: string; onChange: (color: string) => void }> = ({ label, color, onChange }) => (
    <FormRow label={label}>
        <input
            type="color"
            value={color}
            onChange={e => onChange(e.target.value)}
            className="h-[33px] w-11 cursor-pointer rounded-[3px] border border-[#cfcfc9] dark:border-gray-600 bg-white dark:bg-gray-800 p-1"
        />
        <span className="font-mono text-xs uppercase text-[#6d7368] dark:text-gray-400">{color}</span>
    </FormRow>
);

const ThemeCard: React.FC<{ label: string; hint: string; checked: boolean; dark: boolean; onSelect: () => void }> = ({ label, hint, checked, dark, onSelect }) => (
    <label className="relative flex min-w-0 cursor-pointer flex-col items-start gap-1">
        <input type="radio" name="labtrailTheme" checked={checked} onChange={onSelect} className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0" />
        <div className={`relative h-[68px] w-full overflow-hidden rounded border-2 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-accent ${checked ? 'border-accent' : 'border-[#e6e6e2] dark:border-gray-700'} ${dark ? 'bg-[#1e2024]' : 'bg-[#fbfbf9]'}`}>
            <span className={`absolute inset-y-0 left-0 w-[21%] ${dark ? 'bg-[#33363d]' : 'bg-[#e6e6e2]'}`} />
            <span className={`absolute left-[32%] right-[12%] top-[18px] h-[5px] rounded-sm ${dark ? 'bg-gray-300' : 'bg-[#50564d]'}`} />
            <span className={`absolute left-[32%] right-[24%] top-[30px] h-[3px] rounded-sm opacity-50 ${dark ? 'bg-gray-300' : 'bg-[#50564d]'}`} />
            <span className={`absolute left-[32%] right-[17%] top-[40px] h-[3px] rounded-sm opacity-30 ${dark ? 'bg-gray-300' : 'bg-[#50564d]'}`} />
        </div>
        <strong className={`mt-1 text-xs font-medium ${checked ? 'text-accent-strong dark:text-accent-light' : 'text-[#292c31] dark:text-gray-100'}`}>{label}</strong>
        <small className="text-[10.5px] text-[#6d7368] dark:text-gray-400">{hint}</small>
    </label>
);

const WorkspacePreview: React.FC = () => (
    <div aria-hidden="true" className={`grid min-h-[164px] grid-cols-[38px_minmax(120px,1fr)] overflow-hidden rounded-[5px] border ${LINE} bg-white dark:bg-[#1e2024] min-[721px]:grid-cols-[38px_minmax(120px,1fr)_minmax(100px,1fr)]`}>
        <div className="flex flex-col items-center gap-4 bg-accent px-2 py-3 text-white">
            <LabtrailLogo className="h-6 w-6 rounded-[4px] bg-white p-0.5" />
            <i className="h-[3px] w-3.5 bg-current opacity-65" />
            <i className="h-[3px] w-3.5 bg-current opacity-65" />
            <i className="h-[3px] w-3.5 bg-current opacity-65" />
        </div>
        <div className={`flex flex-col gap-2.5 border-r ${LINE} p-4`}>
            <strong className="text-xs text-[#292c31] dark:text-gray-100">Project tasks</strong>
            <div className="text-[11px] text-[#292c31] dark:text-gray-100">
                Style Guide
                <small className="mt-1 block text-[9px] text-[#6d7368] dark:text-gray-400">Design Phase · Nov 10</small>
            </div>
            <span className="h-1 w-[90%] bg-[#e6e6e2] dark:bg-gray-700" />
            <span className="h-1 w-[60%] bg-[#e6e6e2] dark:bg-gray-700" />
            <span className="self-start rounded-[3px] bg-accent-soft px-1.5 py-[3px] text-[9px] text-accent-strong dark:bg-accent/15 dark:text-accent-light">In progress</span>
        </div>
        <div className="spark-canvas-grid hidden flex-col justify-center gap-2.5 bg-[#f7f7f4] p-3 dark:bg-[#17181b] min-[721px]:flex">
            <span className="h-2.5 w-[55%] rounded-sm bg-accent" />
            <span className="ml-[20%] h-2.5 w-[60%] rounded-sm bg-accent/60" />
            <span className="ml-[45%] h-2.5 w-[50%] rounded-sm bg-accent/35" />
            <span className="mt-1 text-center text-[9px] text-[#6d7368] dark:text-gray-400">Roadmap timeline</span>
        </div>
    </div>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentSettings, onSave, defaultLayout, projectData, onSetData, initialPage }) => {
    const [settings, setSettings] = useState<AppSettings>(() => JSON.parse(JSON.stringify(currentSettings)));
    const [page, setPage] = useState<PageId>('general');
    const [query, setQuery] = useState('');
    const [pendingGroup, setPendingGroup] = useState<string | null>(null);

    const windowRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const previousFocus = useRef<HTMLElement | null>(null);

    const pageInfo = PAGES.find(p => p.id === page)!;
    const trimmedQuery = query.trim().toLocaleLowerCase();

    const searchResults = useMemo(() => {
        if (!trimmedQuery) return [];
        const terms = trimmedQuery.split(/\s+/);
        return SETTINGS_INDEX
            .map(entry => {
                const pageTitle = PAGES.find(p => p.id === entry.page)!.title;
                const text = `${pageTitle} ${entry.group} ${entry.terms}`.toLocaleLowerCase();
                if (!terms.every(term => text.includes(term))) return null;
                return { ...entry, pageTitle, score: entry.group.toLocaleLowerCase().includes(trimmedQuery) ? 1 : 0 };
            })
            .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
            .sort((a, b) => b.score - a.score);
    }, [trimmedQuery]);

    // Start each visit from what is saved, and hand focus back on the way out.
    useEffect(() => {
        if (!isOpen) return;
        previousFocus.current = document.activeElement as HTMLElement | null;
        setSettings(JSON.parse(JSON.stringify(currentSettings)));
        setQuery('');
        if (initialPage) setPage(initialPage);
        searchRef.current?.focus({ preventScroll: true });
        return () => previousFocus.current?.focus?.({ preventScroll: true });
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                searchRef.current?.focus();
                searchRef.current?.select();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (searchRef.current?.value) {
                    setQuery('');
                    searchRef.current.focus();
                } else {
                    onClose();
                }
            } else if (e.key === 'Tab' && windowRef.current) {
                const nodes = (Array.from(windowRef.current.querySelectorAll('button,input,select,textarea,a[href]')) as HTMLElement[])
                    .filter(el => !(el as HTMLButtonElement).disabled && el.tabIndex >= 0 && el.getClientRects().length > 0);
                const first = nodes[0];
                const last = nodes[nodes.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, onClose]);

    // Show the group a search result pointed at, once its page has rendered.
    useEffect(() => {
        if (!pendingGroup || !bodyRef.current) return;
        const el = bodyRef.current.querySelector<HTMLElement>(`[data-settings-group="${CSS.escape(pendingGroup)}"]`);
        setPendingGroup(null);
        if (!el) return;
        el.scrollIntoView({ block: 'nearest' });
        el.style.outline = '2px solid rgb(var(--color-primary-500))';
        el.style.outlineOffset = '8px';
        window.setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 1600);
    }, [pendingGroup, page, trimmedQuery]);

    const openPage = (id: PageId) => {
        setPage(id);
        setQuery('');
    };

    const handleNavKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const index = PAGES.findIndex(p => p.id === page);
        let next: number | null = null;
        if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = PAGES.length - 1;
        else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (index + 1) % PAGES.length;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (index - 1 + PAGES.length) % PAGES.length;
        if (next === null) return;
        e.preventDefault();
        openPage(PAGES[next].id);
        e.currentTarget.querySelectorAll('button')[next]?.focus();
    };

    // Every setting here saves as it changes.
    const applyNow = (patch: Partial<AppSettings>) => {
        setSettings(s => ({ ...s, ...patch }));
        onSave({ ...currentSettings, ...patch });
    };



    const updateTypography = (patch: Partial<TypographySettings>) => {
        applyNow({ typography: { ...settings.typography, ...patch } });
    };

    const updateModeColors = (mode: 'lightModeColors' | 'darkModeColors', patch: Partial<ColorSettings>) => {
        applyNow({ [mode]: { ...settings[mode], ...patch } });
    };

    const renderGeneral = () => (
        <>
            <OptionsGroup title="Application theme">
                <div role="radiogroup" aria-label="Application theme" className="grid max-w-[360px] grid-cols-2 gap-3">
                    <ThemeCard label="Light" hint="Bright and clear" dark={false} checked={!settings.darkMode} onSelect={() => applyNow({ darkMode: false })} />
                    <ThemeCard label="Dark" hint="Easier in low light" dark checked={settings.darkMode} onSelect={() => applyNow({ darkMode: true })} />
                </div>
                <WorkspacePreview />
            </OptionsGroup>
            <OptionsGroup title="Accent color">
                <div role="radiogroup" aria-label="Accent color" className="flex flex-wrap items-center gap-3">
                    {settings.themes.map(theme => (
                        <label key={theme.id} title={theme.name} className="relative flex h-7 w-7 cursor-pointer items-center justify-center">
                            <input type="radio" name="labtrailAccent" aria-label={theme.name} checked={settings.activeThemeId === theme.id} onChange={() => applyNow({ activeThemeId: theme.id })} className="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0" />
                            <span
                                className={`h-6 w-6 rounded-full peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${settings.activeThemeId === theme.id ? 'ring-2 ring-[#292c31] ring-offset-2 dark:ring-gray-100 dark:ring-offset-[#1e2024]' : ''}`}
                                style={{ backgroundColor: theme.colors['500'] }}
                            />
                        </label>
                    ))}
                </div>
            </OptionsGroup>
            <OptionsGroup title="Sidebar">
                <ColorRow label="Background" color={settings.sidebarBg} onChange={c => applyNow({ sidebarBg: c })} />
                <ColorRow label="Icon color" color={settings.iconColor} onChange={c => applyNow({ iconColor: c })} />
            </OptionsGroup>
            {renderTypography()}
            {renderTaskDefaults()}
        </>
    );

    const renderTypography = () => (
        <>
            <OptionsGroup title="Global font">
                <FormRow label="Font family">
                    <select
                        value={settings.typography.fontFamily}
                        onChange={e => updateTypography({ fontFamily: e.target.value as TypographySettings['fontFamily'] })}
                        className={`${FIELD} w-full max-w-[260px]`}
                    >
                        <option value="Inter">Inter</option>
                        <option value="Lora">Lora</option>
                        <option value="Inconsolata">Inconsolata</option>
                    </select>
                </FormRow>
                <FormRow label="Base size">
                    <input
                        type="number"
                        min="12"
                        max="24"
                        value={settings.typography.fontSize}
                        onChange={e => updateTypography({ fontSize: parseInt(e.target.value, 10) || 16 })}
                        className={`${FIELD} w-20 text-center`}
                    />
                    <span className="text-xs text-[#6d7368] dark:text-gray-400">px</span>
                </FormRow>
            </OptionsGroup>
            <OptionsGroup title="Light mode colors">
                <ColorRow label="Body text" color={settings.lightModeColors.text} onChange={c => updateModeColors('lightModeColors', { text: c })} />
                <ColorRow label="Headings" color={settings.lightModeColors.heading} onChange={c => updateModeColors('lightModeColors', { heading: c })} />
                <ColorRow label="Links" color={settings.lightModeColors.link} onChange={c => updateModeColors('lightModeColors', { link: c })} />
            </OptionsGroup>
            <OptionsGroup title="Dark mode colors">
                <ColorRow label="Body text" color={settings.darkModeColors.text} onChange={c => updateModeColors('darkModeColors', { text: c })} />
                <ColorRow label="Headings" color={settings.darkModeColors.heading} onChange={c => updateModeColors('darkModeColors', { heading: c })} />
                <ColorRow label="Links" color={settings.darkModeColors.link} onChange={c => updateModeColors('darkModeColors', { link: c })} />
            </OptionsGroup>
        </>
    );

    const renderTaskDefaults = () => (
        <OptionsGroup title="Task defaults">
            <FormRow label="Task duration">
                <input
                    type="number"
                    min="1"
                    value={settings.defaultTaskDuration}
                    onChange={e => applyNow({ defaultTaskDuration: parseInt(e.target.value, 10) || 1 })}
                    className={`${FIELD} w-20 text-center`}
                />
                <span className="text-xs text-[#6d7368] dark:text-gray-400">days</span>
            </FormRow>
        </OptionsGroup>
    );


    const renderHome = () => (
        <OptionsGroup title="Dashboard layout">
            <p className="text-xs leading-relaxed text-[#50564d] dark:text-gray-400">Restoring the default layout removes any custom widgets and arrangements you've made.</p>
            <div>
                <button
                    type="button"
                    onClick={() => {
                        if (window.confirm('Are you sure you want to reset your dashboard layout?')) {
                            applyNow({ homeScreenLayout: defaultLayout });
                        }
                    }}
                    className={BUTTON_SECONDARY}
                >
                    Reset layout
                </button>
            </div>
        </OptionsGroup>
    );



    if (!isOpen) return null;

    const shortcutLabel = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘F' : 'Ctrl+F';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 backdrop-blur-[5px] animate-fade-in min-[721px]:p-6" onClick={onClose}>
            <div
                ref={windowRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-title"
                onClick={e => e.stopPropagation()}
                className={`flex h-[96dvh] w-full flex-col overflow-hidden rounded-lg border border-[#cfcfc9] bg-white text-[#292c31] shadow-2xl dark:border-gray-700 dark:bg-[#1e2024] dark:text-gray-100 min-[721px]:h-[min(760px,92vh)] min-[721px]:w-[min(1040px,96vw)]`}
            >
                {/* Title bar */}
                <header className={`flex min-h-[54px] flex-shrink-0 items-center gap-2.5 border-b ${LINE} px-5`}>
                    <LabtrailLogo className="h-7 w-7" />
                    <h2 id="settings-title" className="text-[15px] font-semibold">Labtrail Options</h2>
                    <button type="button" aria-label="Close settings" onClick={onClose} className="ml-auto grid h-[34px] w-[34px] place-items-center rounded-[3px] text-[#50564d] transition-colors hover:bg-[#f0efeb] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:text-gray-300 dark:hover:bg-gray-800">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24"><path d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] min-[461px]:grid-cols-[160px_minmax(0,1fr)] min-[461px]:grid-rows-1 min-[721px]:grid-cols-[218px_minmax(0,1fr)]">
                    {/* Categories */}
                    <aside className={`flex min-h-0 min-w-0 flex-col border-b ${LINE} bg-[#f7f7f4] dark:bg-[#17181b] min-[461px]:border-b-0 min-[461px]:border-r`}>
                        <div className="mx-3 my-2 flex items-center gap-1.5 rounded-[3px] border border-[#cfcfc9] bg-white px-2 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent dark:border-gray-600 dark:bg-gray-800 min-[461px]:mx-2.5 min-[461px]:my-3.5 min-[721px]:mx-3.5 min-[721px]:mb-3.5 min-[721px]:mt-5">
                            <svg aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-[#6d7368] dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
                            <input
                                ref={searchRef}
                                id="settings-search"
                                type="search"
                                value={query}
                                onChange={e => { setQuery(e.target.value); }}
                                placeholder="Find a setting"
                                aria-label="Find a setting"
                                className="h-[34px] w-full min-w-0 border-0 bg-transparent p-0 text-xs text-[#292c31] placeholder-[#6d7368] focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-400"
                            />
                            <kbd className="hidden whitespace-nowrap font-sans text-[10px] text-[#6d7368] dark:text-gray-400 min-[721px]:inline">{shortcutLabel}</kbd>
                        </div>
                        <div role="tablist" aria-label="Settings categories" aria-orientation="vertical" onKeyDown={handleNavKeyDown} className="flex min-h-0 flex-1 flex-row gap-0.5 overflow-auto px-2 pb-2 [scrollbar-width:none] min-[461px]:flex-col min-[461px]:px-0 min-[461px]:py-1">
                            {PAGES.map(p => {
                                const isActive = !trimmedQuery && page === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        tabIndex={page === p.id ? 0 : -1}
                                        onClick={() => openPage(p.id)}
                                        className={`flex-none whitespace-nowrap border-b-2 px-2.5 py-1.5 text-left text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent min-[461px]:min-h-[40px] min-[461px]:whitespace-normal min-[461px]:border-b-0 min-[461px]:border-l-[3px] min-[461px]:px-3 min-[461px]:py-2.5 min-[721px]:px-5 min-[721px]:text-[13px] ${isActive
                                            ? 'border-accent bg-accent-soft font-semibold text-accent-strong dark:bg-accent/15 dark:text-accent-light'
                                            : 'border-transparent text-[#50564d] hover:bg-[#f0efeb] dark:text-gray-300 dark:hover:bg-gray-800/60'}`}
                                    >
                                        {p.title}
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Page */}
                    <main className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-white dark:bg-[#1e2024]">
                        <div className="flex-none px-[18px] pt-5 min-[721px]:px-8 min-[721px]:pt-[26px]">
                            <h2 className="mb-1.5 text-[23px] font-medium">{trimmedQuery ? 'Find a setting' : pageInfo.title}</h2>
                            <p className="text-[12.5px] leading-relaxed text-[#50564d] dark:text-gray-400">{trimmedQuery ? 'Search across all preferences. Select a result to open its category.' : pageInfo.description}</p>
                        </div>
                        {trimmedQuery ? (
                            <div className="flex-1 overflow-auto px-[18px] py-5 min-[721px]:px-8">
                                <p role="status" className="mb-4 text-[13px] text-[#6d7368] dark:text-gray-400">
                                    {searchResults.length ? `${searchResults.length} matching ${searchResults.length === 1 ? 'group' : 'groups'}` : 'No matching settings.'}
                                </p>
                                {searchResults.map(result => (
                                    <button
                                        key={`${result.page}-${result.group}`}
                                        type="button"
                                        onClick={() => { openPage(result.page); setPendingGroup(result.group); }}
                                        className={`block w-full border-b ${LINE} py-4 text-left transition-colors hover:text-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent dark:hover:text-accent-light`}
                                    >
                                        <strong className="block text-[13px] font-semibold">{result.group}</strong>
                                        <span className="mt-1 block text-xs text-[#6d7368] dark:text-gray-400">{result.pageTitle}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div key={page} ref={bodyRef} role="tabpanel" aria-label={pageInfo.title} className="flex flex-1 flex-col gap-[25px] overflow-auto px-[18px] pb-[30px] pt-5 min-[721px]:px-8 min-[721px]:pt-[25px]">
                                {page === 'general' && renderGeneral()}
                                {page === 'calendar' && projectData && <CalendarSyncPanel projectData={projectData} onSetData={onSetData} />}
                                {page === 'home' && renderHome()}
                            </div>
                        )}
                    </main>
                </div>

                {/* Footer */}
                <footer className={`flex min-h-[64px] flex-shrink-0 items-center justify-end gap-2.5 border-t ${LINE} bg-[#f7f7f4] px-3.5 py-3 dark:bg-[#17181b] min-[721px]:px-5`}>
                    <button type="button" onClick={onClose} className={BUTTON_SECONDARY}>Done</button>
                </footer>
            </div>
        </div>
    );
};

export default SettingsModal;
