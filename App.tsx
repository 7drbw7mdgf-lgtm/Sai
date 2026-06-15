
import React, { useState, useEffect, useCallback } from 'react';
import {
    AppState, View, ProjectData, Task, Group, Person, Meeting, AppSettings,
    Job, SearchResult, Note, TypographySettings, ColorSettings, NotesSettings,
    WidgetLayout, WidgetType, Experiment
} from './types';
import { useHistory } from './hooks/useHistory';
import { useDebounce } from './hooks/useDebounce';
import {
    DUMMY_PROJECT_START_DATE, DUMMY_PROJECT_END_DATE, DUMMY_TASKS, DUMMY_GROUPS, DUMMY_PEOPLE,
    DUMMY_CUSTOM_FIELDS, DUMMY_DESIGN_LAYOUT, DUMMY_ASSIGNMENTS, DUMMY_NOTES, DEFAULT_THEMES
} from './constants';
import SideNavbar from './components/SideNavbar';
import Header from './components/Header';
import GanttChart from './components/GanttChart';
import SplashScreen from './components/SplashScreen';
import TasksView from './components/TasksView';
import CalendarView from './components/CalendarView';
import NotesView from './components/NotesView';
import HomeScreen from './components/HomeScreen';
import AddTaskPanel from './components/AddTaskModal';
import TaskDetailPanel from './components/TaskDetailPanel';
import AddMeetingModal from './components/AddMeetingModal';
import MeetingDetailPanel from './components/MeetingDetailPanel';
import PeopleManagementHub from './components/PeopleManagementHub';
import ShortcutHelpModal from './components/ShortcutHelpModal';
import TimeframeModal from './components/TimeframeModal';
import SettingsModal from './components/SettingsModal';
import PlaceholderView from './components/PlaceholderView';
import ExperimentDetailPanel from './components/ExperimentDetailPanel';
import AIAssistantPanel from './components/AIAssistantPanel';

const defaultHomeScreenLayout: WidgetLayout[] = [
    // Left Column: Tasks take priority
    { i: 'my-tasks', type: WidgetType.MyTasks, x: 0, y: 0, w: 4, h: 8 },
    
    // Middle Column: Meetings and Timeline
    { i: 'upcoming-meetings', type: WidgetType.UpcomingMeetings, x: 4, y: 0, w: 4, h: 4 },
    { i: 'project-timeline', type: WidgetType.ProjectTimeline, x: 4, y: 4, w: 4, h: 4 },

    // Right Column: Notes and Team
    { i: 'notes-overview', type: WidgetType.NotesOverview, x: 8, y: 0, w: 4, h: 5 },
    { i: 'team', type: WidgetType.Team, x: 8, y: 5, w: 4, h: 3 },
];

