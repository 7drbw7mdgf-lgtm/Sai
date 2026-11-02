
import React, { useState, useRef, useMemo, useCallback, useEffect, useLayoutEffect } from 'react';
import BenchlineLogo from './BenchlineLogo';
import { ProjectData, Task, Group, Assignment } from '../types';
import TaskSidebar from './TaskSidebar';
import Timeline from './Timeline';
import HorizontalScrollbar from './HorizontalScrollbar';
import ViewControls, { MIN_ZOOM, MAX_ZOOM } from './ViewControls';
import { diffInDays } from '../services/dateUtils';
import AddGroupModal from './AddGroupModal';
import GanttTaskDetailPanel from './GanttTaskDetailPanel';
import {
    DisplayItem, Dependency, DragPreview, GanttViewMode, GroupSpan,
    layoutRows, FOOTER_HEIGHT,
} from './ganttLayout';

interface GanttChartProps {
    projectData: ProjectData;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    zoom: number;
    ganttViewMode: GanttViewMode;
    onGanttViewModeChange: (mode: GanttViewMode) => void;
    onRequestAddTask: () => void;
    onRequestEditTask: (taskId: string) => void;
    dependencyLink: { type: 'prerequisite' | 'postrequisite', fromTaskId: string } | null;
    onStartDependencyLink: (taskId: string, type: 'prerequisite' | 'postrequisite') => void;
    onLinkTask: (toTaskId: string) => void;
    onCancelLinking: () => void;
    onRemoveDependency: (sourceId: string, targetId: string) => void;
}

const DEFAULT_SIDEBAR_WIDTH = 400;
const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 750;

const topologicalSortTasks = (tasks: Task[]): Task[] => {
    const sorted: Task[] = [];
    const inDegree: Map<string, number> = new Map();
    const adjList: Map<string, string[]> = new Map();
    const taskMap: Map<string, Task> = new Map(tasks.map(t => [t.id, t]));

    for (const task of tasks) {
        inDegree.set(task.id, 0);
        adjList.set(task.id, []);
    }

    for (const task of tasks) {
        for (const depId of task.dependencies || []) {
            if (taskMap.has(depId)) {
                adjList.get(depId)!.push(task.id);
                inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
            }
        }
    }

    const queue: string[] = [];
    for (const [taskId, degree] of inDegree.entries()) {
        if (degree === 0) {
            queue.push(taskId);
        }
    }

    while (queue.length > 0) {
        const uId = queue.shift()!;
        sorted.push(taskMap.get(uId)!);

        for (const vId of adjList.get(uId)!) {
            inDegree.set(vId, (inDegree.get(vId) || 1) - 1);
            if (inDegree.get(vId) === 0) {
                queue.push(vId);
            }
        }
    }

    if (sorted.length < tasks.length) {
        const sortedIds = new Set(sorted.map(t => t.id));
        for (const task of tasks) {
            if (!sortedIds.has(task.id)) {
                sorted.push(task);
            }
        }
    }

    return sorted;
};

