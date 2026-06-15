
import React, { useState } from 'react';
import Modal from './Modal';
import { AppSettings, NotesSettings, TypographySettings, WidgetLayout } from '../types';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { PaintBrushIcon } from './icons/PaintBrushIcon';
import { TextColorIcon } from './icons/TextColorIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { HomeIcon } from './icons/HomeIcon';
import { AdjustmentsHorizontalIcon } from './icons/AdjustmentsHorizontalIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSettings: AppSettings;
    onSave: (settings: AppSettings) => void;
    defaultLayout: WidgetLayout[];
}

const TABS = {
    APPEARANCE: 'Appearance',
    TYPOGRAPHY: 'Typography',
    NOTES: 'Notes',
    HOME_SCREEN: 'Home Screen',
    PREFERENCES: 'Preferences',
    HELP: 'Help',
};

// Reusable components for the "Apple Settings" look
const SettingsSection: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        {title && <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-3">{title}</h4>}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden shadow-sm">
            {children}
        </div>
    </div>
);

const SettingsRow: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = "", onClick }) => (
    <div 
        onClick={onClick}
        className={`px-4 py-3.5 flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
        {children}
    </div>
);

const ColorSettingRow: React.FC<{label: string, color: string, onChange: (c: string) => void}> = ({label, color, onChange}) => (
    <div className="flex items-center justify-between w-full">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-mono uppercase">{color}</span>
            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm ring-1 ring-black/5">
                <input 
                    type="color" 
                    value={color} 
                    onChange={e => onChange(e.target.value)} 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] p-0 border-0 cursor-pointer" 
                />
            </div>
        </div>
    </div>
);

const HelpContent: React.FC = () => (
    <div className="prose prose-sm dark:prose-invert max-w-none animate-fade-in max-h-[450px] overflow-y-auto pr-4">
        <h2>Welcome to Project Guru!</h2>
        <p>This guide will walk you through the key features of the application.</p>
        
        <h4>Navigation</h4>
        <p>The main navigation is on the left-side ribbon. It gives you access to all major views:</p>
        <ul>
            <li><strong>Home:</strong> A dashboard overview of your project.</li>
            <li><strong>Gantt:</strong> The main Gantt chart timeline view.</li>
            <li><strong>Tasks:</strong> A powerful list-based view of all your tasks.</li>
            <li><strong>Calendar:</strong> A familiar calendar interface for meetings and tasks.</li>
            <li><strong>Notes:</strong> A dedicated space for all your project documentation.</li>
        </ul>
        <p>Quick action buttons for adding tasks and notes are also located on the ribbon, along with the global settings.</p>

        <h4>Gantt Chart</h4>
        <ul>
            <li><strong>Tasks:</strong> Drag tasks horizontally to change their dates, or drag their edges to change their duration.</li>
            <li><strong>Dependencies:</strong> Open a task's detail panel to create links. Prerequisite tasks must be completed before the current task can start.</li>
            <li><strong>Smart Scrolling:</strong> When dragging a task near the edge of the screen, the timeline will automatically scroll.</li>
            <li><strong>View Modes:</strong> Use the controls at the bottom right to switch between Day, Week, and Month views for the timeline.</li>
        </ul>
        
        <h4>Notes App</h4>
        <p>The notes editor supports Markdown and some special syntax for powerful linking.</p>
        <ul>
            <li><strong>Headings:</strong> Start a line with <code>#</code>, <code>##</code>, or <code>###</code>.</li>
            <li><strong>Styling:</strong> Wrap text in <code>_text_</code> for <strong>bold</strong> and <code>__text__</code> for <em>italics</em>.</li>
            <li><strong>Note Links:</strong> Link to another note by title using <code>[[Note Title]]</code>.</li>
            <li><strong>Task Links:</strong> Link to a task by name using <code>[[task:Task Name]]</code>.</li>
            <li><strong>Mentions:</strong> Mention a team member with <code>@Username</code>.</li>
            <li><strong>Tags:</strong> Add tags with <code>#tagname</code>.</li>
            <li><strong>Callouts:</strong> Create styled boxes for important information.
                <pre><code>{`> [!info] This is an info callout.\n> [!warning] This is a warning.\n> [!success] This is a success message.\n> [!danger] This is a danger alert.`}</code></pre>
            </li>
            <li><strong>Organization:</strong> Drag and drop notes in the sidebar to reorder or nest them.</li>
        </ul>
        
        <h4>Settings & Customization</h4>
        <p>Open the Settings modal from the ribbon to personalize your experience.</p>
        <ul>
            <li><strong>Appearance:</strong> Change the theme color, switch to dark mode, and even customize the color of the sidebar and its icons.</li>
            <li><strong>Typography:</strong> Set a global font and font size for the application.</li>
            <li><strong>Notes Theming:</strong> You have granular control over the appearance of your notes, from fonts and heading colors to the specific styles for hashtags and callouts.</li>
            <li><strong>Home Screen:</strong> Reset your home screen widget layout to the default arrangement.</li>
        </ul>

        <h4>Keyboard Shortcuts</h4>
        <p>Press <code>?</code> anywhere in the app to see a list of available keyboard shortcuts for quick navigation and actions.</p>
    </div>
);


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentSettings, onSave, defaultLayout }) => {
    const [settings, setSettings] = useState<AppSettings>(() => JSON.parse(JSON.stringify(currentSettings)));
    const [activeTab, setActiveTab] = useState(TABS.APPEARANCE);

    const handleSave = () => {
        onSave(settings);
        onClose();
    };
    
    const handleThemeChange = (themeId: string) => {
        setSettings(s => ({...s, activeThemeId: themeId}));
    }

    const toggleDarkMode = () => {
        setSettings(s => ({ ...s, darkMode: !s.darkMode }));
    }

    const tabs = [
        { id: TABS.APPEARANCE, label: 'Appearance', icon: <PaintBrushIcon className="w-5 h-5"/> },
        { id: TABS.TYPOGRAPHY, label: 'Typography', icon: <TextColorIcon className="w-5 h-5"/> },
        { id: TABS.NOTES, label: 'Notes', icon: <DocumentTextIcon className="w-5 h-5"/> },
        { id: TABS.HOME_SCREEN, label: 'Home Screen', icon: <HomeIcon className="w-5 h-5"/> },
        { id: TABS.PREFERENCES, label: 'Preferences', icon: <AdjustmentsHorizontalIcon className="w-5 h-5"/> },
        { id: TABS.HELP, label: 'Help', icon: <QuestionMarkCircleIcon className="w-5 h-5"/> },
    ];

    const renderAppearanceSettings = () => (
        <div className="animate-fade-in">
            <SettingsSection>
                <SettingsRow>
                    <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">Dark Mode</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">Use a dark color scheme</span>
                    </div>
                    <button
                        onClick={toggleDarkMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings.darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${settings.darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </SettingsRow>
            </SettingsSection>

            <SettingsSection title="Theme">
                <SettingsRow>
                    <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Accent Color</span>
                        <div className="flex items-center gap-2">
                            {settings.themes.map(theme => (
                                <button
                                    key={theme.id}
                                    onClick={() => handleThemeChange(theme.id)}
                                    className={`w-6 h-6 rounded-full transition-all focus:outline-none flex items-center justify-center ${settings.activeThemeId === theme.id ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800 scale-110' : 'hover:scale-110'}`}
                                    style={{ backgroundColor: theme.colors['500'] }}
                                    title={theme.name}
                                >
                                    {settings.activeThemeId === theme.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </SettingsRow>
            </SettingsSection>

            <SettingsSection title="Sidebar">
                <SettingsRow>
                    <ColorSettingRow label="Background" color={settings.sidebarBg} onChange={c => setSettings(s => ({ ...s, sidebarBg: c }))} />
                </SettingsRow>
                <SettingsRow>
                    <ColorSettingRow label="Icon Color" color={settings.iconColor} onChange={c => setSettings(s => ({ ...s, iconColor: c }))} />
                </SettingsRow>
            </SettingsSection>
        </div>
    );
    
    const renderPreferencesSettings = () => (
        <div className="animate-fade-in">
             <SettingsSection title="Defaults">
                <SettingsRow>
                    <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">Task Duration</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">Default days for new tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="default-duration"
                            type="number"
                            value={settings.defaultTaskDuration}
                            onChange={(e) => setSettings(s => ({...s, defaultTaskDuration: parseInt(e.target.value, 10) || 1}))}
                            min="1"
                            className="w-16 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 text-center text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-500))]"
                        />
                        <span className="text-sm text-gray-500">days</span>
                    </div>
                </SettingsRow>
            </SettingsSection>
        </div>
    );

    const renderTypographySettings = () => (
        <div className="animate-fade-in">
            <SettingsSection title="Global Font">
                <SettingsRow>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Font Family</span>
                    <select
                        value={settings.typography.fontFamily}
                        onChange={(e) => setSettings(s => ({ ...s, typography: { ...s.typography, fontFamily: e.target.value as TypographySettings['fontFamily'] } }))}
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-1 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-500))]"
                    >
                        <option value="Inter">Inter</option>
                        <option value="Lora">Lora</option>
                        <option value="Inconsolata">Inconsolata</option>
                    </select>
                </SettingsRow>
                <SettingsRow>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Base Size</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={settings.typography.fontSize}
                            onChange={(e) => setSettings(s => ({ ...s, typography: { ...s.typography, fontSize: parseInt(e.target.value, 10) || 16 } }))}
                            min="12"
                            max="24"
                            className="w-16 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 text-center text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-500))]"
                        />
                        <span className="text-sm text-gray-500">px</span>
                    </div>
                </SettingsRow>
            </SettingsSection>

            <SettingsSection title="Light Mode Colors">
                <SettingsRow>
                    <ColorSettingRow label="Body Text" color={settings.lightModeColors.text} onChange={c => setSettings(s => ({...s, lightModeColors: {...s.lightModeColors, text: c}}))} />
                </SettingsRow>
                <SettingsRow>
                    <ColorSettingRow label="Headings" color={settings.lightModeColors.heading} onChange={c => setSettings(s => ({...s, lightModeColors: {...s.lightModeColors, heading: c}}))} />
                </SettingsRow>
                <SettingsRow>
                    <ColorSettingRow label="Links" color={settings.lightModeColors.link} onChange={c => setSettings(s => ({...s, lightModeColors: {...s.lightModeColors, link: c}}))} />
                </SettingsRow>
            </SettingsSection>

            <SettingsSection title="Dark Mode Colors">
                <SettingsRow>
                    <ColorSettingRow label="Body Text" color={settings.darkModeColors.text} onChange={c => setSettings(s => ({...s, darkModeColors: {...s.darkModeColors, text: c}}))} />
                </SettingsRow>
                <SettingsRow>
                    <ColorSettingRow label="Headings" color={settings.darkModeColors.heading} onChange={c => setSettings(s => ({...s, darkModeColors: {...s.darkModeColors, heading: c}}))} />
                </SettingsRow>
                <SettingsRow>
                    <ColorSettingRow label="Links" color={settings.darkModeColors.link} onChange={c => setSettings(s => ({...s, darkModeColors: {...s.darkModeColors, link: c}}))} />
                </SettingsRow>
            </SettingsSection>
        </div>
    );
    
    const renderNotesSettings = () => (
        <div className="animate-fade-in h-full overflow-y-auto pr-2">
            <SettingsSection title="Editor">
                <SettingsRow>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Font Family</span>
                    <select
                        value={settings.notesSettings.typography.fontFamily}
                        onChange={(e) => setSettings(s => ({...s, notesSettings: {...s.notesSettings, typography: {...s.notesSettings.typography, fontFamily: e.target.value as any}} }))}
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-1 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-500))]"
                    >
                        <option value="Inter">Inter</option>
                        <option value="Lora">Lora</option>
                        <option value="Inconsolata">Inconsolata</option>
                    </select>
                </SettingsRow>
                <SettingsRow>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Font Size</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={settings.notesSettings.typography.fontSize}
                            onChange={(e) => setSettings(s => ({...s, notesSettings: {...s.notesSettings, typography: {...s.notesSettings.typography, fontSize: parseInt(e.target.value) || 16}} }))}
                            min="12" max="24"
                            className="w-16 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 text-center text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-500))]"
                        />
                        <span className="text-sm text-gray-500">px</span>
                    </div>
                </SettingsRow>
            </SettingsSection>

             <SettingsSection title="Syntax Highlighting">
                <SettingsRow>
                    <ColorSettingRow label="Heading 1" color={settings.notesSettings.colors.h1} onChange={c => setSettings(s => ({...s, notesSettings: {...s.notesSettings, colors: {...s.notesSettings.colors, h1: c}}}))} />
                </SettingsRow>
                <SettingsRow>
                    <ColorSettingRow label="Heading 2" color={settings.notesSettings.colors.h2} onChange={c => setSettings(s => ({...s, notesSettings: {...s.notesSettings, colors: {...s.notesSettings.colors, h2: c}}}))} />
                </SettingsRow>
                <SettingsRow>
                    <ColorSettingRow label="Heading 3" color={settings.notesSettings.colors.h3} onChange={c => setSettings(s => ({...s, notesSettings: {...s.notesSettings, colors: {...s.notesSettings.colors, h3: c}}}))} />
                </SettingsRow>
                <SettingsRow>
                    <ColorSettingRow label="Bold Text" color={settings.notesSettings.colors.strong} onChange={c => setSettings(s => ({...s, notesSettings: {...s.notesSettings, colors: {...s.notesSettings.colors, strong: c}}}))} />
                </SettingsRow>
                <SettingsRow>
                    <ColorSettingRow label="Italic Text" color={settings.notesSettings.colors.em} onChange={c => setSettings(s => ({...s, notesSettings: {...s.notesSettings, colors: {...s.notesSettings.colors, em: c}}}))} />
                </SettingsRow>
            </SettingsSection>

            <SettingsSection title="Components">
                <SettingsRow>
                    <ColorSettingRow label="Hashtag Background" color={settings.notesSettings.colors.hashtagBg} onChange={c => setSettings(s => ({...s, notesSettings: {...s.notesSettings, colors: {...s.notesSettings.colors, hashtagBg: c}}}))} />
                </SettingsRow>
                <SettingsRow>
                    <ColorSettingRow label="Hashtag Text" color={settings.notesSettings.colors.hashtagText} onChange={c => setSettings(s => ({...s, notesSettings: {...s.notesSettings, colors: {...s.notesSettings.colors, hashtagText: c}}}))} />
                </SettingsRow>
            </SettingsSection>
        </div>
    );
    
    const renderHomeScreenSettings = () => (
        <div className="animate-fade-in">
             <SettingsSection>
                <div className="p-6 flex flex-col items-center text-center">
                    <HomeIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">Reset to Default Layout</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">Restoring the default layout will remove any custom widgets and arrangements you've made.</p>
                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to reset your dashboard layout?")) {
                                 setSettings(s => ({ ...s, homeScreenLayout: defaultLayout }));
                            }
                        }}
                        className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-sm"
                    >
                        Reset Layout
                    </button>
                </div>
            </SettingsSection>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings" maxWidth="max-w-5xl">
            <div className="flex h-[600px] -m-8">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md border-r border-gray-200 dark:border-gray-700 p-3 flex flex-col">
                    <nav className="space-y-1 flex-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === tab.id 
                                        ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                <div className={activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}>
                                    {tab.icon}
                                </div>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-[10px] text-center text-gray-400 uppercase tracking-widest font-semibold">
                        Project Guru v1.3.0
                    </div>
                </aside>
                
                {/* Content Area */}
                <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex-1 overflow-y-auto p-8">
                        {activeTab === TABS.APPEARANCE && renderAppearanceSettings()}
                        {activeTab === TABS.TYPOGRAPHY && renderTypographySettings()}
                        {activeTab === TABS.NOTES && renderNotesSettings()}
                        {activeTab === TABS.HOME_SCREEN && renderHomeScreenSettings()}
                        {activeTab === TABS.PREFERENCES && renderPreferencesSettings()}
                        {activeTab === TABS.HELP && <HelpContent />}
                    </div>
                    
                    {/* Footer */}
                    <div className="flex-shrink-0 px-8 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-white dark:bg-gray-900">
                        <button onClick={onClose} className="px-5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium text-gray-600 dark:text-gray-400">Cancel</button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-semibold text-white shadow-md shadow-blue-500/20"
                        >
                            Save Changes
                        </button>
                    </div>
                </main>
            </div>
        </Modal>
    );
};

export default SettingsModal;
