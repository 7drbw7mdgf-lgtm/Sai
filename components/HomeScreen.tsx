
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ProjectData, WidgetLayout, WidgetType } from '../types';
import WidgetContainer from './WidgetContainer';
import AddWidgetModal from './AddWidgetModal';
import MyTasksWidget from './widgets/MyTasksWidget';
import UpcomingMeetingsWidget from './widgets/UpcomingMeetingsWidget';
import ClockWeatherWidget from './widgets/ClockWeatherWidget';
import ProjectHealthWidget from './widgets/ProjectHealthWidget';
import WelcomeWidget from './widgets/WelcomeWidget';
import { PlusIcon } from './icons/PlusIcon';
import { AdjustmentsHorizontalIcon } from './icons/AdjustmentsHorizontalIcon';
import NotesOverviewWidget from './widgets/NotesOverviewWidget';
import TeamWidget from './widgets/TeamWidget';
import TimelineWidget from './widgets/TimelineWidget';
import QuickLinksWidget from './widgets/QuickLinksWidget';
import Tooltip from './Tooltip';
import { PeopleManagementIcon } from './icons/PeopleManagementIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { TasksIcon } from './icons/TasksIcon';
import { TaskPlusIcon } from './icons/TaskPlusIcon';
import { CalendarPlusIcon } from './icons/CalendarPlusIcon';
import { LightningIcon } from './icons/LightningIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

const GRID_COLS = 12;
const ROW_HEIGHT = 40; // in pixels

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface HomeScreenProps {
    projectData: ProjectData;
    onRequestEditTask: (taskId: string) => void;
    onRequestEditMeeting: (meetingId: string) => void;
    layout: WidgetLayout[];
    onLayoutChange: (layout: WidgetLayout[]) => void;
    onTogglePeopleHub: () => void;
    onRequestAddTask: () => void;
    onRequestAddMeeting: () => void;
}

