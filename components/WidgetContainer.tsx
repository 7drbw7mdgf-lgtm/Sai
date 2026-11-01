
import React, { useState, useRef } from 'react';
import { WidgetLayout, WidgetType } from '../types';
import { XCircleIcon } from './icons/XCircleIcon';
import { CogIcon } from './icons/CogIcon';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { ResizeDirection } from './HomeScreen';

interface WidgetContainerProps {
    children: React.ReactNode;
    layout: WidgetLayout;
    isCustomizing: boolean;
    onDragStart: (e: React.MouseEvent) => void;
    onResizeStart: (e: React.MouseEvent, direction: ResizeDirection) => void;
    onRemove: () => void;
    onUpdateWidget: (id: string, updates: Partial<WidgetLayout>) => void;
}

const WelcomeWidgetSettings: React.FC<{ layout: WidgetLayout, onUpdateWidget: (id: string, updates: Partial<WidgetLayout>) => void }> = ({ layout, onUpdateWidget }) => {
    const gradients = [
        'gradient-to-br from-blue-500 to-indigo-600',
        'gradient-to-br from-green-400 to-teal-500',
        'gradient-to-br from-purple-500 to-pink-500',
        'gradient-to-br from-orange-400 to-rose-500',
    ];

    const updateBg = (bg: string) => {
        onUpdateWidget(layout.i, { config: { ...layout.config, bg } });
    };

    return (
        <div className="p-2">
            <h4 className="text-xs font-semibold text-gray-500 mb-2 px-1">Background</h4>
            <div className="flex gap-2">
                {gradients.map(g => (
                    <button
                        key={g}
                        onClick={() => updateBg(g)}
                        className={`w-6 h-6 rounded-full bg-gradient-to-br ${g} ${layout.config?.bg === g ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                    />
                ))}
            </div>
        </div>
    )
};


const WidgetContainer: React.FC<WidgetContainerProps> = ({ children, layout, isCustomizing, onDragStart, onResizeStart, onRemove, onUpdateWidget }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef(null);
    useOnClickOutside(settingsRef, () => setIsSettingsOpen(false));

    const hasSettings = layout.type === WidgetType.Welcome; // Only Welcome widget has settings for now
    const resizeHandleClasses = 'absolute bg-blue-600 border-2 border-white dark:border-gray-800 rounded-full w-4 h-4 z-20 shadow-md hover:scale-125 transition-transform';
    const sizePresets = [
        { label: 'S', title: 'Compact', w: 3, h: 4 },
        { label: 'W', title: 'Wide', w: 6, h: 4 },
        { label: 'T', title: 'Tall', w: 4, h: 7 },
        { label: 'L', title: 'Large', w: 6, h: 7 },
    ];

    const applySizePreset = (preset: { w: number; h: number }) => {
        const nextWidth = Math.min(preset.w, 12 - layout.x);
        onUpdateWidget(layout.i, { w: nextWidth, h: preset.h });
    };


    return (
        <div
            className={`absolute bg-white dark:bg-gray-800 rounded-2xl transition-all duration-200
                ${isCustomizing 
                    ? 'border-2 border-dashed border-blue-400 shadow-lg z-30' 
                    : 'border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md'
                }
            `}
            style={{
                gridColumn: `${layout.x + 1} / span ${layout.w}`,
                gridRow: `${layout.y + 1} / span ${layout.h}`,
            }}
        >
            {isCustomizing && (
                <div
                    className="absolute inset-0 bg-blue-500/5 z-10 rounded-2xl pointer-events-auto group"
                >
                    <div
                        className="absolute top-0 left-0 right-0 h-10 cursor-move rounded-t-2xl group-hover:bg-blue-500/10 transition-colors"
                        onMouseDown={onDragStart}
                    />
                    <div className="absolute left-3 top-2 z-20 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-blue-700 shadow-sm ring-1 ring-blue-100 dark:bg-gray-900 dark:text-blue-300 dark:ring-blue-900/50">
                        Drag
                    </div>

                    {/* Corner handles */}
                    <div title="Resize" className={`${resizeHandleClasses} -top-2 -left-2 cursor-nwse-resize`} onMouseDown={e => onResizeStart(e, 'nw')} />
                    <div title="Resize" className={`${resizeHandleClasses} -top-2 -right-2 cursor-nesw-resize`} onMouseDown={e => onResizeStart(e, 'ne')} />
                    <div title="Resize" className={`${resizeHandleClasses} -bottom-2 -left-2 cursor-nesw-resize`} onMouseDown={e => onResizeStart(e, 'sw')} />
                    <div title="Resize" className={`${resizeHandleClasses} -bottom-2 -right-2 cursor-nwse-resize`} onMouseDown={e => onResizeStart(e, 'se')} />
                    {/* Edge handles */}
                    <div title="Resize height" className={`${resizeHandleClasses} -top-2 left-1/2 -translate-x-1/2 cursor-ns-resize`} onMouseDown={e => onResizeStart(e, 'n')} />
                    <div title="Resize height" className={`${resizeHandleClasses} -bottom-2 left-1/2 -translate-x-1/2 cursor-ns-resize`} onMouseDown={e => onResizeStart(e, 's')} />
                    <div title="Resize width" className={`${resizeHandleClasses} top-1/2 -translate-y-1/2 -left-2 cursor-ew-resize`} onMouseDown={e => onResizeStart(e, 'w')} />
                    <div title="Resize width" className={`${resizeHandleClasses} top-1/2 -translate-y-1/2 -right-2 cursor-ew-resize`} onMouseDown={e => onResizeStart(e, 'e')} />

                    <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 rounded-2xl bg-white/95 p-1 shadow-md ring-1 ring-gray-100 dark:bg-gray-900/95 dark:ring-gray-700">
                        {sizePresets.map(preset => (
                            <button
                                key={preset.label}
                                type="button"
                                title={`${preset.title} ${preset.w}x${preset.h}`}
                                onClick={() => applySizePreset(preset)}
                                className="h-7 min-w-7 rounded-xl px-2 text-xs font-black text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                     <div className="absolute top-2 right-2 flex items-center gap-1" ref={settingsRef}>
                        {hasSettings && (
                            <div className="relative">
                                <button
                                    onClick={() => setIsSettingsOpen(o => !o)}
                                    className="p-1.5 text-gray-400 hover:text-blue-500 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700"
                                >
                                    <CogIcon className="w-4 h-4"/>
                                </button>
                                {isSettingsOpen && (
                                    <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-20 w-max p-1">
                                        {layout.type === WidgetType.Welcome && <WelcomeWidgetSettings layout={layout} onUpdateWidget={onUpdateWidget} />}
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            onClick={onRemove}
                            className="p-1.5 text-gray-400 hover:text-red-500 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700"
                        >
                            <XCircleIcon className="w-4 h-4"/>
                        </button>
                    </div>
                </div>
            )}
             <div className="w-full h-full overflow-hidden rounded-2xl">
                {children}
            </div>
        </div>
    );
};

export default WidgetContainer;
