

import React, { useState, useEffect, useRef } from 'react';
import { TASK_COLORS } from '../constants';

const RECENT_COLORS_KEY = 'project_guru_recent_colors';
const MAX_RECENT_COLORS = 7;

interface ColorSwatchPickerProps {
    selectedColor: string;
    onSelectColor: (color: string) => void;
}

const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({ selectedColor, onSelectColor }) => {
    const [recentColors, setRecentColors] = useState<string[]>([]);
    const colorInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            const storedColors = localStorage.getItem(RECENT_COLORS_KEY);
            if (storedColors) {
                setRecentColors(JSON.parse(storedColors));
            }
        } catch (error) {
            console.error("Failed to load recent colors from localStorage", error);
        }
    }, []);

    const handleSelectColor = (color: string) => {
        onSelectColor(color);
        
        const updatedRecent = [color, ...recentColors.filter(c => c !== color)].slice(0, MAX_RECENT_COLORS);
        setRecentColors(updatedRecent);
        
        try {
            localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updatedRecent));
        } catch (error) {
            console.error("Failed to save recent colors to localStorage", error);
        }
    };
    
    const handleCustomColorClick = () => {
        colorInputRef.current?.click();
    };

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleSelectColor(e.target.value);
    };

    return (
        <div className="space-y-3 p-1">
            {recentColors.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Recent</h4>
                    <div className="flex flex-wrap gap-2.5 justify-start px-1">
                        {recentColors.map(c => (
                            <button 
                                key={`recent-${c}`} 
                                onClick={() => handleSelectColor(c)}
                                style={{backgroundColor: c}}
                                className={`w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${selectedColor === c ? 'ring-2 ring-offset-2 ring-blue-500 ring-offset-white' : ''}`}
                                aria-label={`Select recent color ${c}`}
                            />
                        ))}
                    </div>
                </div>
            )}
             <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Palette</h4>
                <div className="flex flex-wrap gap-2.5 justify-start px-1">
                     <button
                        onClick={handleCustomColorClick}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300"
                        aria-label="Select a custom color"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                        </svg>
                        <input
                            ref={colorInputRef}
                            type="color"
                            onChange={handleCustomColorChange}
                            className="absolute w-0 h-0 opacity-0"
                            tabIndex={-1}
                        />
                    </button>
                    {TASK_COLORS.map(c => (
                        <button 
                            key={c} 
                            onClick={() => handleSelectColor(c)}
                            style={{backgroundColor: c}}
                            className={`w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${selectedColor === c ? 'ring-2 ring-offset-2 ring-blue-500 ring-offset-white' : ''}`}
                            aria-label={`Select color ${c}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ColorSwatchPicker;