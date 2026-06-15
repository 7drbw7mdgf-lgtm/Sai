
import React, { useRef } from 'react';
import { View, SearchResult, ProjectData } from '../types';
import Tooltip from './Tooltip';
import DropdownMenu, { MenuItem } from './FileMenu';
import { ChevronDownIcon } from './icons/ChevronIcons';
import { SearchIcon } from './icons/SearchIcon';
import SearchResultsPanel from './SearchResultsPanel';
import { ArrowUpTrayIcon } from './icons/ArrowUpTrayIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { AdjustmentsHorizontalIcon } from './icons/AdjustmentsHorizontalIcon';
import { useOnClickOutside } from '../hooks/useOnClickOutside';


interface HeaderProps {
    currentView: View;
    onLoad: () => void;
    onSave: () => void;
    onTimeframe: () => void;
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
    onLoad, onSave, onTimeframe,
    searchQuery, onSearchChange, isSearchPanelOpen, onSearchFocusChange, searchResults, onSearchResultSelect,
    projectData
}) => {
    
    const searchContainerRef = useRef(null);
    useOnClickOutside(searchContainerRef, () => onSearchFocusChange(false));

    return (
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between h-16 flex-shrink-0 z-30">
            <div className="flex items-center gap-4" style={{width: '280px'}}>
                 <DropdownMenu trigger={
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-700/70 cursor-pointer">
                        <span className="text-xl font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">File</span>
                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                    </div>
                }>
                    <MenuItem onClick={onLoad} icon={<ArrowUpTrayIcon className="w-5 h-5"/>} text="Load Demo..." />
                    <MenuItem onClick={onSave} icon={<ArrowDownTrayIcon className="w-5 h-5"/>} text="Save Project" />
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                    <MenuItem onClick={onTimeframe} icon={<AdjustmentsHorizontalIcon className="w-5 h-5"/>} text="Adjust Timeframe..." />
                </DropdownMenu>
            </div>
           
            <div className="flex-1 flex justify-center items-center">
                 <h1 className="text-3xl font-light text-gray-500 dark:text-gray-400 tracking-wider">
                    {currentView}
                </h1>
            </div>
            
            <div className="flex items-center justify-end" style={{width: '280px'}}>
                <div ref={searchContainerRef} className="relative">
                    <div className="relative">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input
                            id="global-search-bar"
                            type="text"
                            placeholder="Search... ( / )"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onFocus={() => onSearchFocusChange(true)}
                            className="w-64 h-10 pl-10 pr-4 rounded-full bg-gray-100 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
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
