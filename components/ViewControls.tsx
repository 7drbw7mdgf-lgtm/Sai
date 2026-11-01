
import React from 'react';
import Tooltip from './Tooltip';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';

import { GanttViewMode } from './ganttLayout';

interface ViewControlsProps {
    viewMode: GanttViewMode;
    onViewModeChange: (mode: GanttViewMode) => void;
    zoom: number;
    onZoomChange: (zoom: number) => void;
}

export const MIN_ZOOM = 2;
export const MAX_ZOOM = 100;

const ViewControls: React.FC<ViewControlsProps> = ({ viewMode, onViewModeChange, zoom, onZoomChange }) => {
    
    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onZoomChange(Number(e.target.value));
    };

    return (
        <div className="flex items-center space-x-3">
            {/* View Mode Segmented Pill */}
            <div className="flex items-center p-1 rounded-xl bg-[#f4f5f0] dark:bg-gray-800 border border-[#e6e6e2] dark:border-gray-700">
                <button 
                    onClick={() => onViewModeChange('day')} 
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'day' 
                            ? 'bg-[#ef754e] text-white shadow-2xs font-bold' 
                            : 'text-[#5c6652] dark:text-gray-400 hover:text-[#292c31] dark:hover:text-white'
                    }`}
                >
                    Day
                </button>
                <button 
                    onClick={() => onViewModeChange('week')} 
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'week' 
                            ? 'bg-[#ef754e] text-white shadow-2xs font-bold' 
                            : 'text-[#5c6652] dark:text-gray-400 hover:text-[#292c31] dark:hover:text-white'
                    }`}
                >
                    Week
                </button>
                <button 
                    onClick={() => onViewModeChange('month')} 
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'month' 
                            ? 'bg-[#ef754e] text-white shadow-2xs font-bold' 
                            : 'text-[#5c6652] dark:text-gray-400 hover:text-[#292c31] dark:hover:text-white'
                    }`}
                >
                    Month
                </button>
            </div>
            
            <div className="h-5 w-px bg-[#e6e6e2] dark:bg-gray-700"></div>
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-xl px-2.5 py-1 border border-[#e6e6e2] dark:border-gray-700 shadow-2xs">
                <button 
                    onClick={() => onZoomChange(Math.max(MIN_ZOOM, zoom - 5))} 
                    className="p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-[#f0efeb] dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Zoom out"
                >
                    <ZoomOutIcon className="w-3.5 h-3.5"/>
                </button>
                <input
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    value={zoom}
                    onChange={handleZoomChange}
                    className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ef754e]"
                />
                <button 
                    onClick={() => onZoomChange(Math.min(MAX_ZOOM, zoom + 5))} 
                    className="p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-[#f0efeb] dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Zoom in"
                >
                    <ZoomInIcon className="w-3.5 h-3.5"/>
                </button>
                <span className="text-[11px] font-mono text-[#7a8472] dark:text-gray-400 w-8 text-right font-semibold">{zoom}px</span>
            </div>
        </div>
    );
};

export default ViewControls;
