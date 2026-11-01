
import React, { useMemo } from 'react';
import { Task } from '../types';
import GanttTaskBar from './GanttTaskBar';
import DependencyLines from './DependencyLines';
import { diffInDays, getMonthName, getWeekNumber, addDays } from '../services/dateUtils';
import {
    RowLayout, Dependency, DragPreview, GanttViewMode,
    HEADER_HEIGHT, BOTTOM_PADDING,
} from './ganttLayout';

interface TimelineProps {
    projectStartDate: Date;
    projectEndDate: Date;
    rows: RowLayout[];
    totalHeight: number;
    viewportWidth: number;
    zoom: number;
    ganttViewMode: GanttViewMode;
    selectedTaskId: string | null;
    onSelectTask: (taskId: string) => void;
    onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
    onDragPreview: (preview: DragPreview | null) => void;
    onDragCommit: (taskId: string, startDate: Date, endDate: Date) => void;
    onRequestEditTask: (taskId: string) => void;
    dependencyLink: { type: 'prerequisite' | 'postrequisite', fromTaskId: string } | null;
    onLinkTask: (toTaskId: string) => void;
    onStartDependencyLink: (taskId: string, type: 'prerequisite' | 'postrequisite') => void;
    dependencies: Dependency[];
    onRemoveDependency: (sourceId: string, targetId: string) => void;
}

interface Segment {
    key: string;
    label: string;
    start: number; // day index
    length: number; // days
}

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const HEADER_ROW_HEIGHT = HEADER_HEIGHT / 2;

/** Groups consecutive days that share a key into header segments. */
const buildSegments = (
    startDate: Date,
    days: number,
    keyOf: (d: Date) => string,
    labelOf: (d: Date, lengthPx: number, length: number) => string,
    zoom: number,
): Segment[] => {
    const segments: Segment[] = [];
    for (let i = 0; i < days; i++) {
        const date = addDays(startDate, i);
        const key = keyOf(date);
        const last = segments[segments.length - 1];
        if (last && last.key === key) {
            last.length++;
        } else {
            segments.push({ key, label: '', start: i, length: 1 });
        }
    }
    segments.forEach(seg => {
        seg.label = labelOf(addDays(startDate, seg.start), seg.length * zoom, seg.length);
    });
    return segments;
};

const isoWeekKey = (d: Date): string => {
    // ISO week-year can differ from the calendar year around New Year.
    const thursday = addDays(d, 3 - ((d.getDay() + 6) % 7));
    return `${thursday.getFullYear()}-W${getWeekNumber(d)}`;
};

const monthLabel = (d: Date, widthPx: number, withYear: boolean): string => {
    const full = getMonthName(d.getMonth());
    if (withYear) {
        if (widthPx >= 130) return `${full} ${d.getFullYear()}`;
        if (widthPx >= 70) return `${full.slice(0, 3)} ${d.getFullYear()}`;
        if (widthPx >= 32) return full.slice(0, 3);
        return '';
    }
    if (widthPx >= 80) return full;
    if (widthPx >= 28) return full.slice(0, 3);
    if (widthPx >= 12) return full[0];
    return '';
};

