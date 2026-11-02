
import React, { useRef } from 'react';
import BenchlineLogo from './BenchlineLogo';
import { View, SearchResult, ProjectData } from '../types';
import Tooltip from './Tooltip';
import DropdownMenu, { MenuItem } from './FileMenu';
import { ChevronDownIcon } from './icons/ChevronIcons';
import { SearchIcon } from './icons/SearchIcon';
import SearchResultsPanel from './SearchResultsPanel';
import { ArrowUpTrayIcon } from './icons/ArrowUpTrayIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { AdjustmentsHorizontalIcon } from './icons/AdjustmentsHorizontalIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { useOnClickOutside } from '../hooks/useOnClickOutside';


interface HeaderProps {
    currentView: View;
    onLoad: () => void;
    onSave: () => void;
    onRestore: (file: File) => void;
    onTimeframe: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isSearchPanelOpen: boolean;
    onSearchFocusChange: (isFocused: boolean) => void;
    searchResults: SearchResult[];
    onSearchResultSelect: (item: SearchResult) => void;
    projectData: ProjectData | null;
}

const Header: React.FC<HeaderProps> = ({
    currentView,
    onLoad, onSave, onRestore, onTimeframe,
    undo, redo, canUndo, canRedo,
    searchQuery, onSearchChange, isSearchPanelOpen, onSearchFocusChange, searchResults, onSearchResultSelect,
    projectData
}) => {
    
    const searchContainerRef = useRef(null);
    const restoreInputRef = useRef<HTMLInputElement>(null);
    useOnClickOutside(searchContainerRef, () => onSearchFocusChange(false));

    return (
        <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-[#e6e6e2] dark:border-gray-800 px-6 flex items-center justify-between h-[68px] flex-shrink-0 z-30 transition-colors">
            <div className="flex min-w-0 items-center gap-4">
                 <div className="flex min-w-0 items-center gap-3">
                    <div className="flex items-center gap-2 cursor-pointer select-none">
                        <BenchlineLogo className="w-7 h-7" />
                        <span className="text-xl font-extrabold tracking-tight text-[#292c31] dark:text-gray-100 font-['Manrope']">benchline<span className="text-accent">.</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#f4f5f0] dark:bg-gray-800 border border-[#e6e6e2] dark:border-gray-700 rounded-full text-[10.5px] font-bold text-[#626e56] dark:text-[#a3b397] tracking-wider uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8c9a7b]"></span>
                        <span>Workspace</span>
                        <span className="text-gray-300 dark:text-gray-600">/</span>
                        <span className="text-accent font-extrabold">{currentView}</span>
                    </div>
                 </div>

                 <div className="h-5 w-px bg-[#e6e6e2] dark:bg-gray-700 hidden sm:block"></div>

                 <DropdownMenu trigger={
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#f0efeb] dark:hover:bg-gray-800 cursor-pointer text-sm font-semibold text-[#292c31] dark:text-gray-200 transition-colors">
                        <span>File</span>
                        <ChevronDownIcon className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                }>
                    <MenuItem onClick={onLoad} icon={<ArrowUpTrayIcon className="w-5 h-5"/>} text="Load Demo..." />
                    <MenuItem onClick={onSave} icon={<ArrowDownTrayIcon className="w-5 h-5"/>} text="Download Backup" />
                    <MenuItem onClick={() => restoreInputRef.current?.click()} icon={<ArrowUpTrayIcon className="w-5 h-5"/>} text="Restore Backup..." />
                    <div className="h-px bg-[#e6e6e2] dark:bg-gray-700 my-1" />
                    <MenuItem onClick={onTimeframe} icon={<AdjustmentsHorizontalIcon className="w-5 h-5"/>} text="Adjust Timeframe..." />
                </DropdownMenu>
                <input
                    ref={restoreInputRef}
                    type="file"
                    accept=".json,application/json"
                    aria-label="Restore project backup"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) onRestore(file);
                    }}
                />

                <div className="flex items-center gap-0.5 rounded-lg border border-[#e6e6e2] bg-[#fafaf8] p-0.5 dark:border-gray-700 dark:bg-gray-800">
                    <Tooltip text="Undo (Ctrl+Z)">
                        <button
                            aria-label="Undo"
                            title="Undo"
                            onClick={undo}
                            disabled={!canUndo}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                        >
                            <UndoIcon className="h-3.5 w-3.5" />
                        </button>
                    </Tooltip>
                    <Tooltip text="Redo (Ctrl+Y)">
                        <button
                            aria-label="Redo"
                            title="Redo"
                            onClick={redo}
                            disabled={!canRedo}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                        >
                            <RedoIcon className="h-3.5 w-3.5" />
                        </button>
                    </Tooltip>
                </div>
            </div>
           
            <div className="flex min-w-0 items-center justify-end gap-3">
                <div ref={searchContainerRef} className="relative">
                    <div className="relative">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input
                            id="global-search-bar"
                            type="text"
                            placeholder="Find or jump to... ( / )"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onFocus={() => onSearchFocusChange(true)}
                            className="w-64 sm:w-72 h-9 pl-9 pr-4 rounded-full bg-[#f9faf7] dark:bg-gray-800 border border-[#e6e6e2] dark:border-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-xs font-medium placeholder-gray-400 text-[#292c31] dark:text-gray-100"
                        />
                    </div>
                    {isSearchPanelOpen && projectData && (
                        <SearchResultsPanel
                            results={searchResults}
                            onSelect={onSearchResultSelect}
                            projectData={projectData}
                        />
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
