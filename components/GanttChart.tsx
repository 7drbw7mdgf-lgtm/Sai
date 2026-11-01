
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { ProjectData, Task, Group, Assignment, View } from '../types';
import TaskSidebar from './TaskSidebar';
import Timeline from './Timeline';
import HorizontalScrollbar from './HorizontalScrollbar';
import ViewControls from './ViewControls';
import { diffInDays } from '../services/dateUtils';
import AddGroupModal from './AddGroupModal';
import GanttTaskDetailPanel from './GanttTaskDetailPanel';

type DisplayItem =
    | { type: 'task'; data: Task; hasAssignments: boolean }
    | { type: 'group'; data: Group }
    | { type: 'assignment'; data: Assignment };

interface GanttChartProps {
    projectData: ProjectData;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    zoom: number;
    ganttViewMode: 'day' | 'week' | 'month';
    onGanttViewModeChange: (mode: 'day' | 'week' | 'month') => void;
    onRequestAddTask: () => void;
    onRequestEditTask: (taskId: string) => void;
    dependencyLink: { type: 'prerequisite' | 'postrequisite', fromTaskId: string } | null;
    onStartDependencyLink: (taskId: string, type: 'prerequisite' | 'postrequisite') => void;
    onLinkTask: (toTaskId: string) => void;
    onRemoveDependency: (sourceId: string, targetId: string) => void;
}

const ROW_HEIGHT = 60;
const GROUP_ROW_HEIGHT = 40;
const ASSIGNMENT_ROW_HEIGHT = 40;
const DEFAULT_SIDEBAR_WIDTH = 400;
const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 750;