const sortGroupsByDependencies = (groups: Group[], tasks: Task[]): Group[] => {
    const groupMap = new Map(groups.map(g => [g.id, g]));
    const taskToGroupMap = new Map(tasks.map(t => [t.id, t.groupId]));
    
    const sorted: Group[] = [];
    const inDegree: Map<string, number> = new Map();
    const adjList: Map<string, string[]> = new Map();

    for (const group of groups) {
        inDegree.set(group.id, 0);
        adjList.set(group.id, []);
    }

    for (const task of tasks) {
        const toGroupId = task.groupId;
        if (!toGroupId || !groupMap.has(toGroupId)) continue;

        for (const depId of task.dependencies || []) {
            const fromGroupId = taskToGroupMap.get(depId);
            if (fromGroupId && fromGroupId !== toGroupId && groupMap.has(fromGroupId)) {
                if (!adjList.get(fromGroupId)!.includes(toGroupId)) {
                    adjList.get(fromGroupId)!.push(toGroupId);
                    inDegree.set(toGroupId, (inDegree.get(toGroupId) || 0) + 1);
                }
            }
        }
    }

    const queue: string[] = [];
    for (const [groupId, degree] of inDegree.entries()) {
        if (degree === 0) {
            queue.push(groupId);
        }
    }

    while (queue.length > 0) {
        const uId = queue.shift()!;
        sorted.push(groupMap.get(uId)!);

        for (const vId of adjList.get(uId)!) {
            inDegree.set(vId, (inDegree.get(vId) || 1) - 1);
            if (inDegree.get(vId) === 0) {
                queue.push(vId);
            }
        }
    }
    
    if (sorted.length < groups.length) {
        const sortedIds = new Set(sorted.map(g => g.id));
        for (const group of groups) {
            if (!sortedIds.has(group.id)) {
                sorted.push(group);
            }
        }
    }

    return sorted;
};

const computeGroupSpan = (groupTasks: Task[]): GroupSpan | null => {
    if (groupTasks.length === 0) return null;
    let start = groupTasks[0].startDate;
    let end = groupTasks[0].endDate;
    let weighted = 0;
    let totalDays = 0;
    for (const t of groupTasks) {
        if (t.startDate < start) start = t.startDate;
        if (t.endDate > end) end = t.endDate;
        const days = Math.max(1, diffInDays(t.startDate, t.endDate) + 1);
        weighted += (t.completion || 0) * days;
        totalDays += days;
    }
    return { startDate: start, endDate: end, completion: totalDays ? Math.round(weighted / totalDays) : 0 };
};

