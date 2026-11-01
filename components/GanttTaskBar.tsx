
import React, { useState, useRef } from 'react';
import { Task } from '../types';
import { diffInDays, addDays } from '../services/dateUtils';
import { DragPreview } from './ganttLayout';

interface GanttTaskBarProps {
    task: Task;
    projectStartDate: Date;
    rowTop: number;
    rowHeight: number;
    zoom: number;
    isSelected: boolean;
    onSelectTask: (taskId: string) => void;
    onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
    onDragPreview: (preview: DragPreview | null) => void;
    onDragCommit: (taskId: string, startDate: Date, endDate: Date) => void;
    onRequestEditTask: (taskId: string) => void;
    isLinking: boolean;
    isLinkSource: boolean;
    onLinkTask: (toTaskId: string) => void;
    onStartDependencyLink: (taskId: string, type: 'prerequisite' | 'postrequisite') => void;
}

// Authentic Sparkboard Pastel Palettes for Gantt Bars
const SPARK_BAR_THEMES: { [key: string]: { bg: string; border: string; fill: string; text: string; dot: string } } = {
    yellow:   { bg: '#fefcf3', border: '#f6df8d', fill: '#f59e0b', text: '#854d0e', dot: '#d97706' },
    green:    { bg: '#f4faf0', border: '#cde4b8', fill: '#22c55e', text: '#15803d', dot: '#16a34a' },
    coral:    { bg: '#fdf5f2', border: '#f3c7b7', fill: '#ef754e', text: '#c2410c', dot: '#ea580c' },
    lavender: { bg: '#f8f5fc', border: '#e1d2f3', fill: '#a855f7', text: '#7e22ce', dot: '#9333ea' },
    blue:     { bg: '#f2f9fb', border: '#bfe1e6', fill: '#0ea5e9', text: '#0369a1', dot: '#0284c7' },
    slate:    { bg: '#f8fafc', border: '#cbd5e1', fill: '#64748b', text: '#334155', dot: '#475569' },
};

const BAR_HEIGHT = 36;
/** Pixels the pointer must travel before a press becomes a drag (so plain clicks still select). */
const DRAG_THRESHOLD = 3;

type Interaction = 'drag' | 'resize-left' | 'resize-right';

