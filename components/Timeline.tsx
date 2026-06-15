
import React from 'react';
import { ProjectData, Task, Group, Assignment } from '../types';
import GanttTaskBar from './GanttTaskBar';
import DependencyLines from './DependencyLines';
import { diffInDays, getMonthName, getWeekNumber, addDays } from '../services/dateUtils';

type DisplayItem =
    | { type: 'task'; data: Task; hasAssignments: boolean }
    | { type: 'group'; data: Group }
    | { type: 'assignment'; data: Assignment };

interface Dependency {
    sourceId: string;
    targetId: string;
    start: { x: number; y: number };
    end: { x: number; y: number };
}

interface TimelineProps {
    projectData: ProjectData;
    displayItems: DisplayItem[];
    zoom: number;
    ganttViewMode: 'day' | 'week' | 'month';
    rowHeight: number;
    groupRowHeight: number;
    assignmentRowHeight: number;
    selectedTaskId: string | null;
    onSelectTask: (taskId: string) => void;
    onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
    onRequestEditTask: (taskId: string) => void;
    dependencyLink: { type: 'prerequisite' | 'postrequisite', fromTaskId: string } | null;
    onLinkTask: (toTaskId: string) => void;
    dependencies: Dependency[];
    onRemoveDependency: (sourceId: string, targetId: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({
    projectData, displayItems, zoom, ganttViewMode, rowHeight, groupRowHeight, assignmentRowHeight,
    selectedTaskId, onSelectTask, onTaskUpdate, onRequestEditTask,
    dependencyLink, onLinkTask, dependencies, onRemoveDependency
}) => {
    const { projectStartDate, projectEndDate } = projectData;

    const totalDays = diffInDays(projectStartDate, projectEndDate) + 1;
    const timelineWidth = totalDays * zoom;

    const renderHeaders = () => {
        const months: { [key: string]: number } = {};
        const weeks: { [key: string]: number } = {};

        for (let i = 0; i < totalDays; i++) {
            const date = addDays(projectStartDate, i);
            const month = `${getMonthName(date.getMonth())} ${date.getFullYear()}`;
            if (!months[month]) months[month] = 0;
            months[month]++;
            
            const week = `W${getWeekNumber(date)}`;
            if (!weeks[week]) weeks[week] = 0;
            weeks[week]++;
        }

        const todayOffset = diffInDays(projectStartDate, new Date());

        return (
            <div className="sticky top-0 z-30 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md">
                <div className="flex h-6 border-b border-gray-200 dark:border-gray-700">
                    {Object.entries(months).map(([month, days]) => (
                        <div key={month} style={{ width: days * zoom }} className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 py-1 truncate px-1">
                            {month}
                        </div>
                    ))}
                </div>
                {ganttViewMode !== 'month' && (
                    <div className="flex h-6 border-b border-gray-200 dark:border-gray-700">
                        {Object.entries(weeks).map(([week, days]) => (
                            <div key={week} style={{ width: days * zoom }} className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 text-center text-xs text-gray-400 dark:text-gray-500 py-1 truncate px-1">
                                {week}
                            </div>
                        ))}
                    </div>
                )}
                 {ganttViewMode === 'day' && (
                    <div className="flex h-6 border-b border-gray-200 dark:border-gray-700">
                        {Array.from({ length: totalDays }).map((_, i) => (
                            <div key={i} style={{ width: zoom }} className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 text-center text-xs text-gray-400 dark:text-gray-500">
                                <span className="pt-1 block">{addDays(projectStartDate, i).getDate()}</span>
                            </div>
                        ))}
                    </div>
                 )}
                 {/* Today Indicator */}
                {todayOffset >= 0 && todayOffset < totalDays && (
                    <div className="absolute top-0 h-screen w-px bg-blue-500 z-20 opacity-50 pointer-events-none" style={{ left: todayOffset * zoom }}>
                        <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div>
                    </div>
                )}
            </div>
        );
    };

    let currentTop = 0;
    const renderedItems = displayItems.map(item => {
        if (item.type === 'task') {
            const top = currentTop;
            currentTop += rowHeight;
            return (
                <GanttTaskBar
                    key={item.data.id}
                    task={item.data}
                    projectStartDate={projectStartDate}
                    rowTop={top}
                    barHeight={rowHeight - 24} // More breathing room
                    zoom={zoom}
                    isSelected={selectedTaskId === item.data.id}
                    onSelectTask={onSelectTask}
                    onTaskUpdate={onTaskUpdate}
                    onRequestEditTask={onRequestEditTask}
                    isLinking={!!dependencyLink}
                    onLinkTask={onLinkTask}
                />
            );
        } else if (item.type === 'group') {
            currentTop += groupRowHeight;
            return null;
        } else if (item.type === 'assignment') {
            currentTop += assignmentRowHeight;
            return null;
        }
        return null;
    });

    const totalHeight = displayItems.reduce((acc: number, item) => {
        if (item.type === 'task') return acc + rowHeight;
        if (item.type === 'group') return acc + groupRowHeight;
        if (item.type === 'assignment') return acc + assignmentRowHeight;
        return acc;
    }, 0);

    return (
        <div className="relative" style={{ width: timelineWidth, height: totalHeight }}>
            {renderHeaders()}
            {/* Grid lines */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                 {Array.from({ length: totalDays }).map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 border-r border-gray-100 dark:border-gray-800" style={{ left: (i + 1) * zoom, zIndex: 0 }}></div>
                ))}
                {Array.from({ length: displayItems.length }).map((_, i) => (
                    <div key={i} className="absolute left-0 right-0 border-b border-gray-100 dark:border-gray-800" style={{ top: (i + 1) * rowHeight, zIndex: 0 }}></div>
                ))}
            </div>
            
            {/* Dependencies rendered behind tasks but above grid */}
            <div className="absolute top-0 left-0 w-full h-full z-10">
                <DependencyLines dependencies={dependencies} onRemoveDependency={onRemoveDependency} />
            </div>

            {/* Tasks rendered on top */}
            <div className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none">
                {renderedItems}
            </div>
        </div>
    );
};

export default Timeline;