const Timeline: React.FC<TimelineProps> = ({
    projectStartDate, projectEndDate, rows, totalHeight, viewportWidth, zoom, ganttViewMode,
    selectedTaskId, onSelectTask, onTaskUpdate, onDragPreview, onDragCommit, onRequestEditTask,
    dependencyLink, onLinkTask, onStartDependencyLink, dependencies, onRemoveDependency
}) => {
    const projectDays = diffInDays(projectStartDate, projectEndDate) + 1;
    // Always fill the visible area so the grid never stops mid-screen, but never make the
    // content wider than needed (that would create a pointless horizontal scroll).
    const timelineWidth = Math.max(projectDays * zoom, viewportWidth);
    const displayDays = Math.max(projectDays, Math.ceil(timelineWidth / zoom));
    const bodyHeight = totalHeight + BOTTOM_PADDING;

    const todayOffset = diffInDays(projectStartDate, new Date());
    const showToday = todayOffset >= 0 && todayOffset < displayDays;

    const { topSegments, bottomSegments } = useMemo(() => {
        if (ganttViewMode === 'month') {
            return {
                topSegments: buildSegments(projectStartDate, displayDays,
                    d => `${d.getFullYear()}`,
                    (d, px) => px >= 36 ? `${d.getFullYear()}` : '', zoom),
                bottomSegments: buildSegments(projectStartDate, displayDays,
                    d => `${d.getFullYear()}-${d.getMonth()}`,
                    (d, px) => monthLabel(d, px, false), zoom),
            };
        }
        const top = buildSegments(projectStartDate, displayDays,
            d => `${d.getFullYear()}-${d.getMonth()}`,
            (d, px) => monthLabel(d, px, true), zoom);
        if (ganttViewMode === 'week') {
            return {
                topSegments: top,
                bottomSegments: buildSegments(projectStartDate, displayDays,
                    isoWeekKey,
                    (d, px, len) => {
                        const monday = addDays(d, -((d.getDay() + 6) % 7));
                        const label = `W${getWeekNumber(d)}`;
                        if (px >= 90 && len === 7) return `${label} · ${monday.getDate()} ${getMonthName(monday.getMonth()).slice(0, 3)}`;
                        return px >= 28 ? label : '';
                    }, zoom),
            };
        }
        return {
            topSegments: top,
            bottomSegments: buildSegments(projectStartDate, displayDays,
                d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
                (d, px) => {
                    if (px >= 36) return `${WEEKDAY_LETTERS[d.getDay()]} ${d.getDate()}`;
                    if (px >= 16) return `${d.getDate()}`;
                    return '';
                }, zoom),
        };
    }, [ganttViewMode, projectStartDate, displayDays, zoom]);

    // Vertical grid lines: faint at each bottom-header boundary (when there's room), stronger at each top-header boundary.
    const minorLines = bottomSegments.length * 6 < timelineWidth ? bottomSegments.slice(1).map(s => s.start) : [];
    const majorLines = topSegments.slice(1).map(s => s.start);

    // Weekend shading only makes sense when individual days are visible.
    const weekendDays = useMemo(() => {
        if (ganttViewMode === 'month' || zoom < 6) return [];
        const result: number[] = [];
        for (let i = 0; i < displayDays; i++) {
            const day = addDays(projectStartDate, i).getDay();
            if (day === 0 || day === 6) result.push(i);
        }
        return result;
    }, [ganttViewMode, zoom, displayDays, projectStartDate]);

    const renderHeaderRow = (segments: Segment[], emphasis: 'top' | 'bottom') => (
        <div className={`flex border-b border-[#e6e6e2] dark:border-gray-800 ${emphasis === 'bottom' ? 'bg-[#fafaf8] dark:bg-gray-850' : ''}`} style={{ height: HEADER_ROW_HEIGHT }}>
            {segments.map(seg => {
                const isToday = emphasis === 'bottom' && ganttViewMode === 'day' && seg.start === todayOffset;
                const isPastEnd = seg.start >= projectDays;
                const weekday = addDays(projectStartDate, seg.start).getDay();
                const isWeekendCell = emphasis === 'bottom' && ganttViewMode === 'day' && (weekday === 0 || weekday === 6);
                return (
                    <div
                        key={seg.key}
                        className={`flex-shrink-0 flex items-center whitespace-nowrap border-r border-[#e6e6e2]/70 dark:border-gray-800
                            ${emphasis === 'top'
                                ? "justify-start px-2 text-xs font-bold tracking-tight text-[#292c31] dark:text-gray-200 font-['Manrope']"
                                : `justify-center text-[11px] font-semibold ${isWeekendCell ? 'text-gray-400 bg-black/[0.025] dark:bg-white/[0.02]' : 'text-[#7a8472] dark:text-gray-400'}`}
                            ${isToday ? 'bg-[#fdf2ee] dark:bg-[#38221c]' : ''}
                            ${isPastEnd ? 'opacity-50' : ''}
                        `}
                        // 'clip' (unlike 'hidden') doesn't create a scroll container, so the sticky label below still works.
                        style={{ width: seg.length * zoom, overflowX: 'clip' }}
                        title={seg.label}
                    >
                        {isToday ? (
                            <span className="px-1.5 h-5 rounded-full bg-[#ef754e] text-white font-bold text-[10px] flex items-center shadow-2xs">{seg.label}</span>
                        ) : emphasis === 'top' ? (
                            // Month/year labels stay pinned to the left edge while their segment is in view.
                            <span className="sticky left-2">{seg.label}</span>
                        ) : seg.label}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="relative" style={{ width: timelineWidth, overflowX: 'clip' }}>
            {/* Date header: sticks to the top while scrolling vertically, scrolls horizontally with the bars. */}
            <div
                className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md"
                style={{ height: HEADER_HEIGHT }}
            >
                {renderHeaderRow(topSegments, 'top')}
                {renderHeaderRow(bottomSegments, 'bottom')}
                {showToday && (
                    <div
                        className="absolute bottom-0 w-2 h-2 -mb-1 -translate-x-1/2 rounded-full bg-[#ef754e] z-10 pointer-events-none"
                        style={{ left: (todayOffset + 0.5) * zoom }}
                    />
                )}
            </div>

            {/* Body: rows are positioned from the same layout the sidebar uses, so they always line up. */}
            <div className="relative" style={{ height: bodyHeight }}>
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                    {/* Row bands */}
                    {rows.map(row => {
                        const isGroup = row.item.type === 'group';
                        const isSelected = row.item.type === 'task' && row.item.data.id === selectedTaskId;
                        return (
                            <div
                                key={row.key}
                                className={`absolute left-0 right-0 border-b
                                    ${isGroup ? 'bg-[#fafaf8] dark:bg-gray-800/60 border-[#e6e6e2] dark:border-gray-800' : 'border-[#f0f0ec] dark:border-gray-800/70'}
                                    ${isSelected ? 'bg-[#fdf5f2]/80 dark:bg-[#2d221f]/60' : ''}
                                `}
                                style={{ top: row.top, height: row.height }}
                            />
                        );
                    })}

                    {/* Weekends */}
                    {weekendDays.map(i => (
                        <div key={`we-${i}`} className="absolute top-0 bottom-0 bg-black/[0.018] dark:bg-white/[0.015]" style={{ left: i * zoom, width: zoom }} />
                    ))}

                    {/* Days after the project end date */}
                    {displayDays > projectDays && (
                        <div
                            className="absolute top-0 bottom-0 bg-[#f4f5f0]/80 dark:bg-gray-800/50"
                            style={{
                                left: projectDays * zoom,
                                width: (displayDays - projectDays) * zoom,
                                backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(156,163,175,0.12) 6px 7px)',
                            }}
                        />
                    )}

                    {minorLines.map(i => (
                        <div key={`mn-${i}`} className="absolute top-0 bottom-0 border-l border-[#e6e6e2]/50 dark:border-gray-800/60" style={{ left: i * zoom }} />
                    ))}
                    {majorLines.map(i => (
                        <div key={`mj-${i}`} className="absolute top-0 bottom-0 border-l border-[#e6e6e2] dark:border-gray-800" style={{ left: i * zoom }} />
                    ))}

                    {showToday && (
                        <div className="absolute top-0 bottom-0 w-[2px] -ml-px bg-[#ef754e]/85" style={{ left: (todayOffset + 0.5) * zoom }} />
                    )}
                </div>

                {/* Dependencies: above the grid, below the bars */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    <DependencyLines dependencies={dependencies} onRemoveDependency={onRemoveDependency} />
                </div>

                {/* Bars */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {rows.map(row => {
                        const { item } = row;
                        if (item.type === 'task') {
                            return (
                                <GanttTaskBar
                                    key={row.key}
                                    task={item.data}
                                    projectStartDate={projectStartDate}
                                    rowTop={row.top}
                                    rowHeight={row.height}
                                    zoom={zoom}
                                    isSelected={selectedTaskId === item.data.id}
                                    onSelectTask={onSelectTask}
                                    onTaskUpdate={onTaskUpdate}
                                    onDragPreview={onDragPreview}
                                    onDragCommit={onDragCommit}
                                    onRequestEditTask={onRequestEditTask}
                                    isLinking={!!dependencyLink}
                                    isLinkSource={dependencyLink?.fromTaskId === item.data.id}
                                    onLinkTask={onLinkTask}
                                    onStartDependencyLink={onStartDependencyLink}
                                />
                            );
                        }
                        if (item.type === 'group') {
                            if (!item.span) return null;
                            const left = diffInDays(projectStartDate, item.span.startDate) * zoom;
                            const width = (diffInDays(item.span.startDate, item.span.endDate) + 1) * zoom;
                            const color = item.data.color || '#ef754e';
                            return (
                                <div
                                    key={row.key}
                                    className="absolute"
                                    style={{ top: row.top + row.height / 2 - 4, left, width, height: 8 }}
                                    title={`${item.data.name}: ${item.span.startDate.toLocaleDateString()} – ${item.span.endDate.toLocaleDateString()} · ${item.span.completion}% complete`}
                                >
                                    <div className="absolute inset-0 rounded-sm opacity-30" style={{ backgroundColor: color }} />
                                    <div className="absolute top-0 left-0 bottom-0 rounded-sm" style={{ width: `${item.span.completion}%`, backgroundColor: color }} />
                                    {/* bracket ends */}
                                    <div className="absolute -bottom-1 left-0 w-1.5 h-3 rounded-b-sm" style={{ backgroundColor: color }} />
                                    <div className="absolute -bottom-1 right-0 w-1.5 h-3 rounded-b-sm" style={{ backgroundColor: color }} />
                                </div>
                            );
                        }
                        // assignment
                        const a = item.data;
                        const left = diffInDays(projectStartDate, a.startDate) * zoom;
                        const width = Math.max(zoom, (diffInDays(a.startDate, a.endDate) + 1) * zoom);
                        return (
                            <div
                                key={row.key}
                                className="absolute rounded-full pointer-events-auto cursor-pointer"
                                style={{
                                    top: row.top + row.height / 2 - 7,
                                    left, width, height: 14,
                                    backgroundColor: a.completed ? item.color : `${item.color}33`,
                                    border: `1px solid ${item.color}`,
                                    opacity: a.completed ? 0.75 : 1,
                                }}
                                title={`${a.name}${a.completed ? ' (done)' : ''} · ${a.startTime}–${a.endTime}`}
                                onClick={() => onSelectTask(a.taskId)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Timeline;
