
import React, { useState, useMemo, useEffect } from 'react';
import { ProjectData, Task, Meeting, Assignment, Priority } from '../types';
import { getDaysInMonth, getMonthName, getDayOfWeek, addDays, diffInDays, getWeekNumber } from '../services/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/ChevronIcons';
import { CheckCircleIconSolid } from './icons/CheckCircleIcon'; // Using as a checkmark for calendar list
import { TASK_COLORS } from '../constants';
import { GoogleCalendarIcon } from './icons/GoogleCalendarIcon';
import { OutlookIcon } from './icons/OutlookIcon';
import { SyncArrowsIcon } from './icons/SyncArrowsIcon';
import CalendarSyncModal from './CalendarSyncModal';
import { syncWithServerFeed } from '../services/calendarSync';

interface CalendarViewProps {
    projectData: ProjectData;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    onRequestEditTask: (taskId: string) => void;
    onRequestEditMeeting: (meetingId: string) => void;
}

type CalendarViewMode = 'month' | 'week' | 'day';

type CalendarDate = Date | string;

const toLocalDate = (value: CalendarDate): Date => {
    if (value instanceof Date) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const parsed = new Date(value);
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const HOUR_HEIGHT_REM = 3.5;
const HOUR_HEIGHT_PX = 56;
const SLOT_MINUTES = 30;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const formatTime = (hourValue: number): string => {
    const clamped = clamp(hourValue, 0, 24);
    const totalMinutes = Math.round(clamped * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const formatTimeLabel = (hourValue: number): string => {
    const [hours, minutes] = formatTime(hourValue).split(':').map(Number);
    const displayHour = hours % 12 || 12;
    const suffix = hours < 12 ? 'AM' : 'PM';
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

// --- Helper Components ---

const InlineMiniCalendar: React.FC<{
    currentDate: Date;
    onDateSelect: (date: Date) => void;
}> = ({ currentDate, onDateSelect }) => {
    const [displayDate, setDisplayDate] = useState(currentDate);

    useEffect(() => {
        setDisplayDate(currentDate);
    }, [currentDate]);

    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const changeMonth = (offset: number) => {
        setDisplayDate(new Date(year, month + offset, 1));
    };

    return (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    {getMonthName(month)} {year}
                </span>
                <div className="flex gap-1">
                    <button onClick={() => changeMonth(-1)} className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <button onClick={() => changeMonth(1)} className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <span key={i} className="text-gray-400 font-medium">{d}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                {days.map(day => {
                    const date = new Date(year, month, day);
                    const isSelected = date.toDateString() === currentDate.toDateString();
                    const isToday = new Date().toDateString() === date.toDateString();
                    
                    return (
                        <div key={day} className="flex justify-center">
                            <button
                                onClick={() => onDateSelect(date)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors
                                    ${isSelected ? 'bg-blue-600 text-white font-semibold' : ''}
                                    ${!isSelected && isToday ? 'text-red-500 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                                `}
                            >
                                {day}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CalendarSidebar: React.FC<{
    currentDate: Date;
    onDateSelect: (date: Date) => void;
    visibleCalendars: { tasks: boolean; meetings: boolean; google: boolean; outlook: boolean };
    onToggleCalendar: (cal: 'tasks' | 'meetings' | 'google' | 'outlook') => void;
    onOpenSyncModal: () => void;
    counts: { tasks: number; meetings: number; google: number; outlook: number };
}> = ({ currentDate, onDateSelect, visibleCalendars, onToggleCalendar, onOpenSyncModal, counts }) => {
    return (
        <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 flex flex-col h-full overflow-y-auto hidden md:flex">
            <InlineMiniCalendar currentDate={currentDate} onDateSelect={onDateSelect} />
            
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Calendars</h3>
                    <button
                        id="calendar-sync-sidebar-btn"
                        onClick={onOpenSyncModal}
                        className="text-[11px] font-semibold text-[#ef754e] hover:underline flex items-center gap-1"
                    >
                        <SyncArrowsIcon className="w-3 h-3" />
                        Sync
                    </button>
                </div>
                <div className="space-y-2">
                    <button 
                        onClick={() => onToggleCalendar('tasks')}
                        className="flex items-center gap-2.5 w-full text-left group px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleCalendars.tasks ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                            {visibleCalendars.tasks && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium flex-1">Tasks</span>
                        <span className="text-[10px] text-gray-400 font-mono bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">{counts.tasks}</span>
                    </button>
                    <button 
                        onClick={() => onToggleCalendar('meetings')}
                        className="flex items-center gap-2.5 w-full text-left group px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleCalendars.meetings ? 'bg-indigo-500 border-indigo-500' : 'border-gray-400'}`}>
                            {visibleCalendars.meetings && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium flex-1">Meetings</span>
                        <span className="text-[10px] text-gray-400 font-mono bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">{counts.meetings}</span>
                    </button>
                    <button 
                        onClick={() => onToggleCalendar('google')}
                        className="flex items-center gap-2.5 w-full text-left group px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleCalendars.google ? 'bg-[#4285F4] border-[#4285F4]' : 'border-gray-400'}`}>
                            {visibleCalendars.google && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <GoogleCalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium flex-1 truncate">Google Calendar</span>
                        {counts.google > 0 && <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">{counts.google}</span>}
                    </button>
                    <button 
                        onClick={() => onToggleCalendar('outlook')}
                        className="flex items-center gap-2.5 w-full text-left group px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleCalendars.outlook ? 'bg-[#0078D4] border-[#0078D4]' : 'border-gray-400'}`}>
                            {visibleCalendars.outlook && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <OutlookIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium flex-1 truncate">Outlook Calendar</span>
                        {counts.outlook > 0 && <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold bg-sky-50 dark:bg-sky-950 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800">{counts.outlook}</span>}
                    </button>
                </div>
            </div>

            {/* Sync Quick Widget at bottom */}
            <div className="p-4 mt-auto">
                <div className="p-3 rounded-xl bg-orange-50/70 dark:bg-gray-800 border border-orange-200/60 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Sync Active
                        </span>
                        <span className="text-[10px] font-medium text-gray-500">2-Way</span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-2.5 leading-snug">
                        Syncs tasks & meetings with Google Calendar and Outlook.
                    </p>
                    <button
                        onClick={onOpenSyncModal}
                        className="w-full py-1.5 px-3 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        <SyncArrowsIcon className="w-3.5 h-3.5 text-[#ef754e]" />
                        <span>Manage Calendar Sync</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Views ---

const MonthView: React.FC<{ 
    projectData: ProjectData; 
    currentDate: Date; 
    onDateClick: (date: Date) => void;
    onRequestEditTask: (id: string) => void;
    onRequestEditMeeting: (id: string) => void;
    visibleCalendars: { tasks: boolean; meetings: boolean; google: boolean; outlook: boolean };
}> = ({ projectData, currentDate, onDateClick, onRequestEditTask, onRequestEditMeeting, visibleCalendars }) => {
    const { tasks, meetings } = projectData;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    
    // Calculate padding for start of month
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Apple calendar usually starts on Sunday or based on locale. Assuming Sunday start.
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    // Calculate total grid cells needed (rows * 7)
    const totalCells = blanks.length + days.length;
    const rows = Math.ceil(totalCells / 7);
    const trailingBlanks = Array.from({ length: (rows * 7) - totalCells }, (_, i) => i);

    const eventsByDate = useMemo(() => {
        const events: { [key: number]: (Task | Meeting)[] } = {};
        
        meetings.forEach(meeting => {
            if (meeting.source === 'google' && !visibleCalendars.google) return;
            if (meeting.source === 'outlook' && !visibleCalendars.outlook) return;
            if ((!meeting.source || meeting.source === 'local') && !visibleCalendars.meetings) return;

            const meetingDate = new Date(meeting.date);
            if (meetingDate.getFullYear() === year && meetingDate.getMonth() === month) {
                const day = meetingDate.getDate();
                if (!events[day]) events[day] = [];
                events[day].push(meeting);
            }
        });

        tasks.forEach(task => {
            if (task.source === 'google' && !visibleCalendars.google) return;
            if (task.source === 'outlook' && !visibleCalendars.outlook) return;
            if ((!task.source || task.source === 'local') && !visibleCalendars.tasks) return;

            const start = new Date(task.startDate);
            const end = new Date(task.endDate);
            let current = new Date(start);
            // Simple daily iteration to place tasks
            while (current <= end) {
                if (current.getFullYear() === year && current.getMonth() === month) {
                    const day = current.getDate();
                    if (!events[day]) events[day] = [];
                    if (!events[day].some(e => e.id === task.id)) {
                        events[day].push(task);
                    }
                }
                current = addDays(current, 1);
            }
        });
        return events;
    }, [tasks, meetings, year, month, visibleCalendars]);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {weekDays.map(day => (
                    <div key={day} className="py-2 text-right pr-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {day}
                    </div>
                ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="flex-grow grid grid-cols-7 auto-rows-fr border-l border-gray-200 dark:border-gray-700">
                {blanks.map(i => (
                    <div key={`blank-start-${i}`} className="border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30"></div>
                ))}
                
                {days.map(day => {
                    const events = eventsByDate[day] || [];
                    const date = new Date(year, month, day);
                    const isToday = new Date().toDateString() === date.toDateString();
                    const isFirstDay = day === 1;

                    return (
                        <div 
                            key={day} 
                            className="border-b border-r border-gray-200 dark:border-gray-700 relative p-1 min-h-[100px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                            onClick={() => onDateClick(date)}
                        >
                            <div className="flex justify-end items-start mb-1">
                                <span className={`
                                    text-sm font-medium px-1.5 py-0.5 rounded-full
                                    ${isToday 
                                        ? 'bg-red-500 text-white' 
                                        : 'text-gray-700 dark:text-gray-300'
                                    }
                                `}>
                                    {isFirstDay ? `${getMonthName(month).substring(0,3)} ${day}` : day}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 overflow-hidden">
                                {events.slice(0, 4).map(event => {
                                    const isTask = 'startDate' in event;
                                    const source = (event as any).source;
                                    return (
                                        <div
                                            key={`${event.id}-${day}`} // Ensure unique key for multi-day occurrences
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isTask) onRequestEditTask(event.id);
                                                else onRequestEditMeeting(event.id);
                                            }}
                                            className={`
                                                px-2 py-0.5 rounded-[4px] text-[11px] font-medium truncate leading-tight shadow-sm cursor-pointer flex items-center gap-1
                                                ${isTask ? 'border-l-2' : ''}
                                            `}
                                            style={{ 
                                                backgroundColor: isTask ? `${event.color}30` : event.color,
                                                color: isTask ? '#1f2937' : '#fff',
                                                borderLeftColor: isTask ? event.color : undefined,
                                            }}
                                        >
                                            {source === 'google' && <GoogleCalendarIcon className="w-3 h-3 flex-shrink-0" />}
                                            {source === 'outlook' && <OutlookIcon className="w-3 h-3 flex-shrink-0" />}
                                            <span className="truncate">{isTask ? event.name : event.title}</span>
                                        </div>
                                    );
                                })}
                                {events.length > 4 && (
                                    <div className="text-[10px] text-gray-500 pl-1 font-medium">
                                        {events.length - 4} more...
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {trailingBlanks.map(i => (
                    <div key={`blank-end-${i}`} className="border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30"></div>
                ))}
            </div>
        </div>
    );
};

const WeekDayView: React.FC<{ 
    projectData: ProjectData; 
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    startDate: Date; 
    numDays: number;
    onRequestEditTask: (id: string) => void;
    onRequestEditMeeting: (id: string) => void;
    visibleCalendars: { tasks: boolean; meetings: boolean; google: boolean; outlook: boolean };
}> = ({ projectData, onSetData, startDate, numDays, onRequestEditTask, onRequestEditMeeting, visibleCalendars }) => {
    const { tasks, meetings, assignments = [] } = projectData;
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const normalizedStartDate = useMemo(() => startOfDay(startDate), [startDate]);
    const days = useMemo(() => Array.from({ length: numDays }, (_, i) => addDays(normalizedStartDate, i)), [normalizedStartDate, numDays]);
    const [dragSelection, setDragSelection] = useState<null | { dayIndex: number; startHour: number; endHour: number; isDragging: boolean }>(null);

    const getSlotFromPointer = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = clamp(event.clientX - rect.left, 0, rect.width - 1);
        const y = clamp(event.clientY - rect.top, 0, HOUR_HEIGHT_PX * 24);
        const dayIndex = clamp(Math.floor((x / rect.width) * numDays), 0, numDays - 1);
        const rawHour = y / HOUR_HEIGHT_PX;
        const snappedHour = clamp(Math.round(rawHour * (60 / SLOT_MINUTES)) / (60 / SLOT_MINUTES), 0, 24);
        return { dayIndex, hour: snappedHour };
    };

    const createTaskFromSelection = (selection: { dayIndex: number; startHour: number; endHour: number }) => {
        const startHour = Math.min(selection.startHour, selection.endHour);
        const endHour = Math.max(selection.startHour, selection.endHour);
        const normalizedEndHour = endHour === startHour ? Math.min(startHour + 1, 24) : endHour;
        if (normalizedEndHour <= startHour) return;

        const date = days[selection.dayIndex];
        const taskId = `t-${Date.now()}`;
        const assignmentId = `a-${Date.now()}`;
        const taskName = `New task ${formatTimeLabel(startHour)}`;
        const color = TASK_COLORS[35];
        const newTask: Task = {
            id: taskId,
            name: taskName,
            startDate: date,
            endDate: date,
            assignedTo: [],
            color,
            completion: 0,
            priority: Priority.Medium,
            notes: '',
            tags: [],
            customFieldValues: {},
        };
        const newAssignment: Assignment = {
            id: assignmentId,
            taskId,
            name: taskName,
            startDate: date,
            endDate: date,
            startTime: formatTime(startHour),
            endTime: formatTime(normalizedEndHour),
            assignedTo: [],
            completed: false,
        };

        onSetData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                tasks: [...prev.tasks, newTask],
                assignments: [...(prev.assignments || []), newAssignment],
                designLayout: {
                    ...prev.designLayout,
                    tasks: {
                        ...prev.designLayout.tasks,
                        [taskId]: { x: 80, y: 80 },
                    },
                },
            };
        });
        onRequestEditTask(taskId);
    };

    const events = useMemo(() => {
        const endDate = addDays(normalizedStartDate, numDays);
        const allDayEvents: (Task & { type: 'task'; startIndex: number; span: number })[] = [];
        const timedEvents: any[] = [];

        const taskIdsWithTimedAssignments = new Set(assignments.map(assignment => assignment.taskId));
        const relevantTasks = tasks.filter(t => {
            if (t.source === 'google' && !visibleCalendars.google) return false;
            if (t.source === 'outlook' && !visibleCalendars.outlook) return false;
            if ((!t.source || t.source === 'local') && !visibleCalendars.tasks) return false;
            return toLocalDate(t.startDate) < endDate && toLocalDate(t.endDate) >= normalizedStartDate;
        });

        relevantTasks.forEach(task => {
            if (taskIdsWithTimedAssignments.has(task.id)) return;
            const taskStart = toLocalDate(task.startDate);
            const taskEnd = toLocalDate(task.endDate);
            const startIndex = Math.max(0, diffInDays(normalizedStartDate, taskStart));
            const endIndex = Math.min(numDays - 1, diffInDays(normalizedStartDate, taskEnd));
            allDayEvents.push({ ...task, type: 'task', startIndex, span: endIndex - startIndex + 1 });
        });

        if (visibleCalendars.tasks) {
            const taskById = new Map(tasks.map(task => [task.id, task]));
            assignments.forEach(assignment => {
                const assignmentStart = toLocalDate(assignment.startDate);
                const assignmentEnd = toLocalDate(assignment.endDate);
                if (assignmentStart >= endDate || assignmentEnd < normalizedStartDate) return;

                const task = taskById.get(assignment.taskId);
                const [startHour, startMinute] = assignment.startTime.split(':').map(Number);
                const [endHour, endMinute] = assignment.endTime.split(':').map(Number);
                const start = startHour + startMinute / 60;
                const end = endHour + endMinute / 60;
                const visibleStartIndex = Math.max(0, diffInDays(normalizedStartDate, assignmentStart));
                const visibleEndIndex = Math.min(numDays - 1, diffInDays(normalizedStartDate, assignmentEnd));

                for (let dayIndex = visibleStartIndex; dayIndex <= visibleEndIndex; dayIndex += 1) {
                    timedEvents.push({
                        ...assignment,
                        type: 'assignment',
                        title: assignment.name,
                        color: task?.color || TASK_COLORS[35],
                        start,
                        end,
                        dayIndex,
                        taskId: assignment.taskId,
                    });
                }
            });
        }

        const relevantMeetings = meetings.filter(m => {
            if (m.source === 'google' && !visibleCalendars.google) return false;
            if (m.source === 'outlook' && !visibleCalendars.outlook) return false;
            if ((!m.source || m.source === 'local') && !visibleCalendars.meetings) return false;
            const meetingDate = toLocalDate(m.date);
            return meetingDate >= normalizedStartDate && meetingDate < endDate;
        });

        relevantMeetings.forEach(meeting => {
            const meetingDate = toLocalDate(meeting.date);
            const [startHour, startMinute] = meeting.startTime.split(':').map(Number);
            const [endHour, endMinute] = meeting.endTime.split(':').map(Number);
            timedEvents.push({
                ...meeting,
                type: 'meeting',
                start: startHour + startMinute / 60,
                end: endHour + endMinute / 60,
                dayIndex: diffInDays(normalizedStartDate, meetingDate),
            });
        });

        return { allDayEvents, timedEvents };
    }, [tasks, meetings, assignments, normalizedStartDate, numDays, visibleCalendars]);

    // Current time line position
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const currentHour = now.getHours() + now.getMinutes() / 60;
    const isTodayVisible = days.some(d => d.toDateString() === now.toDateString());
    const todayDayIndex = diffInDays(normalizedStartDate, now);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
            {/* Header Row */}
            <div className="flex flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                <div className="w-14 flex-shrink-0 border-r border-gray-200 dark:border-gray-700"></div>
                <div className="flex-1 grid min-w-0" style={{ gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))` }}>
                    {days.map((day, i) => {
                        const isToday = day.toDateString() === now.toDateString();
                        return (
                            <div key={i} className="py-3 text-center border-r border-gray-100 dark:border-gray-800 last:border-r-0">
                                <div className={`text-xs font-medium uppercase mb-1 ${isToday ? 'text-red-500' : 'text-gray-500'}`}>
                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className={`
                                    inline-flex items-center justify-center w-8 h-8 rounded-full text-xl font-light
                                    ${isToday ? 'bg-red-500 text-white shadow-md' : 'text-gray-800 dark:text-gray-100'}
                                `}>
                                    {day.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="w-3 flex-shrink-0"></div>
            </div>

            {/* All Day Section */}
            {events.allDayEvents.length > 0 && (
                <div className="flex flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-14 flex-shrink-0 text-xs text-gray-400 text-right pr-2 py-2 border-r border-gray-200 dark:border-gray-700">
                        all-day
                    </div>
                    <div className="flex-1 relative py-1 min-w-0">
                        <div className="relative z-10 grid gap-1 px-1" style={{ gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))` }}>
                            {events.allDayEvents.slice(0, 3).map(event => (
                                <div 
                                    key={event.id} 
                                    className="h-6 rounded px-2 flex items-center gap-1 text-xs font-medium text-white truncate cursor-pointer shadow-sm"
                                    style={{ backgroundColor: event.color, gridColumn: `${event.startIndex + 1} / span ${event.span}` }}
                                    onClick={() => onRequestEditTask(event.id)}
                                >
                                    {event.source === 'google' && <GoogleCalendarIcon className="w-3 h-3 flex-shrink-0" />}
                                    {event.source === 'outlook' && <OutlookIcon className="w-3 h-3 flex-shrink-0" />}
                                    <span className="truncate">{event.name}</span>
                                </div>
                            ))}
                            {events.allDayEvents.length > 3 && (
                                <span className="text-xs text-gray-400 pl-2" style={{ gridColumn: `1 / span ${numDays}` }}>
                                    +{events.allDayEvents.length - 3} more
                                </span>
                            )}
                        </div>
                         {/* Vertical grid lines for all-day section */}
                         <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))` }}>
                            {days.map((_, i) => <div key={i} className="border-r border-gray-100 dark:border-gray-800 last:border-r-0 h-full"></div>)}
                        </div>
                    </div>
                    <div className="w-3 flex-shrink-0"></div>
                </div>
            )}

            {/* Scrollable Time Grid */}
            <div className="flex-1 overflow-y-auto relative flex">
                {/* Time Axis */}
                <div className="w-14 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 pt-2">
                    {hours.map(hour => (
                        <div key={hour} className="h-14 text-right pr-2 relative">
                            <span className="text-xs text-gray-400 font-medium -top-2 relative">
                                {hour === 0 ? '' : `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Grid Content */}
                <div
                    className="flex-1 relative min-w-0 select-none"
                    onMouseDown={(event) => {
                        if (event.button !== 0) return;
                        const { dayIndex, hour } = getSlotFromPointer(event);
                        setDragSelection({ dayIndex, startHour: hour, endHour: hour, isDragging: true });
                    }}
                    onMouseMove={(event) => {
                        if (!dragSelection?.isDragging) return;
                        const { dayIndex, hour } = getSlotFromPointer(event);
                        setDragSelection(prev => prev ? { ...prev, dayIndex: prev.dayIndex, endHour: dayIndex === prev.dayIndex ? hour : prev.endHour } : prev);
                    }}
                    onMouseUp={() => {
                        if (!dragSelection) return;
                        createTaskFromSelection(dragSelection);
                        setDragSelection(null);
                    }}
                    onMouseLeave={() => {
                        if (dragSelection?.isDragging) setDragSelection(prev => prev ? { ...prev, isDragging: false } : prev);
                    }}
                >
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex flex-col">
                        {hours.map(h => (
                            <div key={h} className="h-14 border-b border-gray-100 dark:border-gray-800 w-full"></div>
                        ))}
                    </div>
                    {/* Vertical Day Lines */}
                    <div className="absolute inset-0 flex">
                        {days.map((_, i) => (
                            <div key={i} className="flex-1 border-r border-gray-100 dark:border-gray-800 last:border-r-0 h-full"></div>
                        ))}
                    </div>

                    {/* Current Time Indicator */}
                    {isTodayVisible && (
                        <div 
                            className="absolute w-full pointer-events-none z-20 flex items-center"
                            style={{ top: `${currentHour * 3.5}rem` }} // 3.5rem = 14 * 4px (tailwind h-14)
                        >
                            {/* We need to position the line only on today's column if in week view, or full width if day view */}
                            {numDays === 1 ? (
                                <>
                                    <div className="absolute -left-[5px] w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                                    <div className="w-full h-px bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]"></div>
                                </>
                            ) : (
                                <div 
                                    className="absolute h-px bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)] flex items-center"
                                    style={{ 
                                        left: `${(todayDayIndex / numDays) * 100}%`, 
                                        width: `${100 / numDays}%` 
                                    }}
                                >
                                    <div className="absolute -left-[3px] w-2 h-2 bg-red-500 rounded-full"></div>
                                </div>
                            )}
                        </div>
                    )}

                    {dragSelection && (
                        <div className="absolute inset-0 grid pointer-events-none z-20" style={{ gridTemplateColumns: `repeat(${numDays}, 1fr)` }}>
                            <div
                                className="relative mx-1"
                                style={{ gridColumnStart: dragSelection.dayIndex + 1 }}
                            >
                                <div
                                    className="absolute inset-x-0 rounded-md border-2 border-blue-500 bg-blue-500/15 shadow-sm"
                                    style={{
                                        top: `${Math.min(dragSelection.startHour, dragSelection.endHour) * HOUR_HEIGHT_REM}rem`,
                                        height: `${Math.max(Math.abs(dragSelection.endHour - dragSelection.startHour), 0.5) * HOUR_HEIGHT_REM}rem`,
                                    }}
                                >
                                    <div className="px-2 py-1 text-[11px] font-semibold text-blue-700">
                                        {formatTimeLabel(Math.min(dragSelection.startHour, dragSelection.endHour))} - {formatTimeLabel(Math.max(dragSelection.startHour, dragSelection.endHour))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Events */}
                    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${numDays}, 1fr)` }}>
                        {events.timedEvents.map(event => (
                            <div
                                key={`${event.type}-${event.id}-${event.dayIndex}`}
                                className="relative mx-1 mt-px"
                                style={{ gridColumnStart: event.dayIndex + 1 }}
                            >
                                <div
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={() => event.type === 'assignment' ? onRequestEditTask(event.taskId) : onRequestEditMeeting(event.id)}
                                    className="absolute inset-x-0 rounded-md p-2 text-xs shadow-sm border-l-4 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                                    style={{
                                        top: `${event.start * 3.5}rem`,
                                        height: `${Math.max((event.end - event.start) * 3.5, 1.5)}rem`,
                                        backgroundColor: `${event.color}20`, // Light background
                                        borderLeftColor: event.color,
                                        color: event.color === '#ffffff' ? '#000' : '#374151' // Fallback text color
                                    }}
                                >
                                    <div className="font-bold leading-none mb-0.5 flex items-center gap-1" style={{color: event.color}}>
                                        {event.source === 'google' && <GoogleCalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />}
                                        {event.source === 'outlook' && <OutlookIcon className="w-3.5 h-3.5 flex-shrink-0" />}
                                        <span className="truncate">{event.title}</span>
                                    </div>
                                    <div className="opacity-80" style={{color: event.color}}>{event.startTime} - {event.endTime}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


const CalendarView: React.FC<CalendarViewProps> = (props) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
    const [visibleCalendars, setVisibleCalendars] = useState({ tasks: true, meetings: true, google: true, outlook: true });
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncToast, setSyncToast] = useState<string | null>(null);

    // Dynamic item counts by source
    const counts = useMemo(() => {
        const { tasks = [], meetings = [] } = props.projectData;
        const tasksCount = tasks.filter(t => !t.source || t.source === 'local').length;
        const meetingsCount = meetings.filter(m => !m.source || m.source === 'local').length;
        const googleCount = tasks.filter(t => t.source === 'google').length + meetings.filter(m => m.source === 'google').length;
        const outlookCount = tasks.filter(t => t.source === 'outlook').length + meetings.filter(m => m.source === 'outlook').length;
        return { tasks: tasksCount, meetings: meetingsCount, google: googleCount, outlook: outlookCount };
    }, [props.projectData]);

    const handleQuickSync = async () => {
        setIsSyncing(true);
        try {
            const res = await syncWithServerFeed(props.projectData);
            setSyncToast(`Synced ${res.itemsCount} items to Google & Outlook feed`);
            setTimeout(() => setSyncToast(null), 3500);
        } catch (e: any) {
            setSyncToast('Sync: ' + (e.message || 'Updated feed'));
            setTimeout(() => setSyncToast(null), 3500);
        } finally {
            setIsSyncing(false);
        }
    };

    // Navigation Handlers
    const handlePrev = () => {
        if (viewMode === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
        else if (viewMode === 'week') setCurrentDate(d => addDays(d, -7));
        else setCurrentDate(d => addDays(d, -1));
    };
    
    const handleNext = () => {
        if (viewMode === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
        else if (viewMode === 'week') setCurrentDate(d => addDays(d, 7));
        else setCurrentDate(d => addDays(d, 1));
    };

    const handleToday = () => setCurrentDate(new Date());

    const handleToggleCalendar = (cal: 'tasks' | 'meetings' | 'google' | 'outlook') => {
        setVisibleCalendars(prev => ({ ...prev, [cal]: !prev[cal] }));
    };

    // Calculate start of week for Week View
    const weekStartDate = useMemo(() => {
        const d = new Date(currentDate);
        const dayOfWeek = d.getDay(); // 0 (Sun) - 6 (Sat)
        return addDays(d, -dayOfWeek);
    }, [currentDate]);

    // Render Header
    const headerDate = useMemo(() => {
        if (viewMode === 'month') {
            return `${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`;
        }
        if (viewMode === 'day') {
            return currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        // Week view range
        const endOfWeek = addDays(weekStartDate, 6);
        const startMonth = getMonthName(weekStartDate.getMonth());
        const endMonth = getMonthName(endOfWeek.getMonth());
        if (startMonth === endMonth) {
            return `${startMonth} ${weekStartDate.getFullYear()}`;
        }
        return `${startMonth} - ${endMonth} ${endOfWeek.getFullYear()}`;
    }, [currentDate, viewMode, weekStartDate]);

    return (
        <div className="flex h-full bg-white dark:bg-gray-900">
            {/* Sidebar */}
            <CalendarSidebar 
                currentDate={currentDate} 
                onDateSelect={(d) => { setCurrentDate(d); setViewMode('day'); }}
                visibleCalendars={visibleCalendars}
                onToggleCalendar={handleToggleCalendar}
                onOpenSyncModal={() => setIsSyncModalOpen(true)}
                counts={counts}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <header className="flex-shrink-0 h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-6 w-1/3">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{headerDate}</h2>
                        <div className="flex items-center gap-1">
                            <button onClick={handlePrev} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <button onClick={handleToday} className="px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                                Today
                            </button>
                            <button onClick={handleNext} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="w-1/3 flex justify-center">
                        {/* Segmented Control */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                            {(['day', 'week', 'month'] as CalendarViewMode[]).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`
                                        px-4 py-1 text-sm font-medium rounded-md capitalize transition-all
                                        ${viewMode === mode 
                                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }
                                    `}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Right Tools: Calendar Sync & Quick Trigger */}
                    <div className="w-1/3 flex justify-end items-center gap-2">
                        {syncToast && (
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full animate-fade-in flex items-center gap-1.5 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                {syncToast}
                            </span>
                        )}

                        <button
                            onClick={handleQuickSync}
                            disabled={isSyncing}
                            title="Sync project with Google Calendar & Outlook feed"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-all shadow-sm disabled:opacity-50"
                        >
                            <SyncArrowsIcon className={`w-3.5 h-3.5 text-[#ef754e] ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                        </button>

                        <button
                            id="calendar-sync-main-btn"
                            onClick={() => setIsSyncModalOpen(true)}
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#ef754e] hover:bg-[#e0643d] text-white text-xs font-semibold shadow-sm transition-all"
                        >
                            <div className="flex items-center -space-x-1">
                                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center p-0.5 shadow-sm">
                                    <GoogleCalendarIcon className="w-3 h-3" />
                                </div>
                                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center p-0.5 shadow-sm">
                                    <OutlookIcon className="w-3 h-3" />
                                </div>
                            </div>
                            <span>Calendar Sync</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                        </button>
                    </div>
                </header>

                {/* View Area */}
                <div className="flex-1 overflow-hidden relative">
                    {viewMode === 'month' && (
                        <MonthView 
                            projectData={props.projectData} 
                            currentDate={currentDate} 
                            onDateClick={(d) => { setCurrentDate(d); setViewMode('day'); }} 
                            onRequestEditTask={props.onRequestEditTask}
                            onRequestEditMeeting={props.onRequestEditMeeting}
                            visibleCalendars={visibleCalendars}
                        />
                    )}
                    {viewMode === 'week' && (
                        <WeekDayView 
                            projectData={props.projectData} 
                            onSetData={props.onSetData}
                            startDate={weekStartDate} 
                            numDays={7}
                            onRequestEditTask={props.onRequestEditTask}
                            onRequestEditMeeting={props.onRequestEditMeeting}
                            visibleCalendars={visibleCalendars}
                        />
                    )}
                    {viewMode === 'day' && (
                        <WeekDayView 
                            projectData={props.projectData} 
                            onSetData={props.onSetData}
                            startDate={currentDate} 
                            numDays={1}
                            onRequestEditTask={props.onRequestEditTask}
                            onRequestEditMeeting={props.onRequestEditMeeting}
                            visibleCalendars={visibleCalendars}
                        />
                    )}
                </div>
            </div>

            {/* Calendar Synchronization Modal */}
            <CalendarSyncModal
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                projectData={props.projectData}
                onSetData={props.onSetData}
            />
        </div>
    );
};

export default CalendarView;