const FocusCard: React.FC<{ projectData: ProjectData, onRequestEditTask: (id: string) => void, onRequestEditMeeting: (id: string) => void }> = ({ projectData, onRequestEditTask, onRequestEditMeeting }) => {
    const { tasks, meetings } = projectData;
    
    const focusItem = useMemo(() => {
        const now = new Date();
        
        // 1. Upcoming meeting within 2 hours
        const nextMeeting = meetings
            .filter(m => {
                const mDate = new Date(m.date);
                const [h, min] = m.startTime.split(':').map(Number);
                mDate.setHours(h, min, 0);
                return mDate > now && mDate.getTime() - now.getTime() < 2 * 60 * 60 * 1000;
            })
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

        if (nextMeeting) {
            return { type: 'meeting', data: nextMeeting, title: 'Meeting Coming Up', message: `Prepare for "${nextMeeting.title}"` };
        }

        // 2. Overdue or Due Today High Priority Task
        const urgentTask = tasks
            .filter(t => t.completion < 100 && (new Date(t.endDate) <= now || t.priority === 'Urgent'))
            .sort((a,b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0];

        if (urgentTask) {
            const isOverdue = new Date(urgentTask.endDate) < new Date(now.setHours(0,0,0,0));
            return { 
                type: 'task', 
                data: urgentTask, 
                title: isOverdue ? 'Overdue Task' : 'Top Priority', 
                message: urgentTask.name 
            };
        }

        return { type: 'clear', title: 'All Clear', message: 'Check your backlog or take a break!' };
    }, [tasks, meetings]);

    if (focusItem.type === 'clear') {
        return (
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/50 dark:border-gray-700/50 p-4 rounded-2xl flex items-center gap-4 shadow-sm w-72">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase text-green-700 dark:text-green-400 tracking-wider">{focusItem.title}</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{focusItem.message}</p>
                </div>
            </div>
        )
    }

    return (
        <div 
            onClick={() => focusItem.type === 'task' ? onRequestEditTask((focusItem.data as any).id) : onRequestEditMeeting((focusItem.data as any).id)}
            className="bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-800/80 dark:to-gray-800/40 backdrop-blur-lg border border-white/60 dark:border-gray-600 p-1 rounded-2xl shadow-lg w-80 cursor-pointer hover:scale-105 transition-transform duration-300 group"
        >
            <div className="bg-white/50 dark:bg-gray-900/50 rounded-xl p-4 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <LightningIcon className="w-16 h-16 text-yellow-500" />
                </div>
                <div className="flex items-start gap-3 relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${focusItem.type === 'meeting' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                        {focusItem.type === 'meeting' ? <CalendarDaysIcon className="w-5 h-5"/> : <LightningIcon className="w-5 h-5"/>}
                    </div>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${focusItem.type === 'meeting' ? 'text-indigo-600' : 'text-orange-600'}`}>
                            {focusItem.title}
                        </p>
                        <p className="font-bold text-gray-800 dark:text-gray-100 leading-tight line-clamp-2">{focusItem.message}</p>
                        {focusItem.type === 'meeting' && (
                            <p className="text-xs text-gray-500 mt-1">Starts at {(focusItem.data as any).startTime}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const InsightPill: React.FC<{ icon: React.ReactNode, text: string, color: string }> = ({ icon, text, color }) => (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-100 dark:border-gray-700 shadow-sm text-sm font-medium whitespace-nowrap ${color}`}>
        {icon}
        {text}
    </div>
);

const PeopleHubWidget: React.FC<{ projectData: ProjectData, onTogglePeopleHub: () => void }> = ({ projectData, onTogglePeopleHub }) => {
    const { people, tasks } = projectData;

    return (
        <div className="h-full flex flex-col p-4">
            <h2 className="text-lg font-semibold mb-3 flex-shrink-0 px-2 flex items-center gap-2">
                <PeopleManagementIcon className="w-5 h-5 text-gray-400" />
                Team Hub
            </h2>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                {people.map(person => {
                    const taskCount = tasks.filter(t => t.assignedTo.includes(person.id)).length;
                    return (
                        <div key={person.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <div className="flex items-center gap-3">
                                <img src={person.avatarUrl} alt={person.name} className="w-8 h-8 rounded-full" />
                                <div>
                                    <p className="font-semibold text-sm">{person.name}</p>
                                    <p className="text-xs text-gray-500">{taskCount} tasks</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {people.length === 0 && (
                     <div className="h-full flex items-center justify-center">
                        <p className="text-gray-400 text-center text-sm">No team members yet.</p>
                    </div>
                )}
            </div>
            <div className="flex-shrink-0 pt-2">
                <button
                    onClick={onTogglePeopleHub}
                    className="w-full text-center py-2 bg-blue-50 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-gray-600 text-blue-600 dark:text-blue-300 font-semibold rounded-lg text-sm transition-colors"
                >
                    Manage Team
                </button>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ 
    label: string; 
    value: number | string; 
    subtext?: string; 
    icon: React.ReactNode; 
    colorClass: string;
    onClick?: () => void;
}> = ({ label, value, subtext, icon, colorClass, onClick }) => (
    <div 
        onClick={onClick}
        className={`flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden`}
    >
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 ${colorClass}`}>
            {React.cloneElement(icon as React.ReactElement<any>, { className: "w-16 h-16" })}
        </div>
        <div className="relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${colorClass} bg-opacity-10 text-opacity-100`}>
                {icon}
            </div>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">{value}</p>
            <p className="font-medium text-gray-500 dark:text-gray-400 text-sm">{label}</p>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    </div>
);


const HomeScreen: React.FC<HomeScreenProps> = ({ projectData, onRequestEditTask, onRequestEditMeeting, layout, onLayoutChange, onTogglePeopleHub, onRequestAddTask, onRequestAddMeeting }) => {
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);
    const [currentLayout, setCurrentLayout] = useState(layout);
    
    const [dragAction, setDragAction] = useState<{
        type: 'drag' | ResizeDirection;
        id: string;
        initialX: number;
        initialY: number;
        initialLayoutItem: WidgetLayout;
    } | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    
    const today = new Date();
    
    const stats = useMemo(() => {
        const todayStr = today.toDateString();
        const dueToday = projectData.tasks.filter(t => new Date(t.endDate).toDateString() === todayStr && t.completion < 100).length;
        const meetingsToday = projectData.meetings.filter(m => new Date(m.date).toDateString() === todayStr).length;
        const activeMembers = projectData.people.length;
        
        // Find next meeting
        const now = new Date();
        const nextMeeting = projectData.meetings
            .filter(m => new Date(m.date) >= now || (new Date(m.date).toDateString() === todayStr && m.startTime > now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})))
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

        return { dueToday, meetingsToday, activeMembers, nextMeeting };
    }, [projectData, today]);
    
    const insights = useMemo(() => {
        const res = [];
        const overdue = projectData.tasks.filter(t => t.completion < 100 && new Date(t.endDate) < new Date(new Date().setHours(0,0,0,0))).length;
        if (overdue > 0) res.push({ text: `${overdue} tasks overdue`, color: 'text-red-600', icon: <LightningIcon className="w-4 h-4"/> });
        
        const completedRatio = projectData.tasks.length > 0 ? projectData.tasks.filter(t => t.completion === 100).length / projectData.tasks.length : 0;
        if (completedRatio > 0.8) res.push({ text: 'Project > 80% complete', color: 'text-green-600', icon: <SparklesIcon className="w-4 h-4"/> });
        
        if (stats.meetingsToday > 3) res.push({ text: 'Heavy meeting load today', color: 'text-indigo-600', icon: <CalendarDaysIcon className="w-4 h-4"/> });
        
        return res;
    }, [projectData, stats]);

    const getGreeting = () => {
        const hour = today.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const handleCustomizeClick = () => {
        setIsCustomizing(true);
        setCurrentLayout(layout); // Make a copy to edit
    };

    const handleSave = () => {
        onLayoutChange(currentLayout);
        setIsCustomizing(false);
    };

    const handleCancel = () => {
        setIsCustomizing(false);
        setCurrentLayout(layout); // Revert changes
    };

    const handleAddWidget = (type: WidgetType) => {
        const newId = `${type}-${Date.now()}`;
        const newWidget: WidgetLayout = {
            i: newId, type,
            x: 0, y: Math.max(0, ...currentLayout.map(w => w.y + w.h)),
            w: 4, h: 4, // Default size
        };
        setCurrentLayout(prev => [...prev, newWidget]);
        setIsAddWidgetModalOpen(false);
    };

    const handleRemoveWidget = (widgetId: string) => {
        setCurrentLayout(prev => prev.filter(w => w.i !== widgetId));
    };

    const handleUpdateWidget = (widgetId: string, updates: Partial<WidgetLayout>) => {
        setCurrentLayout(prev => prev.map(w => w.i === widgetId ? { ...w, ...updates } : w));
    };

    const handleDragStart = (e: React.MouseEvent, id: string, type: 'drag' | ResizeDirection) => {
        e.preventDefault();
        e.stopPropagation();
        const initialLayoutItem = currentLayout.find(item => item.i === id);
        if (!initialLayoutItem) return;
        setDragAction({
            type, id,
            initialX: e.clientX,
            initialY: e.clientY,
            initialLayoutItem
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragAction || !gridRef.current) return;

        const gridWidth = gridRef.current.offsetWidth;
        const colWidth = gridWidth / GRID_COLS;
        const rowHeight = ROW_HEIGHT;

        const dx = e.clientX - dragAction.initialX;
        const dy = e.clientY - dragAction.initialY;
        
        const deltaX = Math.round(dx / colWidth);
        const deltaY = Math.round(dy / rowHeight);

        setCurrentLayout(prevLayout =>
            prevLayout.map(item => {
                if (item.i === dragAction.id) {
                    const { type, initialLayoutItem } = dragAction;
                    const { x: initialGridX, y: initialGridY, w: initialW, h: initialH } = initialLayoutItem;

                    let newX = item.x, newY = item.y, newW = item.w, newH = item.h;

                    if (type === 'drag') {
                        newX = Math.max(0, Math.min(GRID_COLS - initialW, initialGridX + deltaX));
                        newY = Math.max(0, initialGridY + deltaY);
                    } else { // Resize
                        // Right edge
                        if (type.includes('e')) {
                            const proposedW = initialW + deltaX;
                            if (proposedW >= 1 && initialGridX + proposedW <= GRID_COLS) {
                                newW = proposedW;
                            }
                        }
                        // Left edge
                        if (type.includes('w')) {
                            const proposedX = initialGridX + deltaX;
                            const proposedW = initialW - deltaX;
                            if (proposedW >= 1 && proposedX >= 0) {
                                newX = proposedX;
                                newW = proposedW;
                            }
                        }
                        // Bottom edge
                        if (type.includes('s')) {
                            const proposedH = initialH + deltaY;
                            if (proposedH >= 1) {
                                newH = proposedH;
                            }
                        }
                        // Top edge
                        if (type.includes('n')) {
                            const proposedY = initialGridY + deltaY;
                            const proposedH = initialH - deltaY;
                            if (proposedH >= 1 && proposedY >= 0) {
                                newY = proposedY;
                                newH = proposedH;
                            }
                        }
                    }
                    return { ...item, x: newX, y: newY, w: newW, h: newH };
                }
                return item;
            })
        );
    };

    const handleMouseUp = () => {
        setDragAction(null);
    };

    const maxRows = useMemo(() => Math.max(...currentLayout.map(l => l.y + l.h), 10), [currentLayout]);

    return (
        <div 
            className="h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto"
            onMouseMove={isCustomizing ? handleMouseMove : undefined}
            onMouseUp={isCustomizing ? handleMouseUp : undefined}
            onMouseLeave={isCustomizing ? handleMouseUp : undefined}
        >
            {/* Hero Header with Dynamic Background */}
            <div className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-10 overflow-hidden">
                {/* Animated blobs */}
                <div className="absolute top-[-50%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-teal-400/10 to-green-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                            {getGreeting()}, Alice.
                        </h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md">
                            Here's what's happening with your projects today.
                        </p>
                        
                        <div className="flex items-center gap-3 mt-6">
                            {isCustomizing ? (
                                <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-md p-1 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                                    <button onClick={() => setIsAddWidgetModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-gray-600 hover:bg-blue-100 dark:hover:bg-gray-500 transition-colors font-semibold text-blue-600 dark:text-blue-200">
                                        <PlusIcon className="w-5 h-5"/> Add Widget
                                    </button>
                                    <button onClick={handleCancel} className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-semibold text-gray-600 dark:text-gray-300">Cancel</button>
                                    <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-semibold text-white shadow-sm">Save Layout</button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={onRequestAddTask}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl shadow-md hover:scale-105 transition-all font-semibold"
                                    >
                                        <TaskPlusIcon className="w-5 h-5" /> New Task
                                    </button>
                                    <button 
                                        onClick={onRequestAddMeeting}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                    >
                                        <CalendarPlusIcon className="w-5 h-5" /> Schedule
                                    </button>
                                    <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                                    <Tooltip text="Customize Dashboard">
                                        <button onClick={handleCustomizeClick} className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm">
                                            <AdjustmentsHorizontalIcon className="w-5 h-5" />
                                        </button>
                                    </Tooltip>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Up Next / Focus Card */}
                    <FocusCard projectData={projectData} onRequestEditTask={onRequestEditTask} onRequestEditMeeting={onRequestEditMeeting} />
                </div>
            </div>

            <div className="px-8 max-w-7xl mx-auto pb-12">
                
                {/* Smart Insights Rail */}
                <div className="flex flex-col items-start gap-3 py-6">
                    {insights.map((insight, i) => (
                        <InsightPill key={i} icon={insight.icon} text={insight.text} color={insight.color} />
                    ))}
                </div>

                {/* Quick Stats Row */}
                <div className="flex gap-6 mb-10">
                    <StatCard 
                        label="Tasks Due Today" 
                        value={stats.dueToday} 
                        icon={<TasksIcon className="w-6 h-6" />} 
                        colorClass="text-blue-600 bg-blue-600"
                    />
                    <StatCard 
                        label="Meetings Today" 
                        value={stats.meetingsToday} 
                        subtext={stats.nextMeeting ? `Next: ${stats.nextMeeting.startTime}` : 'No more meetings'}
                        icon={<CalendarDaysIcon className="w-6 h-6" />} 
                        colorClass="text-indigo-600 bg-indigo-600"
                        onClick={() => { if(stats.nextMeeting) onRequestEditMeeting(stats.nextMeeting.id) }}
                    />
                    <StatCard 
                        label="Team Members" 
                        value={stats.activeMembers} 
                        icon={<PeopleManagementIcon className="w-6 h-6" />} 
                        colorClass="text-green-600 bg-green-600"
                        onClick={onTogglePeopleHub}
                    />
                </div>

                {/* Grid Area */}
                <div
                    ref={gridRef}
                    className="relative grid gap-6"
                    style={{ 
                        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                        gridAutoRows: `${ROW_HEIGHT}px`,
                        gridTemplateRows: `repeat(${maxRows}, ${ROW_HEIGHT}px)`,
                    }}
                >
                    {currentLayout.map(widget => (
                        <WidgetContainer
                            key={widget.i}
                            layout={widget}
                            isCustomizing={isCustomizing}
                            onDragStart={(e) => handleDragStart(e, widget.i, 'drag')}
                            onResizeStart={(e, dir) => handleDragStart(e, widget.i, dir)}
                            onRemove={() => handleRemoveWidget(widget.i)}
                            onUpdateWidget={handleUpdateWidget}
                        >
                            {(() => {
                                const widgetProps = { projectData, onRequestEditTask, onRequestEditMeeting, onTogglePeopleHub };
                                switch (widget.type) {
                                    case WidgetType.MyTasks: return <MyTasksWidget {...widgetProps} />;
                                    case WidgetType.UpcomingMeetings: return <UpcomingMeetingsWidget {...widgetProps} />;
                                    case WidgetType.ClockWeather: return <ClockWeatherWidget />;
                                    case WidgetType.ProjectHealth: return <ProjectHealthWidget {...widgetProps} />;
                                    case WidgetType.Welcome: return <WelcomeWidget layout={widget} />;
                                    case WidgetType.NotesOverview: return <NotesOverviewWidget {...widgetProps} />;
                                    case WidgetType.Team: return <TeamWidget {...widgetProps} />;
                                    case WidgetType.PeopleHub: return <PeopleHubWidget {...widgetProps} />;
                                    case WidgetType.ProjectTimeline: return <TimelineWidget {...widgetProps} />;
                                    case WidgetType.QuickLinks: return <QuickLinksWidget />;
                                    default: return <div>Unknown widget type</div>;
                                }
                            })()}
                        </WidgetContainer>
                    ))}
                </div>
            </div>
            
             <AddWidgetModal
                isOpen={isAddWidgetModalOpen}
                onClose={() => setIsAddWidgetModalOpen(false)}
                onAddWidget={handleAddWidget}
                existingWidgets={currentLayout.map(w => w.type)}
            />
        </div>
    );
};

export default HomeScreen;
