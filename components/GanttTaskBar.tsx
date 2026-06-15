
import React, { useState, useRef } from 'react';
import { Task } from '../types';
import { diffInDays, addDays } from '../services/dateUtils';

interface GanttTaskBarProps {
    task: Task;
    projectStartDate: Date;
    rowTop: number;
    barHeight: number;
    zoom: number;
    isSelected: boolean;
    onSelectTask: (taskId: string) => void;
    onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
    onRequestEditTask: (taskId: string) => void;
    isLinking: boolean;
    onLinkTask: (toTaskId: string) => void;
}

const GanttTaskBar: React.FC<GanttTaskBarProps> = ({
    task, projectStartDate, rowTop, barHeight, zoom, isSelected,
    onSelectTask, onTaskUpdate, onRequestEditTask, isLinking, onLinkTask
}) => {
    const barRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);
    const dragStartInfo = useRef({ x: 0, originalStart: new Date(), originalEnd: new Date() });

    const taskStartOffset = diffInDays(projectStartDate, task.startDate);
    const taskDuration = diffInDays(task.startDate, task.endDate) + 1;
    const barWidth = taskDuration * zoom;
    
    // If bar is too small, show text outside
    const isCompact = barWidth < 100;

    const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize-left' | 'resize-right') => {
        e.stopPropagation();
        if (isLinking) return;
        
        dragStartInfo.current = { x: e.clientX, originalStart: task.startDate, originalEnd: task.endDate };

        if (type === 'drag') setIsDragging(true);
        else if (type === 'resize-left') setIsResizingLeft(true);
        else if (type === 'resize-right') setIsResizingRight(true);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - dragStartInfo.current.x;
            const daysMoved = Math.round(dx / zoom);

            if (type === 'drag') {
                const newStartDate = addDays(dragStartInfo.current.originalStart, daysMoved);
                const newEndDate = addDays(dragStartInfo.current.originalEnd, daysMoved);
                onTaskUpdate(task.id, { startDate: newStartDate, endDate: newEndDate });
            } else if (type === 'resize-left') {
                const newStartDate = addDays(dragStartInfo.current.originalStart, daysMoved);
                if (newStartDate <= task.endDate) {
                    onTaskUpdate(task.id, { startDate: newStartDate });
                }
            } else if (type === 'resize-right') {
                const newEndDate = addDays(dragStartInfo.current.originalEnd, daysMoved);
                if (newEndDate >= task.startDate) {
                    onTaskUpdate(task.id, { endDate: newEndDate });
                }
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizingLeft(false);
            setIsResizingRight(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            className={`absolute pointer-events-auto transition-all duration-200 ease-out`}
            style={{
                top: rowTop + 12, // Adjusted vertical centering
                left: taskStartOffset * zoom,
                width: barWidth,
                height: barHeight,
            }}
        >
            {/* The Bar itself */}
            <div
                ref={barRef}
                onClick={() => isLinking ? onLinkTask(task.id) : onSelectTask(task.id)}
                onDoubleClick={() => onRequestEditTask(task.id)}
                onMouseDown={(e) => handleMouseDown(e, 'drag')}
                className={`relative w-full h-full rounded-full shadow-sm hover:shadow-md transition-shadow
                    ${isLinking ? 'hover:ring-2 ring-blue-500 cursor-alias' : 'cursor-grab active:cursor-grabbing'}
                    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900' : ''}
                `}
                style={{
                    backgroundColor: `${task.color}40`, // Use lower opacity for the background
                    border: `1px solid ${task.color}`,
                }}
            >
                {/* Progress fill */}
                <div 
                    className="absolute top-0 left-0 h-full rounded-full overflow-hidden" 
                    style={{ width: `${task.completion}%` }}
                >
                    <div className="w-full h-full opacity-60" style={{ backgroundColor: task.color }}></div>
                </div>

                {/* Label */}
                <div 
                    className={`absolute top-0 bottom-0 flex items-center pointer-events-none
                        ${isCompact ? 'left-full ml-2' : 'left-0 right-0 px-3'}
                    `}
                >
                    <span className={`text-xs font-semibold whitespace-nowrap ${isCompact ? 'text-gray-700 dark:text-gray-300' : 'text-gray-800 truncate'}`}>
                        {task.name}
                    </span>
                </div>

                {/* Resize Handles */}
                {!isLinking && !isDragging && (
                    <>
                        <div
                            className="absolute left-0 top-0 h-full w-3 cursor-ew-resize hover:bg-black/10 rounded-l-full"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
                        />
                        <div
                            className="absolute right-0 top-0 h-full w-3 cursor-ew-resize hover:bg-black/10 rounded-r-full"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default GanttTaskBar;
