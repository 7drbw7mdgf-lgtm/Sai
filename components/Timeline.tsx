
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
    onStartDependencyLink: (taskId: string, type: 'prerequisite' | 'postrequisite') => void;
    dependencies: Dependency[];
    onRemoveDependency: (sourceId: string, targetId: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({
    projectData, displayItems, zoom, ganttViewMode, rowHeight, groupRowHeight, assignmentRowHeight,
    selectedTaskId, onSelectTask, onTaskUpdate, onRequestEditTask,
    dependencyLink, onLinkTask, onStartDependencyLink, dependencies, onRemoveDependency
}) => {
    const { projectStartDate, projectEndDate } = projectData;

    const totalDays = diffInDays(projectStartDate, projectEndDate) + 1;
    const timelineWidth = totalDays * zoom;
    const headerHeight = ganttViewMode === 'day' ? 82 : ganttViewMode === 'week' ? 52 : 28;

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
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
                {/* Month row */}
                <div className="flex h-7 border-b border-[#e6e6e2] dark:border-gray-800">
                    {Object.entries(months).map(([month, days]) => (
                        <div key={month} style={{ width: days * zoom }} className="flex-shrink-0 border-r border-[#e6e6e2] dark:border-gray-800 text-center text-xs font-bold text-[#292c31] dark:text-gray-200 py-1 truncate px-2 font-['Manrope'] tracking-tight">
                            {month}
                        </div>
                    ))}
                </div>
                {/* Week row */}
                {ganttViewMode !== 'month' && (
                    <div className="flex h-6 border-b border-[#e6e6e2] dark:border-gray-800 bg-[#fafaf8] dark:bg-gray-850">
                        {Object.entries(weeks).map(([week, days]) => (
                            <div key={week} style={{ width: days * zoom }} className="flex-shrink-0 border-r border-[#e6e6e2] dark:border-gray-800 text-center text-[10px] font-semibold text-[#7a8472] dark:text-gray-400 py-0.5 truncate px-1">
                                {week}
                            </div>
                        ))}
                    </div>
                )}
                {/* Day row */}
                 {ganttViewMode === 'day' && (
                    <div className="flex h-7 border-b border-[#e6e6e2] dark:border-gray-800 bg-[#fafaf8] dark:bg-gray-850">
                        {Array.from({ length: totalDays }).map((_, i) => {
                            const date = addDays(projectStartDate, i);
                            const dayOfWeek = date.getDay();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                            const isToday = i === todayOffset;
                            return (
                                <div 
                                    key={i} 
                                    style={{ width: zoom }} 
                                    className={`flex-shrink-0 border-r border-[#e6e6e2]/70 dark:border-gray-800 text-center text-[11px] font-medium flex items-center justify-center ${
                                        isToday 
                                            ? 'bg-[#fdf2ee] dark:bg-[#38221c]' 
                                            : isWeekend 
                                                ? 'text-gray-400 bg-black/[0.025] dark:bg-white/[0.02]' 
                                                : 'text-[#292c31] dark:text-gray-300'
                                    }`}
                                >
                                    {isToday ? (
                                        <span className="w-5 h-5 rounded-full bg-[#ef754e] text-white font-bold text-[10px] flex items-center justify-center shadow-2xs select-none">
                                            {date.getDate()}
                                        </span>
                                    ) : (
                                        <span className="font-semibold select-none">{date.getDate()}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                 )}
                 {/* Today Indicator Line */}
                {todayOffset >= 0 && todayOffset < totalDays && (
                    <div 
                        className="absolute top-0 bottom-0 w-[2px] bg-[#ef754e]/85 z-25 pointer-events-none shadow-xs" 
                        style={{ left: (todayOffset + 0.5) * zoom }}
                    />
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
                    onStartDependencyLink={onStartDependencyLink}
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

    const rowLineTops = displayItems.reduce((acc: number[], item) => {
        const previousTop = acc.length > 0 ? acc[acc.length - 1] : headerHeight;
        const itemHeight = item.type === 'task' ? rowHeight : item.type === 'group' ? groupRowHeight : assignmentRowHeight;
        acc.push(previousTop + itemHeight);
        return acc;
    }, []);

    return (
        <div className="relative" style={{ width: timelineWidth, height: headerHeight + totalHeight }}>
            {renderHeaders()}
            {/* Grid lines & Weekend shading */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {Array.from({ length: totalDays }).map((_, i) => {
                    const date = addDays(projectStartDate, i);
                    const dayOfWeek = date.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    return (
                        <div 
                            key={i} 
                            className={`absolute top-0 bottom-0 border-r border-[#e6e6e2]/50 dark:border-gray-800/60 ${
                                isWeekend ? 'bg-black/[0.015] dark:bg-white/[0.012]' : ''
                            }`} 
                            style={{ left: (i + 1) * zoom, width: zoom, zIndex: 0 }}
                        />
                    );
                })}
                {rowLineTops.map((top, i) => (
                    <div key={i} className="absolute left-0 right-0 border-b border-[#f0f0ec] dark:border-gray-800/70" style={{ top, zIndex: 0 }}></div>
                ))}
            </div>
            
            {/* Dependencies rendered behind tasks but above grid */}
            <div className="absolute left-0 w-full z-10" style={{ top: headerHeight, height: totalHeight }}>
                <DependencyLines dependencies={dependencies} onRemoveDependency={onRemoveDependency} />
            </div>

            {/* Tasks rendered on top */}
            <div className="absolute left-0 w-full z-20 pointer-events-none" style={{ top: headerHeight, height: totalHeight }}>
                {renderedItems}
            </div>
        </div>
    );
};

export default Timeline;