const initialSettings: AppSettings = {
    activeThemeId: 'blue',
    themes: DEFAULT_THEMES,
    darkMode: false,
    defaultTaskDuration: 1,
    sidebarBg: '#ffffff',
    iconColor: '#6b7280',
    typography: {
        fontFamily: 'Inter',
        fontSize: 16,
    },
    lightModeColors: {
        text: '#374151',
        heading: '#111827',
        link: '#2563eb',
    },
    darkModeColors: {
        text: '#d1d5db',
        heading: '#f9fafb',
        link: '#60a5fa',
    },
    notesSettings: {
        typography: {
            fontFamily: 'Inter',
            fontSize: 16,
        },
        colors: {
            h1: '#111827', h2: '#1f2937', h3: '#374151',
            strong: '#111827', em: '#111827',
            hashtagBg: '#e5e7eb', hashtagText: '#4b5563',
        },
        callouts: {
            info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
            warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
            success: { bg: '#f0fdf4', border: '#22c55e', text: '#14532d' },
            danger: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
            text: { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
        },
    },
    homeScreenLayout: defaultHomeScreenLayout,
};

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.SPLASH);
    const [projectData, setProjectData, undo, redo, canUndo, canRedo] = useHistory<ProjectData | null>(null);
    const [currentView, setCurrentView] = useState<View>(View.HOME);
    
    const [ganttViewMode, setGanttViewMode] = useState<'day' | 'week' | 'month'>('day');
    const GANTT_ZOOM_LEVELS: { [key in 'day' | 'week' | 'month']: number } = { day: 40, week: 10, month: 2 };
    const zoom = GANTT_ZOOM_LEVELS[ganttViewMode];

    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const storedSettings = localStorage.getItem('project-guru-settings');
            if (storedSettings) {
                const parsed: AppSettings = JSON.parse(storedSettings);
                if (!parsed.homeScreenLayout || parsed.homeScreenLayout.length === 0) {
                    parsed.homeScreenLayout = defaultHomeScreenLayout;
                }
                if (!parsed.themes || parsed.themes.length === 0) {
                    parsed.themes = DEFAULT_THEMES;
                }
                if (!parsed.activeThemeId || !parsed.themes.find(t => t.id === parsed.activeThemeId)) {
                    parsed.activeThemeId = DEFAULT_THEMES[0].id;
                }
                return parsed;
            }
        } catch (e) { console.error("Failed to load settings:", String(e)); }
        return initialSettings;
    });

    const handleSaveSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
        try {
            localStorage.setItem('project-guru-settings', JSON.stringify(newSettings));
        } catch (e) { console.error("Failed to save settings:", String(e)); }
    };

    const [isAddTaskPanelOpen, setIsAddTaskPanelOpen] = useState(false);
    const [isAddMeetingPanelOpen, setIsAddMeetingPanelOpen] = useState(false);
    
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
    const [editingExperimentId, setEditingExperimentId] = useState<string | null>(null);
    
    const [isPeopleHubOpen, setIsPeopleHubOpen] = useState(false);
    const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
    const [isTimeframeModalOpen, setIsTimeframeModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

    const [dependencyLink, setDependencyLink] = useState<{ type: 'prerequisite' | 'postrequisite', fromTaskId: string } | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const debouncedSearchQuery = useDebounce(searchQuery, 200);
    const isSearchPanelOpen = isSearchFocused && debouncedSearchQuery.length > 0;
    const [initialPersonIdForHub, setInitialPersonIdForHub] = useState<string | null>(null);

    useEffect(() => {
        if (debouncedSearchQuery && projectData) {
            const lowercasedQuery = debouncedSearchQuery.toLowerCase();
            const results: SearchResult[] = [];
            
            projectData.tasks.forEach(item => { if (item.name.toLowerCase().includes(lowercasedQuery) || (item.tags || []).some(tag => tag.toLowerCase().includes(lowercasedQuery))) results.push({ type: 'task', data: item }); });
            projectData.meetings.forEach(item => { if (item.title.toLowerCase().includes(lowercasedQuery)) results.push({ type: 'meeting', data: item }); });
            projectData.people.forEach(item => { if (item.name.toLowerCase().includes(lowercasedQuery) || `@${item.name.toLowerCase()}`.includes(lowercasedQuery)) results.push({ type: 'person', data: item }); });
            projectData.notes.forEach(item => { 
                const contentLower = item.content.toLowerCase();
                const hashTags = (item.content.match(/#(\w+)/g) || []).map(t => t.substring(1).toLowerCase());
                if (item.title.toLowerCase().includes(lowercasedQuery) || contentLower.includes(lowercasedQuery) || (item.tags || []).some(tag => tag.toLowerCase().includes(lowercasedQuery)) || hashTags.some(tag => tag.includes(lowercasedQuery))) {
                    results.push({ type: 'note', data: item });
                }
            });
            (projectData.experiments || []).forEach((item: Experiment) => { if (item.name.toLowerCase().includes(lowercasedQuery)) results.push({ type: 'experiment', data: item }); });
            
            const uniqueResults = [...new Map(results.map(item => [`${item.type}-${item.data.id}`, item])).values()];
            setSearchResults(uniqueResults);
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearchQuery, projectData]);

    const handleSearchResultSelect = (item: SearchResult) => {
        setIsSearchFocused(false);
        setSearchQuery('');
        switch (item.type) {
            case 'task':
                setEditingTaskId(item.data.id);
                break;
            case 'meeting':
                setEditingMeetingId(item.data.id);
                break;
            case 'person':
                setInitialPersonIdForHub(item.data.id);
                setIsPeopleHubOpen(true);
                break;
            case 'note':
                setCurrentView(View.NOTES);
                break;
            case 'experiment':
                setEditingExperimentId(item.data.id);
                break;
        }
    };

    const handleRequestEditTaskFromNote = (taskName: string) => {
        if (!projectData) return;
        const task = projectData.tasks.find(t => t.name.toLowerCase() === taskName.toLowerCase());
        if (task) {
            setEditingTaskId(task.id);
        }
    };

    useEffect(() => {
        const root = document.documentElement;
        if (settings.darkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        
        const activeTheme = settings.themes.find(t => t.id === settings.activeThemeId) || settings.themes[0] || DEFAULT_THEMES[0];
        if (activeTheme) {
            Object.entries(activeTheme.colors).forEach(([key, value]) => {
                const rgb = String(value).substring(1).match(/.{1,2}/g)?.map(x => parseInt(x, 16)).join(' ');
                if (rgb) {
                    root.style.setProperty(`--color-primary-${key}`, rgb);
                }
            });
        }
        
        const fontMap: { [key: string]: string } = {
            'Inter': 'Inter, sans-serif',
            'Lora': 'Lora, serif',
            'Inconsolata': 'Inconsolata, monospace'
        };
        root.style.setProperty('--font-family-body', fontMap[settings.typography.fontFamily]);
        root.style.setProperty('--font-size-base', `${settings.typography.fontSize}px`);
        
        const colors = settings.darkMode ? settings.darkModeColors : settings.lightModeColors;
        root.style.setProperty('--text-color-base', colors.text);
        root.style.setProperty('--text-color-heading', colors.heading);
        root.style.setProperty('--text-color-link', colors.link);
        
        root.style.setProperty('--sidebar-bg', settings.sidebarBg);
        root.style.setProperty('--sidebar-icon-color', settings.iconColor);

    }, [settings]);

    useEffect(() => {
        const root = document.documentElement;
        const notes = settings.notesSettings;
        const fontMap: { [key: string]: string } = {
            'Inter': 'Inter, sans-serif',
            'Lora': 'Lora, serif',
            'Inconsolata': 'Inconsolata, monospace'
        };
        root.style.setProperty('--notes-font-family', fontMap[notes.typography.fontFamily]);
        root.style.setProperty('--notes-font-size', `${notes.typography.fontSize}px`);

        Object.entries(notes.colors).forEach(([key, value]) => {
            const cssVar = `--notes-color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            root.style.setProperty(cssVar, String(value));
        });
        Object.entries(notes.callouts).forEach(([type, colors]) => {
            Object.entries(colors).forEach(([prop, value]) => {
                 root.style.setProperty(`--notes-callout-${type}-${prop}`, String(value));
            });
        });
    }, [settings.notesSettings]);
    
    const handleLoadDemo = () => {
        const data: ProjectData = {
            projectStartDate: DUMMY_PROJECT_START_DATE,
            projectEndDate: DUMMY_PROJECT_END_DATE,
            tasks: DUMMY_TASKS.map(t => ({...t, startDate: new Date(t.startDate), endDate: new Date(t.endDate)})),
            groups: DUMMY_GROUPS,
            people: DUMMY_PEOPLE,
            meetings: [],
            notes: DUMMY_NOTES,
            assignments: DUMMY_ASSIGNMENTS.map(a => ({...a, startDate: new Date(a.startDate), endDate: new Date(a.endDate)})),
            jobs: [],
            designLayout: DUMMY_DESIGN_LAYOUT,
            customFields: DUMMY_CUSTOM_FIELDS,
            experiments: [],
        };
        setProjectData(data);
        setAppState(AppState.MAIN);
    };

    const handleDatesSelected = (start: Date, end: Date) => {
        const data: ProjectData = {
            projectStartDate: start,
            projectEndDate: end,
            tasks: [], groups: [], people: [], meetings: [], notes: [],
            assignments: [], jobs: [], designLayout: { tasks: {}, groups: {} }, customFields: [],
        };
        setProjectData(data);
        setAppState(AppState.MAIN);
    };

    const handleAddTask = (newTask: Task) => {
        if (!projectData) return;
        setProjectData({ ...projectData, tasks: [...projectData.tasks, newTask] });
        setIsAddTaskPanelOpen(false);
    };

    const handleDeleteTask = (taskId: string) => {
        if (!projectData) return;
        setProjectData(p => { if (!p) return null; return { ...p, tasks: p.tasks.filter(t => t.id !== taskId), assignments: (p.assignments || []).filter(a => a.taskId !== taskId) } });
        setEditingTaskId(null);
    };
     const handleDeleteAssignment = (assignmentId: string) => {
        if (!projectData) return;
        setProjectData(p => { if (!p) return null; return { ...p, assignments: (p.assignments || []).filter(a => a.id !== assignmentId) } });
    };

    const handleStartLinking = (fromTaskId: string, type: 'prerequisite' | 'postrequisite') => { setDependencyLink({ fromTaskId, type }); setEditingTaskId(null); };

    const handleLinkTask = (toTaskId: string) => {
        if (!dependencyLink || !projectData) return;
        const { fromTaskId, type } = dependencyLink;
        if (fromTaskId === toTaskId) { setDependencyLink(null); return; }
        const sourceId = type === 'prerequisite' ? fromTaskId : toTaskId;
        const targetId = type === 'prerequisite' ? toTaskId : fromTaskId;
        const targetTask = projectData.tasks.find(t => t.id === targetId);
        if (!targetTask || targetTask.dependencies?.includes(sourceId)) { setDependencyLink(null); return; }
        const newTasks = projectData.tasks.map(t => (t.id === targetId) ? { ...t, dependencies: [...(t.dependencies || []), sourceId] } : t);
        setProjectData({ ...projectData, tasks: newTasks });
        setDependencyLink(null);
    };

    const handleRemoveDependency = (sourceId: string, targetId: string) => {
        if (!projectData) return;
        setProjectData(p => ({...p!, tasks: p!.tasks.map(t => (t.id === targetId) ? { ...t, dependencies: (t.dependencies || []).filter(dep => dep !== sourceId) } : t) }));
    };
    
    const handleAddMeeting = (newMeeting: Meeting) => { if (!projectData) return; setProjectData({ ...projectData, meetings: [...projectData.meetings, newMeeting] }); setIsAddMeetingPanelOpen(false); };
    const handleDeleteMeeting = (meetingId: string) => { if (!projectData) return; setProjectData(p => ({...p!, meetings: p!.meetings.filter(m => m.id !== meetingId) })); setEditingMeetingId(null); }
    const handleAddJob = (newJob: Job) => { if (!projectData) return; setProjectData(p => ({ ...p!, jobs: [...(p!.jobs || []), newJob]})); }
    const handleUpdateJob = (jobId: string, updates: Partial<Job>) => { if (!projectData) return; setProjectData(p => ({ ...p!, jobs: (p!.jobs || []).map(j => j.id === jobId ? {...j, ...updates} : j) })); }
    const handleDeleteJob = (jobId: string) => { if (!projectData) return; setProjectData(p => ({...p!, jobs: (p!.jobs || []).filter(j => j.id !== jobId)})); }
    
    const handleDeleteExperiment = (experimentId: string) => {
        if (!projectData) return;
        setProjectData(p => { if (!p) return null; return { ...p, experiments: (p.experiments || []).filter(e => e.id !== experimentId) } });
        setEditingExperimentId(null);
    };

    const handleRemoveExperimentLink = (experimentId: string, taskId: string) => {
        if (!projectData) return;
        setProjectData(p => {
            if (!p || !p.experiments) return p;
            return {
                ...p,
                experiments: p.experiments.map(exp => 
                    exp.id === experimentId 
                        ? { ...exp, linkedTasks: (exp.linkedTasks || []).filter(id => id !== taskId) } 
                        : exp
                )
            };
        });
    };

    const handleKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
        const activeEl = document.activeElement;
        if(activeEl && ['INPUT', 'TEXTAREA'].includes(activeEl.tagName) || activeEl?.hasAttribute('contenteditable')) return;
        if (e.ctrlKey || e.metaKey) return;
        switch (e.key.toUpperCase()) {
            case 'N': setIsAddTaskPanelOpen(true); break;
            case 'H': setCurrentView(View.HOME); break;
            case 'G': setCurrentView(View.GANTT); break;
            case 'T': setCurrentView(View.TASKS); break;
            case 'C': setCurrentView(View.CALENDAR); break;
            case 'E': setCurrentView(View.NOTES); break;
            case '/': e.preventDefault(); document.getElementById('global-search-bar')?.focus(); break;
            case '?': setIsShortcutHelpOpen(o => !o); break;
        }
    }, []);

    useEffect(() => { window.addEventListener('keydown', handleKeyboardShortcuts); return () => window.removeEventListener('keydown', handleKeyboardShortcuts); }, [handleKeyboardShortcuts]);

    const renderView = () => {
        if (!projectData) return null;
        switch (currentView) {
            case View.HOME: 
                return <HomeScreen 
                    projectData={projectData} 
                    onRequestEditMeeting={setEditingMeetingId} 
                    onRequestEditTask={setEditingTaskId} 
                    layout={settings.homeScreenLayout} 
                    onLayoutChange={(newLayout) => handleSaveSettings({...settings, homeScreenLayout: newLayout})} 
                    onTogglePeopleHub={() => setIsPeopleHubOpen(true)} 
                    onRequestAddTask={() => setIsAddTaskPanelOpen(true)}
                    onRequestAddMeeting={() => setIsAddMeetingPanelOpen(true)}
                />;
            case View.GANTT: return <GanttChart projectData={projectData} onSetData={setProjectData} zoom={zoom} ganttViewMode={ganttViewMode} onGanttViewModeChange={setGanttViewMode} onRequestAddTask={() => { setIsAddTaskPanelOpen(true); }} onRequestEditTask={setEditingTaskId} dependencyLink={dependencyLink} onLinkTask={handleLinkTask} onRemoveDependency={handleRemoveDependency} />;
            case View.TASKS: return <TasksView projectData={projectData} onSetData={setProjectData} onRequestEditTask={setEditingTaskId} />;
            case View.CALENDAR: return <CalendarView projectData={projectData} onSetData={setProjectData} onRequestEditTask={setEditingTaskId} onRequestEditMeeting={setEditingMeetingId} />;
            case View.NOTES: return <NotesView projectData={projectData} onSetData={setProjectData} notesSettings={settings.notesSettings} onRequestEditTask={handleRequestEditTaskFromNote} />;
            default: return <PlaceholderView title="Coming Soon" message={`The ${currentView} view is under construction.`} />;
        }
    };
    
    if (appState === AppState.SPLASH) return <SplashScreen onNewProject={() => setAppState(AppState.CALENDAR)} onLoadProject={handleLoadDemo} />;
    if (appState === AppState.CALENDAR) return <SplashScreen isCalendarView onDatesSelected={handleDatesSelected} />;

    return (
        <div className="h-screen w-screen flex font-sans bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
            <SideNavbar currentView={currentView} onViewChange={setCurrentView} onSettings={() => setIsSettingsModalOpen(true)} onAddTask={() => setIsAddTaskPanelOpen(true)} onAddNote={() => { const newNote: Note = { id: `note-${Date.now()}`, title: 'Untitled Note', content: '', tags: [], parentId: null, createdAt: new Date(), updatedAt: new Date(), }; setProjectData(p => p ? { ...p, notes: [...p.notes, newNote] } : p); setCurrentView(View.NOTES); }} onTogglePeopleHub={() => setIsPeopleHubOpen(o => !o)} onToggleAIAssistant={() => setIsAIAssistantOpen(o => !o)} undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo} onOpenShortcutHelp={() => setIsShortcutHelpOpen(true)} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header currentView={currentView} onLoad={handleLoadDemo} onSave={() => {}} onTimeframe={() => setIsTimeframeModalOpen(true)} searchQuery={searchQuery} onSearchChange={setSearchQuery} isSearchPanelOpen={isSearchPanelOpen} onSearchFocusChange={setIsSearchFocused} searchResults={searchResults} onSearchResultSelect={handleSearchResultSelect} projectData={projectData} />
                <main className="flex-1 relative overflow-hidden"> {renderView()} </main>
            </div>
            {(isAddTaskPanelOpen && projectData) && <div className="absolute top-0 right-0 h-full w-[480px] z-50 shadow-2xl"><AddTaskPanel onClose={() => setIsAddTaskPanelOpen(false)} onSave={handleAddTask} people={projectData.people} groups={projectData.groups} customFields={projectData.customFields || []} /></div>}
            {(editingTaskId && projectData) && <div className="absolute top-0 right-0 h-full w-[480px] z-50 shadow-2xl"><TaskDetailPanel taskId={editingTaskId} projectData={projectData} onSetData={setProjectData} onClose={() => setEditingTaskId(null)} onDelete={handleDeleteTask} onDeleteAssignment={handleDeleteAssignment} isOpen={!!editingTaskId} onStartLinking={(type) => handleStartLinking(editingTaskId, type)} onRemoveDependency={handleRemoveDependency} /></div>}
            {(isAddMeetingPanelOpen && projectData) && <div className="absolute top-0 right-0 h-full w-[480px] z-50 shadow-2xl"><AddMeetingModal onClose={() => setIsAddMeetingPanelOpen(false)} onSave={handleAddMeeting} people={projectData.people} /></div>}
            {(editingMeetingId && projectData) && <div className="absolute top-0 right-0 h-full w-[480px] z-50 shadow-2xl"><MeetingDetailPanel meetingId={editingMeetingId} projectData={projectData} onSetData={setProjectData} onClose={() => setEditingMeetingId(null)} onDelete={handleDeleteMeeting} onAddJob={handleAddJob} onUpdateJob={handleUpdateJob} onDeleteJob={handleDeleteJob} isOpen={!!editingMeetingId} /></div>}
            {(isPeopleHubOpen && projectData) && <div className="absolute top-0 right-0 h-full w-[720px] z-50 shadow-2xl"><PeopleManagementHub projectData={projectData} onSetData={setProjectData} onClose={() => { setIsPeopleHubOpen(false); setInitialPersonIdForHub(null); }} initialSelectedPersonId={initialPersonIdForHub} /></div>}
            {(isAIAssistantOpen && projectData) && <AIAssistantPanel isOpen={isAIAssistantOpen} onClose={() => setIsAIAssistantOpen(false)} projectData={projectData} onSetData={setProjectData} />}
            <ShortcutHelpModal isOpen={isShortcutHelpOpen} onClose={() => setIsShortcutHelpOpen(false)} />
            {projectData && <TimeframeModal isOpen={isTimeframeModalOpen} onClose={() => setIsTimeframeModalOpen(false)} currentStart={projectData.projectStartDate} currentEnd={projectData.projectEndDate} onSave={(start, end) => setProjectData({...projectData, projectStartDate: start, projectEndDate: end})} />}
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} currentSettings={settings} onSave={handleSaveSettings} defaultLayout={defaultHomeScreenLayout} />
            {(editingExperimentId && projectData) && <div className="absolute top-0 right-0 h-full w-[480px] z-50 shadow-2xl"><ExperimentDetailPanel experimentId={editingExperimentId} projectData={projectData} onSetData={setProjectData} onClose={() => setEditingExperimentId(null)} onDelete={handleDeleteExperiment} onRemoveLink={handleRemoveExperimentLink} /></div>}
        </div>
    );
};

export default App;
