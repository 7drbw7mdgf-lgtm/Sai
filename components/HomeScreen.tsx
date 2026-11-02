import React, { useState, useRef, useMemo, useEffect } from 'react';
import LabtrailLogo from './LabtrailLogo';
import { ProjectData, WidgetLayout, WidgetType, View, Priority, Task } from '../types';
import WidgetContainer from './WidgetContainer';
import AddWidgetModal from './AddWidgetModal';
import MyTasksWidget from './widgets/MyTasksWidget';
import UpcomingMeetingsWidget from './widgets/UpcomingMeetingsWidget';
import ClockWeatherWidget from './widgets/ClockWeatherWidget';
import ProjectHealthWidget from './widgets/ProjectHealthWidget';
import WelcomeWidget from './widgets/WelcomeWidget';
import NotesOverviewWidget from './widgets/NotesOverviewWidget';
import TeamWidget from './widgets/TeamWidget';
import TimelineWidget from './widgets/TimelineWidget';
import QuickLinksWidget from './widgets/QuickLinksWidget';
import PriorityBreakdownWidget from './widgets/PriorityBreakdownWidget';
import WorkloadWidget from './widgets/WorkloadWidget';
import RecentActivityWidget from './widgets/RecentActivityWidget';
import TodayScheduleWidget from './widgets/TodayScheduleWidget';
import Tooltip from './Tooltip';

import { PlusIcon } from './icons/PlusIcon';
import { AdjustmentsHorizontalIcon } from './icons/AdjustmentsHorizontalIcon';
import { PeopleManagementIcon } from './icons/PeopleManagementIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { TasksIcon } from './icons/TasksIcon';
import { TaskPlusIcon } from './icons/TaskPlusIcon';
import { CalendarPlusIcon } from './icons/CalendarPlusIcon';
import { LightningIcon } from './icons/LightningIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { FlagIcon } from './icons/FlagIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { GanttChartIcon } from './icons/GanttChartIcon';
import { TimelineIcon } from './icons/TimelineIcon';
import { UsersIcon } from './icons/UsersIcon';

const GRID_COLS = 12;
const ROW_HEIGHT = 40;

const WIDGET_DEFAULT_SIZE: Partial<Record<WidgetType, { w: number; h: number }>> = {
    [WidgetType.Welcome]: { w: 6, h: 4 },
    [WidgetType.MyTasks]: { w: 4, h: 8 },
    [WidgetType.UpcomingMeetings]: { w: 4, h: 5 },
    [WidgetType.ProjectTimeline]: { w: 5, h: 4 },
    [WidgetType.Team]: { w: 4, h: 4 },
    [WidgetType.NotesOverview]: { w: 4, h: 5 },
    [WidgetType.ProjectHealth]: { w: 4, h: 5 },
    [WidgetType.ClockWeather]: { w: 3, h: 5 },
    [WidgetType.QuickLinks]: { w: 3, h: 4 },
    [WidgetType.PeopleHub]: { w: 4, h: 6 },
    [WidgetType.PriorityBreakdown]: { w: 4, h: 5 },
    [WidgetType.Workload]: { w: 4, h: 6 },
    [WidgetType.RecentActivity]: { w: 4, h: 6 },
    [WidgetType.TodaySchedule]: { w: 4, h: 6 },
};

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export type AsanaStatus = 'on_track' | 'at_risk' | 'off_track' | 'on_hold';

