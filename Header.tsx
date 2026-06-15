
import React, { useState, useRef } from 'react';
// FIX: Added import for ProjectData
import { View, SearchResult, Person, ProjectData } from './types';
import Tooltip from './components/Tooltip';
// FIX: Import DropdownMenu and MenuItem instead of the old FileMenu.
import DropdownMenu, { MenuItem } from './components/FileMenu';
import { useOnClickOutside } from './hooks/useOnClickOutside';
import { ChevronDownIcon } from './components/icons/ChevronIcons';
import { UndoIcon } from './components/icons/UndoIcon';
import { RedoIcon } from './components/icons/RedoIcon';
import { QuestionMarkCircleIcon } from './components/icons/QuestionMarkCircleIcon';
import { PeopleManagementIcon } from './components/icons/PeopleManagementIcon';
import { SearchIcon } from './components/icons/SearchIcon';
import SearchResultsPanel from './components/SearchResultsPanel';
// FIX: Import necessary icons for MenuItems
import { ArrowUpTrayIcon } from './components/icons/ArrowUpTrayIcon';
import { ArrowDownTrayIcon } from './components/icons/ArrowDownTrayIcon';
import { AdjustmentsHorizontalIcon } from './components/icons/AdjustmentsHorizontalIcon';
import { SettingsIcon } from './components/icons/SettingsIcon';

interface HeaderProps {
    currentView: View;
    onViewChange: (view: View) => void;
    onLoad: () => void;
    onSave: () => void;
    onTimeframe: () => void;
    onSettings: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onOpenShortcutHelp: () => void;
    onTogglePeopleHub: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isSearchPanelOpen: boolean;
    searchResults: SearchResult[];
    onSearchResultSelect: (item: SearchResult) => void;
    onSearchClose: () => void;
    // FIX: Changed `people` prop to `projectData` to provide all necessary data to child components like SearchResultsPanel.
    projectData: ProjectData;
}

const Header: React.FC<HeaderProps> = ({
    currentView, onViewChange, onLoad, onSave, onTimeframe, onSettings,
    undo, redo, canUndo, canRedo, onOpenShortcutHelp, onTogglePeopleHub,
    searchQuery, onSearchChange, isSearchPanelOpen, searchResults, onSearchResultSelect, onSearchClose,
    projectData
}) => {
    const searchContainerRef = useRef(null);

    useOnClickOutside(searchContainerRef, onSearchClose);
    
    const mainViews: { id: View, name: string }[] = [
        { id: View.HOME, name: 'Home' },
        { id: View.GANTT, name: 'Gantt' },
        { id: View.TASKS, name: 'Tasks' },
        { id: View.CALENDAR, name: 'Calendar' },
        { id: View.NOTES, name: 'Notes' },
    ];

    return (
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between h-16 flex-shrink-0 z-30">
            <div className="flex items-center gap-4" style={{width: '280px'}}>
                 <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">Project Guru</span>
                 </div>
                 {/* FIX: Replaced old FileMenu implementation with DropdownMenu component */}
                 <DropdownMenu trigger={
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 bg-gray-200/70 dark:bg-gray-700/70 hover:bg-gray-300/70 dark:hover:bg-gray-600/70 px-4 py-2 rounded-full transition-colors">
                        File
                        <ChevronDownIcon className="w-4 h-4" />
                    </div>
                 }>
                    <MenuItem onClick={onLoad} icon={<ArrowUpTrayIcon className="w-5 h-5"/>} text="Load Demo..." />
                    <MenuItem onClick={onSave} icon={<ArrowDownTrayIcon className="w-5 h-5"/>} text="Save Project" />
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                    <MenuItem onClick={onTimeframe} icon={<AdjustmentsHorizontalIcon className="w-5 h-5"/>} text="Adjust Timeframe..." />
                    <MenuItem onClick={onSettings} icon={<SettingsIcon className="w-5 h-5"/>} text="Settings..." />
                 </DropdownMenu>
            </div>
           
            <div className="flex-1 flex justify-center items-center gap-8">
                 <div ref={searchContainerRef} className="relative">
                    <div className="relative">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input
                            id="global-search-bar"
                            type="text"
                            placeholder="Search anything... ( / )"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-80 h-10 pl-10 pr-4 rounded-full bg-gray-100 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                        />
                    </div>
                    {isSearchPanelOpen && searchQuery && (
                        <SearchResultsPanel
                            results={searchResults}
                            onSelect={onSearchResultSelect}
                            // FIX: Pass `projectData` which includes people and other necessary data.
                            projectData={projectData}
                        />
                    )}
                </div>

                 <nav className="flex items-center space-x-2 bg-gray-200/70 dark:bg-gray-800/70 p-1 rounded-full">
                    {mainViews.map(view => (
                        <button
                            key={view.id}
                            onClick={() => onViewChange(view.id)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                                currentView === view.id
                                    ? 'bg-white dark:bg-gray-700 text-[rgb(var(--color-primary-600))] dark:text-gray-100 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10'
                            }`}
                        >
                            {view.name}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="flex items-center justify-end gap-2" style={{width: '280px'}}>
                <Tooltip text="Undo (Ctrl+Z)">
                    <button onClick={undo} disabled={!canUndo} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:hover:bg-transparent transition-colors">
                        <UndoIcon className="w-5 h-5" />
                    </button>
                </Tooltip>
                 <Tooltip text="Redo (Ctrl+Y)">
                    <button onClick={redo} disabled={!canRedo} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:hover:bg-transparent transition-colors">
                        <RedoIcon className="w-5 h-5" />
                    </button>
                </Tooltip>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                <Tooltip text="Keyboard Shortcuts (?)">
                    <button onClick={onOpenShortcutHelp} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <QuestionMarkCircleIcon className="w-6 h-6" />
                    </button>
                </Tooltip>
                <Tooltip text="Manage Team">
                    <button onClick={onTogglePeopleHub} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <PeopleManagementIcon className="w-6 h-6" />
                    </button>
                </Tooltip>
            </div>
        </header>
    );
};

export default Header;