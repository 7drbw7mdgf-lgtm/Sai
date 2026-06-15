
import React, { useState, useMemo, useEffect } from 'react';
import { ProjectData, Task, Meeting } from '../types';
import { getDaysInMonth, getMonthName, getDayOfWeek, addDays, diffInDays, getWeekNumber } from '../services/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/ChevronIcons';
import { CheckCircleIconSolid } from './icons/CheckCircleIcon'; // Using as a checkmark for calendar list

interface CalendarViewProps {
    projectData: ProjectData;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    onRequestEditTask: (taskId: string) => void;
    onRequestEditMeeting: (meetingId: string) => void;
}

type CalendarViewMode = 'month' | 'week' | 'day';

// --- Helper Components ---

const InlineMiniCalendar: React.FC<{
    currentDate: Date;
    onDateSelect: (date: Date) => void;
}> = ({ currentDate, onDateSelect }) => {
    const [displayDate, setDisplayDate] = useState(currentDate);

    // Sync internal display date if currentDate changes externally significantly (optional, usually mini cal stays independent or syncs)
    // For now, let's keep mini calendar navigation independent but highlight selected date
    
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
    visibleCalendars: { tasks: boolean; meetings: boolean };
    onToggleCalendar: (cal: 'tasks' | 'meetings') => void;
}> = ({ currentDate, onDateSelect, visibleCalendars, onToggleCalendar }) => {
    return (
        <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col h-full overflow-y-auto hidden md:flex">
            <InlineMiniCalendar currentDate={currentDate} onDateSelect={onDateSelect} />
            
            <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Calendars</h3>
                <div className="space-y-2">
                    <button 
                        onClick={() => onToggleCalendar('tasks')}
                        className="flex items-center gap-2 w-full text-left group"
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleCalendars.tasks ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                            {visibleCalendars.tasks && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Tasks</span>
                    </button>
                    <button 
                        onClick={() => onToggleCalendar('meetings')}
                        className="flex items-center gap-2 w-full text-left group"
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleCalendars.meetings ? 'bg-indigo-500 border-indigo-500' : 'border-gray-400'}`}>
                            {visibleCalendars.meetings && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Meetings</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Main Views ---

const MonthView: React.FC<{ 
    projectData: ProjectData; 
    currentDate: Date; 
    onDateClick: (date: Date) => void;
    onRequestEditTask: (id: string) => void;
    onRequestEditMeeting: (id: string) => void;
    visibleCalendars: { tasks: boolean; meetings: boolean };
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
        
        if (visibleCalendars.meetings) {
            meetings.forEach(meeting => {
                const meetingDate = new Date(meeting.date);
                if (meetingDate.getFullYear() === year && meetingDate.getMonth() === month) {
                    const day = meetingDate.getDate();
                    if (!events[day]) events[day] = [];
                    events[day].push(meeting);
                }
            });
        }

        if (visibleCalendars.tasks) {
            tasks.forEach(task => {
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
        }
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
                                {events.slice(0, 4).map(event => (
                                    <div
                                        key={`${event.id}-${day}`} // Ensure unique key for multi-day occurrences
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if ('startDate' in event) onRequestEditTask(event.id);
                                            else onRequestEditMeeting(event.id);
                                        }}
                                        className={`
                                            px-2 py-0.5 rounded-[4px] text-[11px] font-medium truncate leading-tight shadow-sm cursor-pointer
                                            ${'startDate' in event ? 'border-l-2' : ''}
                                        `}
                                        style={{ 
                                            backgroundColor: 'startDate' in event ? `${event.color}30` : event.color,
                                            color: 'startDate' in event ? '#1f2937' : '#fff',
                                            borderLeftColor: 'startDate' in event ? event.color : undefined,
                                            // Dark mode overrides
                                        }}
                                    >
                                        {'name' in event ? event.name : event.title}
                                    </div>
                                ))}
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
    startDate: Date; 
    numDays: number;
    onRequestEditTask: (id: string) => void;
    onRequestEditMeeting: (id: string) => void;
    visibleCalendars: { tasks: boolean; meetings: boolean };
}> = ({ projectData, startDate, numDays, onRequestEditTask, onRequestEditMeeting, visibleCalendars }) => {
    const { tasks, meetings } = projectData;
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = Array.from({ length: numDays }, (_, i) => addDays(startDate, i));

    const events = useMemo(() => {
        const endDate = addDays(startDate, numDays);
        const allDayEvents: any[] = [];
        const timedEvents: any[] = [];

        if (visibleCalendars.tasks) {
            const relevantTasks = tasks.filter(t => new Date(t.startDate) < endDate && new Date(t.endDate) >= startDate);
            relevantTasks.forEach(task => {
                allDayEvents.push({ ...task, type: 'task' });
            });
        }

        if (visibleCalendars.meetings) {
            const relevantMeetings = meetings.filter(m => {
                const meetingDate = new Date(m.date);
                return meetingDate >= startDate && meetingDate < endDate;
            });
            relevantMeetings.forEach(meeting => {
                const [startHour, startMinute] = meeting.startTime.split(':').map(Number);
                const [endHour, endMinute] = meeting.endTime.split(':').map(Number);
                timedEvents.push({
                    ...meeting,
                    type: 'meeting',
                    start: startHour + startMinute / 60,
                    end: endHour + endMinute / 60,
                    dayIndex: diffInDays(startDate, new Date(meeting.date)),
                });
            });
        }

        return { allDayEvents, timedEvents };
    }, [tasks, meetings, startDate, numDays, visibleCalendars]);

    // Current time line position
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const currentHour = now.getHours() + now.getMinutes() / 60;
    const isTodayVisible = days.some(d => d.toDateString() === now.toDateString());
    const todayDayIndex = diffInDays(startDate, now);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
            {/* Header Row */}
            <div className="flex flex-shrink-0 border-b border-gray-200 dark:border-gray-700 pl-14">
                {days.map((day, i) => {
                    const isToday = day.toDateString() === now.toDateString();
                    return (
                        <div key={i} className="flex-1 py-3 text-center border-l border-gray-100 dark:border-gray-800 first:border-l-0">
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

            {/* All Day Section */}
            {events.allDayEvents.length > 0 && (
                <div className="flex flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-14 flex-shrink-0 text-xs text-gray-400 text-right pr-2 py-2 border-r border-gray-100 dark:border-gray-800">
                        all-day
                    </div>
                    <div className="flex-1 relative py-1">
                        {/* Simplified logic for all-day bars - just stacking for now */}
                        <div className="flex flex-col gap-1 px-1">
                            {events.allDayEvents.slice(0, 3).map(event => (
                                <div 
                                    key={event.id} 
                                    className="h-6 rounded px-2 flex items-center text-xs font-medium text-white truncate"
                                    style={{ backgroundColor: event.color }}
                                    onClick={() => onRequestEditTask(event.id)}
                                >
                                    {event.name}
                                </div>
                            ))}
                            {events.allDayEvents.length > 3 && <span className="text-xs text-gray-400 pl-2">+{events.allDayEvents.length - 3} more</span>}
                        </div>
                         {/* Vertical grid lines for all-day section */}
                         <div className="absolute inset-0 flex pointer-events-none">
                            {days.map((_, i) => <div key={i} className="flex-1 border-l border-gray-100 dark:border-gray-800 first:border-l-0 h-full"></div>)}
                        </div>
                    </div>
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
                <div className="flex-1 relative min-w-0">
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

                    {/* Events */}
                    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${numDays}, 1fr)` }}>
                        {events.timedEvents.map(event => (
                            <div
                                key={event.id}
                                className="relative mx-1 mt-px"
                                style={{ gridColumnStart: event.dayIndex + 1 }}
                            >
                                <div
                                    onClick={() => onRequestEditMeeting(event.id)}
                                    className="absolute inset-x-0 rounded-md p-2 text-xs shadow-sm border-l-4 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                                    style={{
                                        top: `${event.start * 3.5}rem`,
                                        height: `${Math.max((event.end - event.start) * 3.5, 1.5)}rem`,
                                        backgroundColor: `${event.color}20`, // Light background
                                        borderLeftColor: event.color,
                                        color: event.color === '#ffffff' ? '#000' : '#374151' // Fallback text color
                                    }}
                                >
                                    <div className="font-bold leading-none mb-0.5" style={{color: event.color}}>{event.title}</div>
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
    const [visibleCalendars, setVisibleCalendars] = useState({ tasks: true, meetings: true });

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

    const handleToggleCalendar = (cal: 'tasks' | 'meetings') => {
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
                    
                    <div className="w-1/3 flex justify-end">
                        {/* Placeholder for Search or other tools if needed */}
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
                            startDate={currentDate} 
                            numDays={1}
                            onRequestEditTask={props.onRequestEditTask}
                            onRequestEditMeeting={props.onRequestEditMeeting}
                            visibleCalendars={visibleCalendars}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