const GanttChart: React.FC<GanttChartProps> = ({
    projectData, onSetData, zoom: initialZoom, ganttViewMode, onGanttViewModeChange, onRequestAddTask, onRequestEditTask,
    dependencyLink, onStartDependencyLink, onLinkTask, onCancelLinking, onRemoveDependency
}) => {
    const { projectStartDate, projectEndDate, tasks, groups, assignments = [] } = projectData;

    const [currentZoom, setCurrentZoom] = useState(initialZoom);
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        try {
            const saved = localStorage.getItem('sai-gantt-sidebar-width');
            if (saved) {
                const num = parseInt(saved, 10);
                if (!isNaN(num) && num >= MIN_SIDEBAR_WIDTH && num <= MAX_SIDEBAR_WIDTH) {
                    return num;
                }
            }
        } catch {}
        return DEFAULT_SIDEBAR_WIDTH;
    });
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizingSidebar(true);
        resizeRef.current = {
            startX: e.clientX,
            startWidth: sidebarWidth,
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!resizeRef.current) return;
            const deltaX = moveEvent.clientX - resizeRef.current.startX;
            const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, Math.round(resizeRef.current.startWidth + deltaX)));
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizingSidebar(false);
            setSidebarWidth((latest) => {
                try {
                    localStorage.setItem('sai-gantt-sidebar-width', String(latest));
                } catch {}
                return latest;
            });
            resizeRef.current = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [sidebarWidth]);

    const handleResetSidebarWidth = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
        try {
            localStorage.setItem('sai-gantt-sidebar-width', String(DEFAULT_SIDEBAR_WIDTH));
        } catch {}
    }, []);

    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
    const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
    const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
    const [viewportWidth, setViewportWidth] = useState(0);

    const timelineScrollRef = useRef<HTMLDivElement>(null);
    const sidebarScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrentZoom(initialZoom);
    }, [initialZoom]);

    // Track the visible width of the timeline so the grid can always fill it.
    useLayoutEffect(() => {
        const el = timelineScrollRef.current;
        if (!el) return;
        const update = () => setViewportWidth(el.clientWidth);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // When the zoom level changes, keep the date in the middle of the viewport fixed.
    // If the previous zoom fitted entirely on screen there is no meaningful "middle",
    // so keep the left edge (the project start) instead.
    const prevZoomRef = useRef(currentZoom);
    const prevOverflowedRef = useRef(false);
    useLayoutEffect(() => {
        const el = timelineScrollRef.current;
        const prevZoom = prevZoomRef.current;
        prevZoomRef.current = currentZoom;
        if (!el || prevZoom === currentZoom) return;
        if (!prevOverflowedRef.current) {
            el.scrollLeft = 0;
            return;
        }
        const centerDay = (el.scrollLeft + el.clientWidth / 2) / prevZoom;
        el.scrollLeft = Math.max(0, centerDay * currentZoom - el.clientWidth / 2);
    }, [currentZoom]);
    useLayoutEffect(() => {
        const el = timelineScrollRef.current;
        if (el) prevOverflowedRef.current = el.scrollWidth > el.clientWidth + 1;
    });

    // On first render, bring today into view (if it falls inside the project).
    const hasScrolledToTodayRef = useRef(false);
    useLayoutEffect(() => {
        const el = timelineScrollRef.current;
        if (!el || hasScrolledToTodayRef.current || viewportWidth === 0) return;
        hasScrolledToTodayRef.current = true;
        const todayOffset = diffInDays(projectStartDate, new Date());
        const totalDays = diffInDays(projectStartDate, projectEndDate) + 1;
        if (todayOffset > 0 && todayOffset < totalDays) {
            el.scrollLeft = Math.max(0, (todayOffset - 3) * currentZoom);
        }
    }, [viewportWidth, projectStartDate, projectEndDate, currentZoom]);

    // Esc cancels an in-progress dependency link.
    useEffect(() => {
        if (!dependencyLink) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancelLinking(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [dependencyLink, onCancelLinking]);

    const handleScroll = () => {
        if (timelineScrollRef.current && sidebarScrollRef.current) {
            sidebarScrollRef.current.scrollTop = timelineScrollRef.current.scrollTop;
        }
    };
    
    useEffect(() => {
        const sidebarEl = sidebarScrollRef.current;
        const timelineEl = timelineScrollRef.current;
        if (!sidebarEl || !timelineEl) return;

        // Over the sidebar: scroll the timeline vertically (the sidebar mirrors it).
        const handleSidebarWheel = (e: WheelEvent) => {
            e.preventDefault();
            timelineEl.scrollTop += e.deltaY;
        };

        // Over the timeline: horizontal wheel / shift+wheel pans, ctrl/cmd+wheel zooms.
        const handleTimelineWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                setCurrentZoom(z => {
                    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
                    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * factor)));
                });
                return;
            }
            const dx = e.deltaX !== 0 ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
            if (dx !== 0) {
                e.preventDefault();
                timelineEl.scrollLeft += dx;
            }
        };

        sidebarEl.addEventListener('wheel', handleSidebarWheel, { passive: false });
        timelineEl.addEventListener('wheel', handleTimelineWheel, { passive: false });

        return () => {
            sidebarEl.removeEventListener('wheel', handleSidebarWheel);
            timelineEl.removeEventListener('wheel', handleTimelineWheel);
        };
    }, []);

    // While a bar is being dragged we render from a local preview and only write to
    // project data (and undo history) once, when the drag ends.
    const effectiveTasks = useMemo(() => {
        if (!dragPreview) return tasks;
        return tasks.map(t => t.id === dragPreview.taskId
            ? { ...t, startDate: dragPreview.startDate, endDate: dragPreview.endDate }
            : t);
    }, [tasks, dragPreview]);

    const tasksById = useMemo(() => new Map(effectiveTasks.map(t => [t.id, t])), [effectiveTasks]);

    const assignmentsByTaskId = useMemo(() => {
        return assignments.reduce((acc, assignment) => {
            if (!acc[assignment.taskId]) acc[assignment.taskId] = [];
            acc[assignment.taskId].push(assignment);
            return acc;
        }, {} as Record<string, Assignment[]>);
    }, [assignments]);

    const displayItems = useMemo(() => {
        const items: DisplayItem[] = [];
        const groupIds = new Set(groups.map(g => g.id));

        const pushTask = (task: Task) => {
            const taskAssignments = assignmentsByTaskId[task.id] || [];
            items.push({ type: 'task', data: task, hasAssignments: taskAssignments.length > 0 });
            if (expandedTasks.has(task.id)) {
                taskAssignments.forEach(assignment => {
                    items.push({ type: 'assignment', data: assignment, color: task.color });
                });
            }
        };

        sortGroupsByDependencies(groups, effectiveTasks).forEach(group => {
            const groupTasks = effectiveTasks.filter(t => t.groupId === group.id);
            items.push({ type: 'group', data: group, span: computeGroupSpan(groupTasks) });
            if (!collapsedGroups.has(group.id)) {
                topologicalSortTasks(groupTasks).forEach(pushTask);
            }
        });

        // Tasks with no group, or whose group no longer exists, are listed at the end.
        const ungroupedTasks = effectiveTasks.filter(t => !t.groupId || !groupIds.has(t.groupId));
        topologicalSortTasks(ungroupedTasks).forEach(pushTask);

        return items;
    }, [groups, effectiveTasks, collapsedGroups, expandedTasks, assignmentsByTaskId]);

    // One layout shared by the sidebar, the bars, the grid and the dependency arrows.
    const { rows, totalHeight } = useMemo(() => layoutRows(displayItems), [displayItems]);

    const handleToggleGroup = (groupId: string) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) newSet.delete(groupId);
            else newSet.add(groupId);
            return newSet;
        });
    };
    
    const handleToggleTaskExpansion = (taskId: string) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) newSet.delete(taskId);
            else newSet.add(taskId);
            return newSet;
        });
    };
    
    const handleAssignTaskToGroup = (taskId: string, groupId: string | null) => {
        onSetData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? {...t, groupId: groupId ?? undefined} : t)
            }
        });
    }

    const handleStartDependencyFromNode = (taskId: string, type: 'prerequisite' | 'postrequisite') => {
        onStartDependencyLink(taskId, type);
        setSelectedTaskId(null);
        window.setTimeout(() => setSelectedTaskId(null), 0);
    };

    const handleDragCommit = useCallback((taskId: string, startDate: Date, endDate: Date) => {
        setDragPreview(null);
        onSetData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, startDate, endDate } : t)
            }
        });
    }, [onSetData]);

    const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
        onSetData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
            }
        });
    }

    const handleAddGroup = (newGroup: Group) => {
        onSetData(prev => {
            if (!prev) return prev;
            
            const newLayout = JSON.parse(JSON.stringify(prev.designLayout || { tasks: {}, groups: {} }));
            
            const existingGroupCount = Object.keys(newLayout.groups).length;
            const newX = 100 + (existingGroupCount % 4) * 400;
            const newY = 100 + Math.floor(existingGroupCount / 4) * 450;
            
            newLayout.groups[newGroup.id] = { x: newX, y: newY, width: 350, height: 400 };
    
            return { 
                ...prev, 
                groups: [...prev.groups, newGroup],
                designLayout: newLayout
            };
        });
    }

    const dependencies = useMemo(() => {
        const deps: Dependency[] = [];
        const rowCenterY = new Map<string, number>();
        rows.forEach(row => {
            if (row.item.type === 'task') rowCenterY.set(row.item.data.id, row.top + row.height / 2);
        });

        effectiveTasks.forEach(task => {
            (task.dependencies || []).forEach(depId => {
                const sourceY = rowCenterY.get(depId);
                const targetY = rowCenterY.get(task.id);
                const sourceTask = tasksById.get(depId);
                if (sourceY === undefined || targetY === undefined || !sourceTask) return;

                deps.push({
                    sourceId: depId,
                    targetId: task.id,
                    start: {
                        x: (diffInDays(projectStartDate, sourceTask.endDate) + 1) * currentZoom,
                        y: sourceY,
                    },
                    end: {
                        x: diffInDays(projectStartDate, task.startDate) * currentZoom,
                        y: targetY,
                    },
                });
            });
        });
        return deps;
    }, [rows, effectiveTasks, tasksById, projectStartDate, currentZoom]);

    const handleScrollToToday = () => {
        if (timelineScrollRef.current) {
            const todayOffset = diffInDays(projectStartDate, new Date());
            const targetX = Math.max(0, todayOffset * currentZoom - 240);
            timelineScrollRef.current.scrollTo({ left: targetX, behavior: 'smooth' });
        }
    };

    return (
        <div className="flex h-full bg-white dark:bg-gray-900 relative overflow-hidden font-sans">
            <TaskSidebar 
                width={sidebarWidth}
                projectData={projectData}
                scrollRef={sidebarScrollRef}
                onSelectTask={setSelectedTaskId}
                onEditTask={onRequestEditTask}
                selectedTaskId={selectedTaskId}
                rows={rows}
                totalHeight={totalHeight}
                collapsedGroups={collapsedGroups}
                onToggleGroup={handleToggleGroup}
                expandedTasks={expandedTasks}
                onToggleTaskExpansion={handleToggleTaskExpansion}
                dragOverGroupId={dragOverGroupId}
                onSetDragOverGroupId={setDragOverGroupId}
                onAssignTaskToGroup={handleAssignTaskToGroup}
                onAddGroup={() => setIsAddGroupModalOpen(true)}
                onAddTask={onRequestAddTask}
            />

            {/* Adjustable Splitter Divider */}
            <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Adjust project tasks section width"
                title="Drag to resize Project Tasks (Double-click to reset)"
                onMouseDown={handleResizeMouseDown}
                onDoubleClick={handleResetSidebarWidth}
                className={`relative group/resizer w-2 flex-shrink-0 cursor-col-resize z-30 transition-colors select-none ${
                    isResizingSidebar 
                        ? 'bg-accent/20' 
                        : 'hover:bg-accent/10 bg-transparent'
                }`}
            >
                {/* Vertical separator line */}
                <div 
                    className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 transition-all ${
                        isResizingSidebar 
                            ? 'bg-accent w-0.5' 
                            : 'bg-[#e6e6e2] dark:bg-gray-800 w-px group-hover/resizer:bg-accent group-hover/resizer:w-0.5'
                    }`} 
                />
                
                {/* Center Grip Pill Handle */}
                <div 
                    className={`absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-3.5 h-8 rounded-full bg-white dark:bg-gray-800 border shadow-xs flex items-center justify-center transition-all ${
                        isResizingSidebar 
                            ? 'border-accent text-accent scale-110 shadow-sm ring-2 ring-accent/20' 
                            : 'border-[#e6e6e2] dark:border-gray-700 text-gray-400 group-hover/resizer:border-accent group-hover/resizer:text-accent'
                    }`}
                >
                    <svg className="w-2 h-2" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="8" cy="6" r="2.5" />
                        <circle cx="16" cy="6" r="2.5" />
                        <circle cx="8" cy="12" r="2.5" />
                        <circle cx="16" cy="12" r="2.5" />
                        <circle cx="8" cy="18" r="2.5" />
                        <circle cx="16" cy="18" r="2.5" />
                    </svg>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 relative">
                 <div className="flex-shrink-0 flex items-center justify-between border-b border-[#e6e6e2] dark:border-gray-800 px-4 h-[60px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <BenchlineLogo className="w-5 h-5" />
                        <h2 className="text-sm font-bold text-[#292c31] dark:text-gray-100 font-['Manrope']">Roadmap Timeline</h2>
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f4f5f0] dark:bg-gray-800 text-[11px] font-bold text-[#626e56] dark:text-[#a0ae95] border border-[#e6e6e2] dark:border-gray-700">
                            <span>{tasks.filter(t => t.completion === 100).length} of {tasks.length} done</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={handleScrollToToday}
                            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl border border-[#e6e6e2] dark:border-gray-700 hover:bg-[#f0efeb] dark:hover:bg-gray-800 text-[#5c6652] dark:text-gray-300 transition-colors"
                            title="Scroll to Today"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                            <span>Today</span>
                        </button>
                        <ViewControls 
                            viewMode={ganttViewMode} 
                            onViewModeChange={onGanttViewModeChange} 
                            zoom={currentZoom}
                            onZoomChange={setCurrentZoom}
                        />
                        <button
                            onClick={onRequestAddTask}
                            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-2xs active:scale-98"
                        >
                            <span>＋</span>
                            <span className="hidden sm:inline">Add Task</span>
                        </button>
                    </div>
                </div>
                {dependencyLink && (
                    <div className="absolute left-1/2 top-[68px] z-40 -translate-x-1/2 flex items-center gap-3 rounded-full border border-accent/30 bg-accent-soft pl-4 pr-1.5 py-1.5 text-xs font-bold text-accent shadow-lg whitespace-nowrap">
                        <span>
                            {dependencyLink.type === 'prerequisite'
                                ? `Click a task that should follow “${tasksById.get(dependencyLink.fromTaskId)?.name ?? 'this task'}”`
                                : `Click a task that “${tasksById.get(dependencyLink.fromTaskId)?.name ?? 'this task'}” depends on`}
                        </span>
                        <button onClick={onCancelLinking} className="rounded-full bg-white/80 hover:bg-white px-2.5 py-0.5 text-[#c2410c]">Cancel (Esc)</button>
                    </div>
                )}
                <div 
                    ref={timelineScrollRef}
                    onScroll={handleScroll}
                    className="flex-grow overflow-y-auto overflow-x-hidden relative"
                >
                    <Timeline
                        projectStartDate={projectStartDate}
                        projectEndDate={projectEndDate}
                        rows={rows}
                        totalHeight={totalHeight}
                        viewportWidth={viewportWidth}
                        zoom={currentZoom}
                        ganttViewMode={ganttViewMode}
                        selectedTaskId={selectedTaskId}
                        onSelectTask={setSelectedTaskId}
                        onTaskUpdate={handleTaskUpdate}
                        onDragPreview={setDragPreview}
                        onDragCommit={handleDragCommit}
                        onRequestEditTask={onRequestEditTask}
                        dependencyLink={dependencyLink}
                        onLinkTask={onLinkTask}
                        onStartDependencyLink={handleStartDependencyFromNode}
                        dependencies={dependencies}
                        onRemoveDependency={onRemoveDependency}
                    />
                </div>
                <div
                    className="flex-shrink-0 flex items-center px-4 border-t border-[#e6e6e2] dark:border-gray-800"
                    style={{ height: FOOTER_HEIGHT }}
                >
                    <HorizontalScrollbar scrollRef={timelineScrollRef} />
                </div>
            </div>
            {isAddGroupModalOpen && <AddGroupModal isOpen={isAddGroupModalOpen} onClose={() => setIsAddGroupModalOpen(false)} onSave={handleAddGroup} />}
            
            {selectedTaskId && (
                <div className="absolute top-0 right-0 h-full w-[400px] z-40 shadow-2xl border-l border-gray-200 dark:border-gray-700">
                    <GanttTaskDetailPanel
                        taskId={selectedTaskId}
                        projectData={projectData}
                        onSetData={onSetData}
                        onClose={() => setSelectedTaskId(null)}
                        isOpen={!!selectedTaskId}
                        onStartLinking={(type) => handleStartDependencyFromNode(selectedTaskId, type)}
                        onRemoveDependency={onRemoveDependency}
                    />
                </div>
            )}
        </div>
    );
};

export default GanttChart;
