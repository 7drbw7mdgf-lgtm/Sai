
import React from 'react';
import Tooltip from './Tooltip';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';

type GanttViewMode = 'day' | 'week' | 'month';

interface ViewControlsProps {
    viewMode: GanttViewMode;
    onViewModeChange: (mode: GanttViewMode) => void;
    zoom: number;
    onZoomChange: (zoom: number) => void;
}

const MIN_ZOOM = 2;
const MAX_ZOOM = 100;

const ViewControls: React.FC<ViewControlsProps> = ({ viewMode, onViewModeChange, zoom, onZoomChange }) => {
    
    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onZoomChange(Number(e.target.value));
    };

    return (
        <div className="flex items-center space-x-4">
            <div className="flex items-center p-1 rounded-full bg-gray-200/70 dark:bg-gray-700/70">
                <button onClick={() => onViewModeChange('day')} className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${viewMode === 'day' ? 'bg-white dark:bg-gray-600 text-[rgb(var(--color-primary-600))] dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Day</button>
                <button onClick={() => onViewModeChange('week')} className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${viewMode === 'week' ? 'bg-white dark:bg-gray-600 text-[rgb(var(--color-primary-600))] dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Week</button>
                <button onClick={() => onViewModeChange('month')} className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${viewMode === 'month' ? 'bg-white dark:bg-gray-600 text-[rgb(var(--color-primary-600))] dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Month</button>
            </div>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 shadow-sm">
                <button 
                    onClick={() => onZoomChange(Math.max(MIN_ZOOM, zoom - 5))} 
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                    <ZoomOutIcon className="w-4 h-4"/>
                </button>
                <input
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    value={zoom}
                    onChange={handleZoomChange}
                    className="w-24 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <button 
                    onClick={() => onZoomChange(Math.min(MAX_ZOOM, zoom + 5))} 
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                    <ZoomInIcon className="w-4 h-4"/>
                </button>
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-8 text-right">{zoom}px</span>
            </div>
        </div>
    );
};

export default ViewControls;