const SparkIcon = ({ className = "w-4 h-4 text-[#ef754e]" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a1.25 1.25 0 0 1 1.25 1.25v5.474l3.87-3.87a1.25 1.25 0 1 1 1.768 1.768l-3.87 3.87h5.474a1.25 1.25 0 1 1 0 2.5h-5.474l3.87 3.87a1.25 1.25 0 1 1-1.768 1.768l-3.87-3.87v5.474a1.25 1.25 0 1 1-2.5 0v-5.474l-3.87 3.87a1.25 1.25 0 0 1-1.768-1.768l3.87-3.87H3.25a1.25 1.25 0 1 1 0-2.5h5.474l-3.87-3.87a1.25 1.25 0 0 1 1.768-1.768l3.87 3.87V3.25A1.25 1.25 0 0 1 12 2Z" />
    </svg>
);

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
        if (!toGroupId) continue;

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


const GanttChart: React.FC<GanttChartProps> = ({
    projectData, onSetData, zoom: initialZoom, ganttViewMode, onGanttViewModeChange, onRequestAddTask, onRequestEditTask,
    dependencyLink, onStartDependencyLink, onLinkTask, onRemoveDependency
}) => {
    const { projectStartDate, tasks, groups, people, assignments = [] } = projectData;

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

    const timelineScrollRef = useRef<HTMLDivElement>(null);
    const sidebarScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrentZoom(initialZoom);
    }, [initialZoom]);

    const handleScroll = () => {
        if (timelineScrollRef.current && sidebarScrollRef.current) {
            sidebarScrollRef.current.scrollTop = timelineScrollRef.current.scrollTop;
        }
    };
    
    useEffect(() => {
        const sidebarEl = sidebarScrollRef.current;
        const timelineEl = timelineScrollRef.current;
        if (!sidebarEl || !timelineEl) return;

        const handleSidebarWheel = (e: WheelEvent) => {
            e.preventDefault();
            timelineEl.scrollTop += e.deltaY;
        };

        sidebarEl.addEventListener('wheel', handleSidebarWheel, { passive: false });

        return () => {
            sidebarEl.removeEventListener('wheel', handleSidebarWheel);
        };
    }, []);
    
    const assignmentsByTaskId = useMemo(() => {
        return assignments.reduce((acc, assignment) => {
            if (!acc[assignment.taskId]) acc[assignment.taskId] = [];
            acc[assignment.taskId].push(assignment);
            return acc;
        }, {} as Record<string, Assignment[]>);
    }, [assignments]);

    const displayItems = useMemo(() => {
        const items: DisplayItem[] = [];
        
        const sortedGroups = sortGroupsByDependencies(groups, tasks);
        
        sortedGroups.forEach(group => {
            items.push({ type: 'group', data: group });
            if (!collapsedGroups.has(group.id)) {
                const groupTasks = tasks.filter(t => t.groupId === group.id);
                const sortedGroupTasks = topologicalSortTasks(groupTasks);
                
                sortedGroupTasks.forEach(task => {
                    const taskAssignments = assignmentsByTaskId[task.id] || [];
                    items.push({ type: 'task', data: task, hasAssignments: taskAssignments.length > 0 });
                    if (expandedTasks.has(task.id)) {
                        taskAssignments.forEach(assignment => {
                            items.push({ type: 'assignment', data: assignment });
                        });
                    }
                });
            }
        });
        
        const ungroupedTasks = tasks.filter(t => !t.groupId);
        const sortedUngroupedTasks = topologicalSortTasks(ungroupedTasks);
        
        sortedUngroupedTasks.forEach(task => {
            const taskAssignments = assignmentsByTaskId[task.id] || [];
            items.push({ type: 'task', data: task, hasAssignments: taskAssignments.length > 0 });
            if (expandedTasks.has(task.id)) {
                taskAssignments.forEach(assignment => {
                    items.push({ type: 'assignment', data: assignment });
                });
            }
        });

        return items;
    }, [groups, tasks, collapsedGroups, expandedTasks, assignmentsByTaskId]);

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
        const deps: any[] = [];
        let currentY = 0;
        const taskPositions: { [key: string]: { y: number; start: Date, end: Date } } = {};

        displayItems.forEach(item => {
            if (item.type === 'task') {
                taskPositions[item.data.id] = { y: currentY + ROW_HEIGHT / 2, start: item.data.startDate, end: item.data.endDate };
                currentY += ROW_HEIGHT;
            } else if(item.type === 'group') {
                currentY += GROUP_ROW_HEIGHT;
            } else if (item.type === 'assignment') {
                currentY += ASSIGNMENT_ROW_HEIGHT;
            }
        });

        tasks.forEach(task => {
            (task.dependencies || []).forEach(depId => {
                const sourceTaskPos = taskPositions[depId];
                const targetTaskPos = taskPositions[task.id];
                if (sourceTaskPos && targetTaskPos) {
                    const sourceTask = tasks.find(t => t.id === depId);
                    if (!sourceTask) return;
                    
                    const sourceStartOffset = diffInDays(projectStartDate, sourceTask.startDate);
                    const sourceDuration = diffInDays(sourceTask.startDate, sourceTask.endDate) + 1;
                    
                    deps.push({
                        sourceId: depId,
                        targetId: task.id,
                        start: {
                            x: (sourceStartOffset + sourceDuration) * currentZoom,
                            y: sourceTaskPos.y,
                        },
                        end: {
                            x: diffInDays(projectStartDate, targetTaskPos.start) * currentZoom,
                            y: targetTaskPos.y,
                        },
                    });
                }
            });
        });
        return deps;
    }, [displayItems, tasks, projectStartDate, currentZoom]);

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
                displayItems={displayItems}
                rowHeight={ROW_HEIGHT}
                groupRowHeight={GROUP_ROW_HEIGHT}
                assignmentRowHeight={ASSIGNMENT_ROW_HEIGHT}
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
                        ? 'bg-[#ef754e]/20' 
                        : 'hover:bg-[#ef754e]/10 bg-transparent'
                }`}
            >
                {/* Vertical separator line */}
                <div 
                    className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 transition-all ${
                        isResizingSidebar 
                            ? 'bg-[#ef754e] w-0.5' 
                            : 'bg-[#e6e6e2] dark:bg-gray-800 w-px group-hover/resizer:bg-[#ef754e] group-hover/resizer:w-0.5'
                    }`} 
                />
                
                {/* Center Grip Pill Handle */}
                <div 
                    className={`absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-3.5 h-8 rounded-full bg-white dark:bg-gray-800 border shadow-xs flex items-center justify-center transition-all ${
                        isResizingSidebar 
                            ? 'border-[#ef754e] text-[#ef754e] scale-110 shadow-sm ring-2 ring-[#ef754e]/20' 
                            : 'border-[#e6e6e2] dark:border-gray-700 text-gray-400 group-hover/resizer:border-[#ef754e] group-hover/resizer:text-[#ef754e]'
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
                        <SparkIcon className="w-4 h-4 text-[#ef754e]" />
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
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ef754e]"></span>
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
                            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#ef754e] hover:bg-[#d85f3b] text-white text-xs font-bold transition-all shadow-2xs active:scale-98"
                        >
                            <span>＋</span>
                            <span className="hidden sm:inline">Add Task</span>
                        </button>
                    </div>
                </div>
                {dependencyLink && (
                    <div className="absolute left-1/2 top-[68px] z-40 -translate-x-1/2 rounded-full border border-[#ef754e]/30 bg-[#fdf2ee] px-4 py-2 text-xs font-bold text-[#ef754e] shadow-lg">
                        Click another task bar to create a dependency link
                    </div>
                )}
                <div 
                    ref={timelineScrollRef}
                    onScroll={handleScroll}
                    className="flex-grow overflow-auto relative no-x-scrollbar"
                >
                    <Timeline
                        projectData={projectData}
                        displayItems={displayItems}
                        zoom={currentZoom}
                        ganttViewMode={ganttViewMode}
                        rowHeight={ROW_HEIGHT}
                        groupRowHeight={GROUP_ROW_HEIGHT}
                        assignmentRowHeight={ASSIGNMENT_ROW_HEIGHT}
                        selectedTaskId={selectedTaskId}
                        onSelectTask={setSelectedTaskId}
                        onTaskUpdate={handleTaskUpdate}
                        onRequestEditTask={onRequestEditTask}
                        dependencyLink={dependencyLink}
                        onLinkTask={onLinkTask}
                        onStartDependencyLink={handleStartDependencyFromNode}
                        dependencies={dependencies}
                        onRemoveDependency={onRemoveDependency}
                    />
                </div>
                <div className="flex-shrink-0 p-3 border-t border-l border-gray-200 dark:border-gray-700">
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
                        onStartLinking={(type) => {
                            // We need to hoist this up to App but for now we can try to handle in Gantt if logic allows, 
                            // or we assume App handles it via prop. The prop is available here.
                            // However, the prop expects to be called from App level state.
                            // We need to adapt this: GanttChart receives onRequestEditTask which opens the App-level modal.
                            // But here we are in the internal panel.
                            // We can check if we have a handler for dependency linking passed to GanttChart
                            // We don't have onStartLinking passed to GanttChart props explicitly for this panel usage yet.
                            // But wait, dependencyLink state is in App. We need a way to set it.
                            // The prop 'onRequestEditTask' opens the modal.
                            // We can assume for now that this internal panel is for quick view/edits. 
                            // Dependency linking is complex and currently tied to App state.
                            // Let's disable dependency linking from this quick view or reuse the prop if we can add it.
                            // For now, passing undefined to disable it in the quick view to avoid state mismatch complexity.
                        }}
                        onRemoveDependency={onRemoveDependency}
                    />
                </div>
            )}
        </div>
    );
};

export default GanttChart;