const GanttTaskBar: React.FC<GanttTaskBarProps> = ({
    task, projectStartDate, rowTop, rowHeight, zoom, isSelected,
    onSelectTask, onTaskUpdate, onDragPreview, onDragCommit, onRequestEditTask,
    isLinking, isLinkSource, onLinkTask, onStartDependencyLink
}) => {
    const barRef = useRef<HTMLDivElement>(null);
    const [interaction, setInteraction] = useState<Interaction | null>(null);
    const [isChangingCompletion, setIsChangingCompletion] = useState(false);
    // Local value while the completion handle is dragged; committed once on mouse-up.
    const [completionPreview, setCompletionPreview] = useState<number | null>(null);
    const completion = completionPreview ?? task.completion;
    const didDragRef = useRef(false);

    const taskStartOffset = diffInDays(projectStartDate, task.startDate);
    const taskDuration = diffInDays(task.startDate, task.endDate) + 1;
    const barWidth = Math.max(taskDuration * zoom, 6);
    const isCompleted = completion >= 100;

    // Pick deterministic theme
    const themeKeys = ['coral', 'yellow', 'blue', 'green', 'lavender', 'slate'];
    const charCodeSum = task.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const theme = isCompleted
        ? { bg: '#f0fdf4', border: '#bbf7d0', fill: '#10b981', text: '#065f46', dot: '#10b981' }
        : SPARK_BAR_THEMES[themeKeys[charCodeSum % themeKeys.length]];
    
    // If bar is too small, show text outside
    const isCompact = barWidth < 120;

    const handleMouseDown = (e: React.MouseEvent, type: Interaction) => {
        if (e.button !== 0 || isLinking) return;
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX;
        const originalStart = task.startDate;
        const originalEnd = task.endDate;
        let latest = { startDate: originalStart, endDate: originalEnd };
        didDragRef.current = false;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            if (!didDragRef.current) {
                if (Math.abs(dx) < DRAG_THRESHOLD) return;
                didDragRef.current = true;
                setInteraction(type);
                document.body.style.cursor = type === 'drag' ? 'grabbing' : 'ew-resize';
                document.body.style.userSelect = 'none';
            }
            const daysMoved = Math.round(dx / zoom);

            if (type === 'drag') {
                latest = { startDate: addDays(originalStart, daysMoved), endDate: addDays(originalEnd, daysMoved) };
            } else if (type === 'resize-left') {
                const s = addDays(originalStart, daysMoved);
                latest = { startDate: s > originalEnd ? originalEnd : s, endDate: originalEnd };
            } else {
                const en = addDays(originalEnd, daysMoved);
                latest = { startDate: originalStart, endDate: en < originalStart ? originalStart : en };
            }
            // Preview only; project data (and undo history) is written once on mouse-up.
            onDragPreview({ taskId: task.id, ...latest });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            setInteraction(null);
            if (!didDragRef.current) return;
            const changed = diffInDays(originalStart, latest.startDate) !== 0 || diffInDays(originalEnd, latest.endDate) !== 0;
            if (changed) onDragCommit(task.id, latest.startDate, latest.endDate);
            else onDragPreview(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleCompletionMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLinking || !barRef.current) return;

        setIsChangingCompletion(true);
        onSelectTask(task.id);

        let latestCompletion = task.completion;
        const updateCompletionFromPointer = (clientX: number) => {
            if (!barRef.current) return;
            const rect = barRef.current.getBoundingClientRect();
            const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
            latestCompletion = Math.max(0, Math.min(100, Math.round(ratio * 100)));
            setCompletionPreview(latestCompletion);
        };

        updateCompletionFromPointer(e.clientX);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            updateCompletionFromPointer(moveEvent.clientX);
        };

        const handleMouseUp = () => {
            setIsChangingCompletion(false);
            setCompletionPreview(null);
            if (latestCompletion !== task.completion) onTaskUpdate(task.id, { completion: latestCompletion });
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleDependencyNodeClick = (e: React.MouseEvent, type: 'prerequisite' | 'postrequisite') => {
        e.preventDefault();
        e.stopPropagation();
        onStartDependencyLink(task.id, type);
    };

    const isDependencyNodeEvent = (target: EventTarget | null) => {
        return target instanceof HTMLElement && !!target.closest('[data-dependency-node="true"]');
    };

    return (
        <div
            className="absolute pointer-events-auto"
            style={{
                top: rowTop + (rowHeight - BAR_HEIGHT) / 2,
                left: taskStartOffset * zoom,
                width: barWidth,
                height: BAR_HEIGHT,
            }}
        >
            {/* The Bar itself */}
            <div
                ref={barRef}
                role="button"
                tabIndex={0}
                aria-label={isLinking ? `Create dependency with ${task.name}` : `Select ${task.name}`}
                onClick={(e) => {
                    if (isDependencyNodeEvent(e.target)) return;
                    // A drag ends with a click event; don't treat it as a selection.
                    if (didDragRef.current) { didDragRef.current = false; return; }
                    isLinking ? onLinkTask(task.id) : onSelectTask(task.id);
                }}
                onDoubleClick={(e) => {
                    if (isDependencyNodeEvent(e.target) || isLinking) return;
                    onRequestEditTask(task.id);
                }}
                onMouseDown={(e) => {
                    if (isDependencyNodeEvent(e.target)) return;
                    handleMouseDown(e, 'drag');
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        isLinking ? onLinkTask(task.id) : onSelectTask(task.id);
                    }
                }}
                className={`group/bar relative w-full h-full rounded-xl shadow-2xs hover:shadow-md transition-shadow select-none
                    ${isLinking ? (isLinkSource ? 'ring-2 ring-[#ef754e] cursor-not-allowed' : 'hover:ring-2 ring-[#ef754e] cursor-alias') : (interaction === 'drag' ? 'cursor-grabbing shadow-lg' : 'cursor-grab')}
                    ${isSelected ? 'ring-2 ring-[#ef754e] ring-offset-2 dark:ring-offset-gray-900 shadow-sm' : ''}
                    ${isCompleted ? 'opacity-80 hover:opacity-95' : ''}
                    ${isChangingCompletion ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-gray-900' : ''}
                `}
                style={{
                    backgroundColor: theme.bg,
                    border: `1.5px solid ${theme.border}`,
                }}
            >
                {/* Progress fill */}
                <div 
                    className="absolute top-0 left-0 h-full rounded-xl overflow-hidden transition-all duration-150" 
                    style={{ width: `${completion}%` }}
                >
                    <div 
                        className="w-full h-full opacity-35" 
                        style={{ backgroundColor: theme.fill }}
                    ></div>
                </div>

                {/* Left accent marker line */}
                <div 
                    className="absolute left-0 top-1 bottom-1 w-1 rounded-l-md"
                    style={{ backgroundColor: theme.dot }}
                />

                {/* Label inside bar */}
                <div 
                    className={`absolute top-0 bottom-0 flex items-center pointer-events-none
                        ${isCompact ? 'left-full ml-2.5' : 'left-0 right-0 px-3.5'}
                    `}
                >
                    <span 
                        className={`text-xs font-semibold whitespace-nowrap tracking-tight ${
                            isCompleted 
                                ? 'text-gray-400 line-through decoration-gray-400 dark:text-gray-500' 
                                : isCompact 
                                    ? 'text-[#292c31] dark:text-gray-200' 
                                    : 'truncate'
                        }`}
                        style={{ color: isCompact || isCompleted ? undefined : theme.text }}
                    >
                        {task.name}
                    </span>
                    {!isCompact && (
                        <span 
                            className="text-[10px] font-bold opacity-60 ml-2"
                            style={{ color: theme.text }}
                        >
                            {completion}%
                        </span>
                    )}
                </div>

                {/* Dependency Nodes */}
                {!isLinking && (
                    <>
                        <button
                            type="button"
                            data-dependency-node="true"
                            aria-label={`Add incoming dependency to ${task.name}`}
                            title="Connect predecessor dependency"
                            onClick={(e) => handleDependencyNodeClick(e, 'postrequisite')}
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className={`absolute left-[-7px] top-1/2 z-20 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white shadow-md transition-all hover:scale-125 focus:opacity-100 dark:border-gray-900 ${
                                isSelected ? 'opacity-100' : 'opacity-0 group-hover/bar:opacity-100'
                            }`}
                            style={{ backgroundColor: theme.fill }}
                        >
                            <span className="sr-only">Add incoming dependency</span>
                        </button>
                        <button
                            type="button"
                            data-dependency-node="true"
                            aria-label={`Add outgoing dependency from ${task.name}`}
                            title="Connect successor dependency"
                            onClick={(e) => handleDependencyNodeClick(e, 'prerequisite')}
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className={`absolute right-[-7px] top-1/2 z-20 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white shadow-md transition-all hover:scale-125 focus:opacity-100 dark:border-gray-900 ${
                                isSelected ? 'opacity-100' : 'opacity-0 group-hover/bar:opacity-100'
                            }`}
                            style={{ backgroundColor: theme.fill }}
                        >
                            <span className="sr-only">Add outgoing dependency</span>
                        </button>
                    </>
                )}

                {/* Completion Handle */}
                {!isLinking && (
                    <>
                        <div
                            aria-hidden="true"
                            onMouseDown={handleCompletionMouseDown}
                            className="absolute bottom-[-10px] left-2 right-2 h-3 cursor-ew-resize rounded-full bg-gray-200/60 opacity-0 transition-opacity hover:opacity-100 dark:bg-gray-700/60"
                        />
                        <button
                            type="button"
                            aria-label={`Set ${task.name} completion, currently ${completion}%`}
                            title={`${completion}% complete (drag to adjust)`}
                            onMouseDown={handleCompletionMouseDown}
                            className={`absolute bottom-[-7px] h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-white shadow-md transition-transform hover:scale-125 active:scale-95 dark:border-gray-900 z-10 ${
                                isChangingCompletion ? 'bg-emerald-600 ring-2 ring-emerald-300' : 'bg-emerald-500'
                            }`}
                            style={{ left: `${completion}%` }}
                        >
                            <span className="sr-only">{completion}% complete</span>
                        </button>
                    </>
                )}

                {/* Resize Handles */}
                {!isLinking && interaction !== 'drag' && !isChangingCompletion && (
                    <>
                        <div
                            className="absolute left-0 top-0 h-full w-2.5 cursor-ew-resize hover:bg-black/10 rounded-l-xl opacity-0 group-hover/bar:opacity-100 transition-opacity"
                            title="Drag to change start date"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
                        />
                        <div
                            className="absolute right-0 top-0 h-full w-2.5 cursor-ew-resize hover:bg-black/10 rounded-r-xl opacity-0 group-hover/bar:opacity-100 transition-opacity"
                            title="Drag to change end date"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default GanttTaskBar;