interface HomeScreenProps {
    projectData: ProjectData;
    onRequestEditTask: (taskId: string) => void;
    onRequestEditMeeting: (meetingId: string) => void;
    layout: WidgetLayout[];
    onLayoutChange: (layout: WidgetLayout[]) => void;
    onTogglePeopleHub?: () => void;
    onRequestAddTask: () => void;
    onRequestAddMeeting: () => void;
    onViewChange?: (view: View) => void;
    onSetProjectData?: React.Dispatch<React.SetStateAction<ProjectData | null>>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
    projectData,
    onRequestEditTask,
    onRequestEditMeeting,
    layout,
    onLayoutChange,
    onTogglePeopleHub,
    onRequestAddTask,
    onRequestAddMeeting,
    onViewChange,
    onSetProjectData
}) => {
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);
    const [currentLayout, setCurrentLayout] = useState(layout);
    const [taskFilter, setTaskFilter] = useState<'incomplete' | 'overdue' | 'completed' | 'all'>('incomplete');
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    
    // Asana Project Status State (Persisted in localStorage)
    const [projectStatus, setProjectStatus] = useState<AsanaStatus>(() => {
        try {
            return (localStorage.getItem('sai-asana-status') as AsanaStatus) || 'on_track';
        } catch {
            return 'on_track';
        }
    });

    const [statusNote, setStatusNote] = useState<string>(() => {
        try {
            return localStorage.getItem('sai-asana-status-note') || 'Sprint 4 on schedule. Key deliverables and design milestones proceeding smoothly.';
        } catch {
            return 'Sprint 4 on schedule. Key deliverables and design milestones proceeding smoothly.';
        }
    });

    const [statusAuthor] = useState('Alice Chen');
    const [statusUpdateTime] = useState('Today, 10:30 AM');

    const handleSaveStatus = (newStatus: AsanaStatus, newNote: string) => {
        setProjectStatus(newStatus);
        setStatusNote(newNote);
        try {
            localStorage.setItem('sai-asana-status', newStatus);
            localStorage.setItem('sai-asana-status-note', newNote);
        } catch (e) {
            console.error(e);
        }
        setIsStatusModalOpen(false);
    };

    // Task completion toggle (Asana style circular checkbox)
    const handleToggleTaskCompletion = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onSetProjectData) return;
        onSetProjectData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                tasks: prev.tasks.map(t => {
                    if (t.id === taskId) {
                        const newCompletion = t.completion === 100 ? 0 : 100;
                        return { ...t, completion: newCompletion };
                    }
                    return t;
                })
            };
        });
    };

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
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const totalTasks = projectData.tasks.length;
        const completedTasks = projectData.tasks.filter(t => t.completion === 100).length;
        const incompleteTasks = totalTasks - completedTasks;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const overdueTasks = projectData.tasks.filter(t => {
            if (t.completion === 100) return false;
            return new Date(t.endDate) < todayStart;
        }).length;

        const dueToday = projectData.tasks.filter(t => {
            if (t.completion === 100) return false;
            return new Date(t.endDate).toDateString() === today.toDateString();
        }).length;

        // Milestones (tasks marked as milestones or urgent/high with completion >= 100)
        const milestoneTasks = projectData.tasks.filter(t => t.priority === Priority.Urgent || (Array.isArray(t.tags) && t.tags.includes('Milestone')));
        const milestonesDone = milestoneTasks.filter(t => t.completion === 100).length;
        const milestonesTotal = milestoneTasks.length > 0 ? milestoneTasks.length : 4;

        // Meetings
        const meetingsToday = projectData.meetings.filter(m => new Date(m.date).toDateString() === today.toDateString()).length;
        const nextMeeting = projectData.meetings
            .filter(m => new Date(m.date) >= todayStart)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

        return {
            totalTasks,
            completedTasks,
            incompleteTasks,
            completionRate,
            overdueTasks,
            dueToday,
            milestonesDone,
            milestonesTotal,
            meetingsToday,
            nextMeeting,
            activeMembers: projectData.people.length
        };
    }, [projectData]);

    // Tasks filtered for Asana Task Table
    const filteredTasks = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        return projectData.tasks.filter(t => {
            if (taskFilter === 'incomplete') return t.completion < 100;
            if (taskFilter === 'completed') return t.completion === 100;
            if (taskFilter === 'overdue') return t.completion < 100 && new Date(t.endDate) < todayStart;
            return true;
        });
    }, [projectData.tasks, taskFilter]);

    // Group filtered tasks by Section (Asana Groups)
    const tasksBySection = useMemo(() => {
        const sections: { group: { id: string; name: string; color: string }; tasks: Task[] }[] = [];
        
        // Map groups
        projectData.groups.forEach(g => {
            const groupTasks = filteredTasks.filter(t => t.groupId === g.id);
            if (groupTasks.length > 0 || taskFilter === 'all') {
                sections.push({ group: g, tasks: groupTasks });
            }
        });

        // Ungrouped tasks
        const ungroupedTasks = filteredTasks.filter(t => !t.groupId || !projectData.groups.some(g => g.id === t.groupId));
        if (ungroupedTasks.length > 0) {
            sections.push({
                group: { id: 'ungrouped', name: 'Backlog & General', color: '#6B7280' },
                tasks: ungroupedTasks
            });
        }

        return sections;
    }, [filteredTasks, projectData.groups, taskFilter]);

    const handleCustomizeClick = () => {
        setIsCustomizing(true);
        setCurrentLayout(layout);
    };

    const handleSave = () => {
        onLayoutChange(currentLayout);
        setIsCustomizing(false);
    };

    const handleCancel = () => {
        setIsCustomizing(false);
        setCurrentLayout(layout);
    };

    const handleAddWidget = (type: WidgetType) => {
        const newId = `${type}-${Date.now()}`;
        const size = WIDGET_DEFAULT_SIZE[type] || { w: 4, h: 4 };
        const newWidget: WidgetLayout = {
            i: newId, type,
            x: 0, y: Math.max(0, ...currentLayout.map(w => w.y + w.h)),
            w: size.w, h: size.h,
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
                    } else {
                        if (type.includes('e')) {
                            const proposedW = initialW + deltaX;
                            if (proposedW >= 1 && initialGridX + proposedW <= GRID_COLS) newW = proposedW;
                        }
                        if (type.includes('w')) {
                            const proposedX = initialGridX + deltaX;
                            const proposedW = initialW - deltaX;
                            if (proposedW >= 1 && proposedX >= 0) {
                                newX = proposedX;
                                newW = proposedW;
                            }
                        }
                        if (type.includes('s')) {
                            const proposedH = initialH + deltaY;
                            if (proposedH >= 1) newH = proposedH;
                        }
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

    const maxRows = useMemo(() => Math.max(...currentLayout.map(l => l.y + l.h), 8), [currentLayout]);

    // Format Asana Date display helper
    const formatAsanaDate = (date: Date) => {
        const d = new Date(date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const target = new Date(d);
        target.setHours(0, 0, 0, 0);

        const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return { label: 'Today', isOverdue: false, isToday: true };
        if (diffDays === 1) return { label: 'Tomorrow', isOverdue: false, isToday: false };
        if (diffDays === -1) return { label: 'Yesterday', isOverdue: true, isToday: false };
        if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isToday: false };
        return { 
            label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
            isOverdue: false, 
            isToday: false 
        };
    };

    // Get Person helper
    const getPerson = (id: string) => projectData.people.find(p => p.id === id);

    // Asana Status styling helper
    const getStatusBadge = (status: AsanaStatus) => {
        switch (status) {
            case 'on_track':
                return {
                    label: 'On track',
                    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
                    dotClass: 'bg-emerald-500'
                };
            case 'at_risk':
                return {
                    label: 'At risk',
                    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
                    dotClass: 'bg-amber-500'
                };
            case 'off_track':
                return {
                    label: 'Off track',
                    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
                    dotClass: 'bg-rose-500'
                };
            case 'on_hold':
                return {
                    label: 'On hold',
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                    dotClass: 'bg-slate-500'
                };
        }
    };

    const statusStyle = getStatusBadge(projectStatus);

    return (
        <div 
            className="h-full overflow-y-auto spark-canvas-grid text-[#292c31] dark:text-gray-100 font-sans"
            onMouseMove={isCustomizing ? handleMouseMove : undefined}
            onMouseUp={isCustomizing ? handleMouseUp : undefined}
            onMouseLeave={isCustomizing ? handleMouseUp : undefined}
        >
            {/* Sparkboard Top Project Header */}
            <div className="border-b border-[#e6e6e2] dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
                <div className="max-w-7xl mx-auto px-6 pt-5 pb-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
                        {/* Project Title & Icon */}
                        <div className="flex items-center gap-3.5">
                            <LabtrailLogo className="w-10 h-10 select-none" />
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a8472] dark:text-[#9ea996]">
                                        Personal Workspace
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#292c31] dark:text-white font-['Manrope']">
                                        Product Launch & Operations
                                    </h1>
                                    {/* Project Status Pill */}
                                    <button 
                                        onClick={() => setIsStatusModalOpen(true)}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all hover:opacity-85 ${statusStyle.badgeClass}`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${statusStyle.dotClass}`} />
                                        <span>{statusStyle.label}</span>
                                        <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1.5">
                                        <img 
                                            src={projectData.people[0]?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"} 
                                            alt="Owner" 
                                            className="w-4 h-4 rounded-full"
                                        />
                                        <span>Owner: <strong>{statusAuthor}</strong></span>
                                    </span>
                                    <span className="hidden sm:inline-block">•</span>
                                    <span className="hidden sm:inline-flex items-center gap-1">
                                        <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-400" />
                                        <span>
                                            {new Date(projectData.projectStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(projectData.projectEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </span>
                                    <span className="hidden sm:inline-block">•</span>
                                    <span className="hidden sm:inline-flex items-center gap-1 text-[#626e56] dark:text-[#a3b397]">
                                        <span>👥 Shared with Team</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Top Action Buttons (Sparkboard Style) */}
                        <div className="flex items-center gap-2">
                            {isCustomizing ? (
                                <>
                                    <button 
                                        onClick={() => setIsAddWidgetModalOpen(true)} 
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-soft text-accent hover:bg-[#fce5dc] transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4"/> Add Widget
                                    </button>
                                    <button 
                                        onClick={handleCancel} 
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#e6e6e2] bg-white text-[#292c31] hover:bg-[#f0efeb] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSave} 
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-accent text-white hover:bg-accent-hover shadow-xs transition-colors"
                                    >
                                        Save Layout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsStatusModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[#e6e6e2] dark:border-gray-700 hover:bg-[#f0efeb] dark:hover:bg-gray-800 text-[#292c31] dark:text-gray-300 transition-all shadow-2xs"
                                    >
                                        <SparklesIcon className="w-3.5 h-3.5 text-accent" />
                                        <span>Set status update</span>
                                    </button>
                                    <button
                                        onClick={onRequestAddTask}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-accent hover:bg-accent-hover text-white transition-all shadow-xs active:scale-98"
                                    >
                                        <PlusIcon className="w-3.5 h-3.5" />
                                        <span>Add task</span>
                                    </button>
                                    <Tooltip text="Customize Overview Panels">
                                        <button
                                            onClick={handleCustomizeClick}
                                            className="p-1.5 rounded-lg border border-[#e6e6e2] dark:border-gray-700 hover:bg-[#f0efeb] dark:hover:bg-gray-800 text-gray-500 transition-all"
                                        >
                                            <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                        </button>
                                    </Tooltip>
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Asana Dashboard Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                
                {/* Sparkboard KPI Metrics Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Tasks */}
                    <div className="bg-white dark:bg-[#252628] rounded-2xl border border-[#e6e6e2] dark:border-gray-800 border-l-4 border-l-[#f8df87] p-4 shadow-2xs hover:shadow-xs transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7a8472] dark:text-gray-400">Total Tasks</span>
                            <div className="w-7 h-7 rounded-lg bg-[#fef9e7] dark:bg-yellow-950/40 text-[#846b0a] dark:text-[#f8df87] flex items-center justify-center font-bold">
                                📋
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-[#292c31] dark:text-white font-['Manrope']">{stats.totalTasks}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">in project</span>
                        </div>
                    </div>

                    {/* Completed Tasks */}
                    <div className="bg-white dark:bg-[#252628] rounded-2xl border border-[#e6e6e2] dark:border-gray-800 border-l-4 border-l-[#10b981] p-4 shadow-2xs hover:shadow-xs transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7a8472] dark:text-gray-400">Completed</span>
                            <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] dark:bg-emerald-950/40 text-[#047857] dark:text-[#6ee7b7] flex items-center justify-center">
                                <CheckCircleIcon className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-[#10b981] font-['Manrope']">{stats.completedTasks}</span>
                            <span className="text-xs font-bold text-[#047857] dark:text-[#6ee7b7] bg-[#ecfdf5] dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                                {stats.completionRate}%
                            </span>
                        </div>
                    </div>

                    {/* Overdue */}
                    <div className="bg-white dark:bg-[#252628] rounded-2xl border border-[#e6e6e2] dark:border-gray-800 border-l-4 border-l-accent p-4 shadow-2xs hover:shadow-xs transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7a8472] dark:text-gray-400">Overdue</span>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stats.overdueTasks > 0 ? 'bg-accent-soft text-accent dark:bg-orange-950/40' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                                <LightningIcon className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className={`text-2xl font-black font-['Manrope'] ${stats.overdueTasks > 0 ? 'text-accent' : 'text-[#292c31] dark:text-white'}`}>
                                {stats.overdueTasks}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {stats.overdueTasks > 0 ? 'needs attention' : 'on schedule'}
                            </span>
                        </div>
                    </div>

                    {/* Milestones */}
                    <div className="bg-white dark:bg-[#252628] rounded-2xl border border-[#e6e6e2] dark:border-gray-800 border-l-4 border-l-[#cde4e7] p-4 shadow-2xs hover:shadow-xs transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7a8472] dark:text-gray-400">Milestones</span>
                            <div className="w-7 h-7 rounded-lg bg-[#f0f9ff] dark:bg-sky-950/40 text-[#0369a1] dark:text-[#7dd3fc] flex items-center justify-center">
                                <FlagIcon className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-[#292c31] dark:text-white font-['Manrope']">
                                {stats.milestonesDone} / {stats.milestonesTotal}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">reached</span>
                        </div>
                    </div>
                </div>

                {/* Sparkboard Status Banner Hero */}
                <div className="bg-white dark:bg-[#252628] rounded-2xl border border-[#e6e6e2] dark:border-gray-800 p-6 shadow-2xs">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <img 
                                    src={projectData.people[0]?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"} 
                                    alt="Author" 
                                    className="w-5 h-5 rounded-full"
                                />
                                <span><strong>{statusAuthor}</strong> updated the status to</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.badgeClass}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotClass}`} />
                                    <span>{statusStyle.label}</span>
                                </span>
                                <span>• {statusUpdateTime}</span>
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-snug">
                                {statusNote}
                            </h2>

                            {/* Progress bar */}
                            <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    <span>Progress: {stats.completedTasks} of {stats.totalTasks} tasks complete</span>
                                    <span>{stats.completionRate}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                                        style={{ width: `${stats.completionRate}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex sm:flex-col gap-2 shrink-0">
                            <button
                                onClick={() => setIsStatusModalOpen(true)}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-2xs"
                            >
                                Edit status
                            </button>
                            <button
                                onClick={onRequestAddTask}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                            >
                                + Add Task
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Asana Two-Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column (7 cols): Tasks by Section & Milestones */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Tasks by Section (Asana List) */}
                        <div className="bg-white dark:bg-[#252628] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <TasksIcon className="w-4 h-4 text-gray-500" />
                                        <span>Tasks by Section</span>
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Click checkboxes to complete tasks or click rows to open details.
                                    </p>
                                </div>

                                {/* Asana Filter Tabs */}
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-lg text-xs font-semibold">
                                    <button
                                        onClick={() => setTaskFilter('incomplete')}
                                        className={`px-2.5 py-1 rounded-md transition-all ${taskFilter === 'incomplete' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                    >
                                        Incomplete
                                    </button>
                                    <button
                                        onClick={() => setTaskFilter('overdue')}
                                        className={`px-2.5 py-1 rounded-md transition-all ${taskFilter === 'overdue' ? 'bg-white dark:bg-gray-700 text-rose-600 shadow-2xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                    >
                                        Overdue ({stats.overdueTasks})
                                    </button>
                                    <button
                                        onClick={() => setTaskFilter('completed')}
                                        className={`px-2.5 py-1 rounded-md transition-all ${taskFilter === 'completed' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                    >
                                        Completed
                                    </button>
                                    <button
                                        onClick={() => setTaskFilter('all')}
                                        className={`px-2.5 py-1 rounded-md transition-all ${taskFilter === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                    >
                                        All ({stats.totalTasks})
                                    </button>
                                </div>
                            </div>

                            {/* Section Task Groups */}
                            <div className="space-y-6">
                                {tasksBySection.map(({ group, tasks }) => (
                                    <div key={group.id} className="space-y-2">
                                        {/* Section Header */}
                                        <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 px-1 py-1">
                                            <div className="flex items-center gap-2">
                                                <span 
                                                    className="w-2.5 h-2.5 rounded-sm"
                                                    style={{ backgroundColor: group.color || '#3B82F6' }}
                                                />
                                                <span className="uppercase tracking-wider text-[11px]">{group.name}</span>
                                                <span className="text-gray-400 font-normal">({tasks.length})</span>
                                            </div>
                                            <button 
                                                onClick={onRequestAddTask}
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-normal"
                                            >
                                                + Add task
                                            </button>
                                        </div>

                                        {/* Tasks List */}
                                        <div className="divide-y divide-gray-100 dark:divide-gray-800/60 rounded-xl border border-gray-150 dark:border-gray-800 overflow-hidden bg-white dark:bg-[#2A2B2D]">
                                            {tasks.length === 0 ? (
                                                <div className="p-4 text-center text-xs text-gray-400">
                                                    No {taskFilter} tasks in this section.
                                                </div>
                                            ) : (
                                                tasks.map(task => {
                                                    const dateInfo = formatAsanaDate(task.endDate);
                                                    const isDone = task.completion === 100;
                                                    const assignee = (task.assignedTo && task.assignedTo.length > 0) ? getPerson(task.assignedTo[0]) : null;

                                                    return (
                                                        <div 
                                                            key={task.id}
                                                            onClick={() => onRequestEditTask(task.id)}
                                                            className={`group flex items-center justify-between px-3.5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${isDone ? 'opacity-65' : ''}`}
                                                        >
                                                            {/* Checkbox & Task Name */}
                                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                <button
                                                                    onClick={(e) => handleToggleTaskCompletion(task.id, e)}
                                                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                                                        isDone 
                                                                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                                        : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500'
                                                                    }`}
                                                                >
                                                                    {isDone && (
                                                                        <svg className="w-2.5 h-2.5 stroke-current stroke-3" fill="none" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                                <span className={`text-sm font-medium truncate ${isDone ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                                                    {task.name}
                                                                </span>
                                                            </div>

                                                            {/* Meta: Due Date, Priority, Assignee */}
                                                            <div className="flex items-center gap-3 shrink-0 ml-3">
                                                                {/* Priority Pill */}
                                                                {task.priority && (
                                                                    <span className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                        task.priority === Priority.Urgent ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' :
                                                                        task.priority === Priority.High ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' :
                                                                        task.priority === Priority.Medium ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                                                                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                                    }`}>
                                                                        {task.priority}
                                                                    </span>
                                                                )}

                                                                {/* Due Date Badge */}
                                                                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                                                                    dateInfo.isOverdue ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' :
                                                                    dateInfo.isToday ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 font-semibold' :
                                                                    'text-gray-500 dark:text-gray-400'
                                                                }`}>
                                                                    {dateInfo.label}
                                                                </span>

                                                                {/* Assignee Avatar */}
                                                                {assignee ? (
                                                                    <Tooltip text={assignee.name}>
                                                                        <img 
                                                                            src={assignee.avatarUrl} 
                                                                            alt={assignee.name} 
                                                                            className="w-5 h-5 rounded-full ring-1 ring-white dark:ring-gray-800"
                                                                        />
                                                                    </Tooltip>
                                                                ) : (
                                                                    <div className="w-5 h-5 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-[10px] text-gray-400">
                                                                        +
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Asana Milestones & Key Goals */}
                        <div className="bg-white dark:bg-[#252628] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-2xs">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                                        <FlagIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Project Milestones</h3>
                                </div>
                                <span className="text-xs text-gray-500 font-medium">
                                    {stats.milestonesDone} of {stats.milestonesTotal} completed
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { title: "Architecture & Design Spec", date: "Jul 10", done: true, owner: "Alice Chen" },
                                    { title: "Beta API & Core Engine", date: "Jul 28", done: true, owner: "Bob Smith" },
                                    { title: "Staging Deployment & QA", date: "Aug 15", done: stats.completionRate > 60, owner: "Carol White" },
                                    { title: "Public Launch v1.0", date: "Aug 30", done: stats.completionRate === 100, owner: "Alice Chen" },
                                ].map((m, idx) => (
                                    <div 
                                        key={idx}
                                        className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                                            m.done 
                                            ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' 
                                            : 'bg-gray-50/50 border-gray-200 dark:bg-gray-800/40 dark:border-gray-700'
                                        }`}
                                    >
                                        {/* Asana Diamond Milestone Icon */}
                                        <div className={`w-5 h-5 rotate-45 rounded-xs mt-0.5 flex items-center justify-center shrink-0 ${
                                            m.done ? 'bg-emerald-500 text-white shadow-xs' : 'border-2 border-gray-400 dark:border-gray-500'
                                        }`}>
                                            {m.done && (
                                                <svg className="w-3 h-3 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-xs font-bold leading-tight ${m.done ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {m.title}
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                                Target: {m.date} • {m.owner}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right Column (4 cols): Roles, Schedule, Priority & Team */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Project Roles & Members */}
                        <div className="bg-white dark:bg-[#252628] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-2xs">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <UsersIcon className="w-4 h-4 text-gray-500" />
                                    <span>Project Roles</span>
                                </h3>
                            </div>

                            {/* Project Lead */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 mb-3">
                                <img 
                                    src={projectData.people[0]?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"} 
                                    alt="Lead" 
                                    className="w-10 h-10 rounded-full"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                            {projectData.people[0]?.name || "Alice Chen"}
                                        </span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 rounded">
                                            Owner
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Lead Product Architect</p>
                                </div>
                            </div>

                            {/* Collaborators list */}
                            <div className="space-y-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Team Collaborators</span>
                                {projectData.people.slice(1).map(person => {
                                    const taskCount = projectData.tasks.filter(t => Array.isArray(t.assignedTo) && t.assignedTo.includes(person.id)).length;
                                    return (
                                        <div key={person.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                            <div className="flex items-center gap-2.5">
                                                <img src={person.avatarUrl} alt={person.name} className="w-7 h-7 rounded-full" />
                                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{person.name}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">{taskCount} tasks</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Upcoming Schedule / Meetings */}
                        <div className="bg-white dark:bg-[#252628] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-2xs">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                                    <span>Upcoming Schedule</span>
                                </h3>
                                <button
                                    onClick={onRequestAddMeeting}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                >
                                    + Add
                                </button>
                            </div>

                            <div className="space-y-2.5">
                                {projectData.meetings.slice(0, 3).map(meeting => (
                                    <div 
                                        key={meeting.id}
                                        onClick={() => onRequestEditMeeting(meeting.id)}
                                        className="p-3 rounded-xl border border-gray-150 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-all bg-gray-50/50 dark:bg-gray-800/30"
                                    >
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-gray-900 dark:text-white truncate flex-1">
                                                {meeting.title}
                                            </span>
                                            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md ml-2 shrink-0">
                                                {meeting.startTime}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                            {new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {meeting.attendees.length} attendees
                                        </p>
                                    </div>
                                ))}

                                {projectData.meetings.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-4">No scheduled meetings.</p>
                                )}
                            </div>
                        </div>

                        {/* Priority Breakdown (Asana Chart) */}
                        <div className="bg-white dark:bg-[#252628] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-2xs">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Tasks by Priority</h3>
                            <div className="space-y-2">
                                {[
                                    { label: 'Urgent', count: projectData.tasks.filter(t => t.priority === Priority.Urgent).length, color: 'bg-rose-500' },
                                    { label: 'High', count: projectData.tasks.filter(t => t.priority === Priority.High).length, color: 'bg-orange-500' },
                                    { label: 'Medium', count: projectData.tasks.filter(t => t.priority === Priority.Medium).length, color: 'bg-blue-500' },
                                    { label: 'Low', count: projectData.tasks.filter(t => t.priority === Priority.Low || !t.priority).length, color: 'bg-gray-400' },
                                ].map((p, idx) => {
                                    const pct = stats.totalTasks > 0 ? Math.round((p.count / stats.totalTasks) * 100) : 0;
                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span className="text-gray-700 dark:text-gray-300">{p.label}</span>
                                                <span className="text-gray-500">{p.count} tasks ({pct}%)</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div className={`h-full ${p.color} rounded-full`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Resources / Links */}
                        <div className="bg-white dark:bg-[#252628] rounded-2xl border border-[#e6e6e2] dark:border-gray-800 p-5 shadow-2xs">
                            <h3 className="text-sm font-bold text-[#292c31] dark:text-white mb-3">Key Project Views</h3>
                            <div className="space-y-1.5 text-xs">
                                <a 
                                    href="#kanban" 
                                    onClick={e => { e.preventDefault(); if (onViewChange) onViewChange(View.KANBAN); }}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent-soft dark:hover:bg-gray-800 text-[#292c31] dark:text-gray-300 transition-colors font-medium"
                                >
                                    <span className="flex items-center gap-2">
                                        <LabtrailLogo className="w-4 h-4" />
                                        <span>Kanban Sprint Board</span>
                                    </span>
                                    <span className="text-accent font-bold">→</span>
                                </a>
                                <a 
                                    href="#tasks" 
                                    onClick={e => { e.preventDefault(); if (onViewChange) onViewChange(View.TASKS); }}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#f0efeb] dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <span>📋</span> Tasks & Deliverables List
                                    </span>
                                    <span className="text-gray-400">→</span>
                                </a>
                                <a 
                                    href="#timeline" 
                                    onClick={e => { e.preventDefault(); if (onViewChange) onViewChange(View.GANTT); }}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#f0efeb] dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <span>📊</span> Gantt Roadmap & Milestones
                                    </span>
                                    <span className="text-gray-400">→</span>
                                </a>
                                <a 
                                    href="#calendar" 
                                    onClick={e => { e.preventDefault(); if (onViewChange) onViewChange(View.CALENDAR); }}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#f0efeb] dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <span>🗓️</span> Project Calendar & Deadlines
                                    </span>
                                    <span className="text-gray-400">→</span>
                                </a>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Customizable Workspace Grid (When Customizing or Expanded) */}
                {isCustomizing && (
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">Workspace Widget Panels</h3>
                                <p className="text-xs text-gray-500">Drag, resize, or add custom panels to personalize your Asana overview.</p>
                            </div>
                            <button
                                onClick={() => setIsAddWidgetModalOpen(true)}
                                className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                            >
                                <PlusIcon className="w-3.5 h-3.5" />
                                Add Widget
                            </button>
                        </div>

                        <div
                            ref={gridRef}
                            className="relative grid gap-4"
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
                                            case WidgetType.ProjectTimeline: return <TimelineWidget {...widgetProps} />;
                                            case WidgetType.QuickLinks: return <QuickLinksWidget />;
                                            case WidgetType.PriorityBreakdown: return <PriorityBreakdownWidget {...widgetProps} />;
                                            case WidgetType.Workload: return <WorkloadWidget {...widgetProps} />;
                                            case WidgetType.RecentActivity: return <RecentActivityWidget {...widgetProps} />;
                                            case WidgetType.TodaySchedule: return <TodayScheduleWidget {...widgetProps} />;
                                            default: return null;
                                        }
                                    })()}
                                </WidgetContainer>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Asana Status Update Modal */}
            {isStatusModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#252628] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Set Project Status</h3>
                            <button 
                                onClick={() => setIsStatusModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="py-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Status</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['on_track', 'at_risk', 'off_track', 'on_hold'] as AsanaStatus[]).map(s => {
                                        const b = getStatusBadge(s);
                                        const isSelected = projectStatus === s;
                                        return (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setProjectStatus(s)}
                                                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                                    isSelected 
                                                    ? `${b.badgeClass} ring-2 ring-blue-500` 
                                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                <span className={`w-2.5 h-2.5 rounded-full ${b.dotClass}`} />
                                                <span>{b.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Status Summary & Key Accomplishments
                                </label>
                                <textarea
                                    value={statusNote}
                                    onChange={(e) => setStatusNote(e.target.value)}
                                    rows={4}
                                    placeholder="Summarize project progress, key milestones reached, or any blockers..."
                                    className="w-full p-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={() => setIsStatusModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSaveStatus(projectStatus, statusNote)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F06A6A] hover:bg-[#E05959] text-white shadow-sm"
                            >
                                Post Status Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Widget Modal */}
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
