import React, { useState, useMemo } from 'react';
import BenchlineLogo from './BenchlineLogo';
import { ProjectData, Task, Priority, Person, Group } from '../types';
import KanbanCard from './KanbanCard';

export interface KanbanViewProps {
    projectData: ProjectData;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    onRequestEditTask: (taskId: string) => void;
    onRequestAddTask: (initialCompletion?: number) => void;
}

type ColumnId = 'todo' | 'inprogress' | 'review' | 'done';

interface ColumnDef {
    id: ColumnId;
    title: string;
    description: string;
    dotColor: string;
    badgeBg: string;
    badgeText: string;
    targetPct: number;
}

const COLUMNS: ColumnDef[] = [
    {
        id: 'todo',
        title: 'To Do',
        description: 'Ready to start',
        dotColor: '#eab308',
        badgeBg: 'bg-[#fef9e7] dark:bg-yellow-950/40',
        badgeText: 'text-[#846b0a] dark:text-[#fde68a]',
        targetPct: 0,
    },
    {
        id: 'inprogress',
        title: 'In Progress',
        description: 'Actively in flight',
        dotColor: '#0ea5e9',
        badgeBg: 'bg-[#f0f9ff] dark:bg-sky-950/40',
        badgeText: 'text-[#0369a1] dark:text-[#7dd3fc]',
        targetPct: 50,
    },
    {
        id: 'review',
        title: 'In Review',
        description: 'Testing & QA verification',
        dotColor: '#a855f7',
        badgeBg: 'bg-[#faf5ff] dark:bg-purple-950/40',
        badgeText: 'text-[#7e22ce] dark:text-[#d8b4fe]',
        targetPct: 85,
    },
    {
        id: 'done',
        title: 'Done',
        description: 'Shipped & finished',
        dotColor: '#10b981',
        badgeBg: 'bg-[#ecfdf5] dark:bg-emerald-950/40',
        badgeText: 'text-[#047857] dark:text-[#6ee7b7]',
        targetPct: 100,
    },
];

export const KanbanView: React.FC<KanbanViewProps> = ({
    projectData,
    onSetData,
    onRequestEditTask,
    onRequestAddTask,
}) => {
    const { tasks = [], people = [], groups = [] } = projectData;

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
    const [groupFilter, setGroupFilter] = useState<string>('all');

    // Drag-over styling
    const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);

    // Categorize a task into a Kanban column
    const getTaskColId = (task: Task): ColumnId => {
        if (task.completion === 100) return 'done';
        if (task.completion >= 80) return 'review';
        if (task.completion > 0) return 'inprogress';
        return 'todo';
    };

    // Filter tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter((t) => {
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchName = t.name.toLowerCase().includes(query);
                const matchTags = Array.isArray(t.tags) && t.tags.some((tag) => tag.toLowerCase().includes(query));
                if (!matchName && !matchTags) return false;
            }
            if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
                return false;
            }
            if (assigneeFilter !== 'all') {
                if (!Array.isArray(t.assignedTo) || !t.assignedTo.includes(assigneeFilter)) {
                    return false;
                }
            }
            if (groupFilter !== 'all' && t.groupId !== groupFilter) {
                return false;
            }
            return true;
        });
    }, [tasks, searchQuery, priorityFilter, assigneeFilter, groupFilter]);

    // Tasks grouped by column
    const tasksByCol = useMemo(() => {
        const map: { [key in ColumnId]: Task[] } = {
            todo: [],
            inprogress: [],
            review: [],
            done: [],
        };
        filteredTasks.forEach((t) => {
            const col = getTaskColId(t);
            map[col].push(t);
        });
        return map;
    }, [filteredTasks]);

    // Update task completion based on target column
    const updateTaskColumn = (taskId: string, targetColId: ColumnId) => {
        onSetData((prev) => {
            if (!prev) return prev;
            const updated = prev.tasks.map((t) => {
                if (t.id !== taskId) return t;
                let newCompletion = t.completion;
                if (targetColId === 'todo') {
                    newCompletion = 0;
                } else if (targetColId === 'inprogress') {
                    newCompletion = t.completion > 0 && t.completion < 80 ? t.completion : 50;
                } else if (targetColId === 'review') {
                    newCompletion = 85;
                } else if (targetColId === 'done') {
                    newCompletion = 100;
                }
                return { ...t, completion: newCompletion };
            });
            return { ...prev, tasks: updated };
        });
    };

    // Toggle complete
    const handleToggleComplete = (taskId: string) => {
        onSetData((prev) => {
            if (!prev) return prev;
            const updated = prev.tasks.map((t) => {
                if (t.id !== taskId) return t;
                const newCompletion = t.completion === 100 ? 0 : 100;
                return { ...t, completion: newCompletion };
            });
            return { ...prev, tasks: updated };
        });
    };

    // Drag & Drop handlers
    const handleDragOver = (e: React.DragEvent, colId: ColumnId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverCol !== colId) {
            setDragOverCol(colId);
        }
    };

    const handleDragLeave = (e: React.DragEvent, colId: ColumnId) => {
        if (dragOverCol === colId) {
            setDragOverCol(null);
        }
    };

    const handleDrop = (e: React.DragEvent, targetColId: ColumnId) => {
        e.preventDefault();
        setDragOverCol(null);
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) {
            updateTaskColumn(taskId, targetColId);
        }
    };

    // Board Statistics
    const totalCount = tasks.length;
    const completedCount = tasks.filter((t) => t.completion === 100).length;
    const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="h-full flex flex-col overflow-hidden spark-canvas-grid text-[#292c31] dark:text-gray-100 font-sans">
            {/* Kanban Header & Filter Toolbar */}
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-[#e6e6e2] dark:border-gray-800 px-6 py-4 flex-shrink-0 z-10 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Title & Board Eyebrow */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <BenchlineLogo className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-wider text-[#7a8472] dark:text-[#9ea996]">
                                Personal Workspace / Board View
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-extrabold tracking-tight font-['Manrope']">
                                Kanban Sprint Board
                            </h2>
                            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#f4f5f0] dark:bg-gray-800 rounded-lg border border-[#e6e6e2] dark:border-gray-700 text-xs font-semibold text-[#545d4a] dark:text-[#a0ae95]">
                                <span>{completedCount} of {totalCount} completed</span>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span className="text-accent font-bold">{completionPct}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar Actions & Filters */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Search Filter */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Filter tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-44 sm:w-52 h-9 pl-8 pr-3 rounded-xl bg-[#fafaf8] dark:bg-gray-800 border border-[#e6e6e2] dark:border-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:border-accent focus:ring-1 focus:ring-accent text-xs font-medium outline-none transition-all placeholder-gray-400"
                            />
                            <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        {/* Priority Dropdown */}
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="h-9 px-3 rounded-xl bg-[#fafaf8] dark:bg-gray-800 border border-[#e6e6e2] dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none hover:bg-[#f0efeb] cursor-pointer"
                        >
                            <option value="all">All Priorities</option>
                            <option value={Priority.Urgent}>Urgent</option>
                            <option value={Priority.High}>High</option>
                            <option value={Priority.Medium}>Medium</option>
                            <option value={Priority.Low}>Low</option>
                        </select>

                        {/* Assignee Dropdown */}
                        {people.length > 0 && (
                            <select
                                value={assigneeFilter}
                                onChange={(e) => setAssigneeFilter(e.target.value)}
                                className="h-9 px-3 rounded-xl bg-[#fafaf8] dark:bg-gray-800 border border-[#e6e6e2] dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none hover:bg-[#f0efeb] cursor-pointer"
                            >
                                <option value="all">All People</option>
                                {people.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Group Dropdown */}
                        {groups.length > 0 && (
                            <select
                                value={groupFilter}
                                onChange={(e) => setGroupFilter(e.target.value)}
                                className="h-9 px-3 rounded-xl bg-[#fafaf8] dark:bg-gray-800 border border-[#e6e6e2] dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none hover:bg-[#f0efeb] cursor-pointer"
                            >
                                <option value="all">All Groups</option>
                                {groups.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* New Task Button */}
                        <button
                            onClick={() => onRequestAddTask()}
                            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-xs active:scale-98"
                        >
                            <span>＋</span>
                            <span>New Task</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Kanban Columns Canvas */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <div className="flex gap-6 h-full items-start min-w-[1080px]">
                    {COLUMNS.map((col) => {
                        const colTasks = tasksByCol[col.id] || [];
                        const isOver = dragOverCol === col.id;

                        return (
                            <div
                                key={col.id}
                                onDragOver={(e) => handleDragOver(e, col.id)}
                                onDragLeave={(e) => handleDragLeave(e, col.id)}
                                onDrop={(e) => handleDrop(e, col.id)}
                                className={`w-80 flex-shrink-0 flex flex-col max-h-full rounded-2xl border transition-all duration-200 ${
                                    isOver
                                        ? 'border-accent bg-accent-soft/90 dark:bg-accent/15 ring-2 ring-accent/30 scale-[1.01]'
                                        : 'border-[#e6e6e2] dark:border-gray-800 bg-[#fbfbf9]/85 dark:bg-[#1e2024]/85 backdrop-blur-xs'
                                }`}
                            >
                                {/* Column Header */}
                                <div className="p-4 border-b border-[#e6e6e2] dark:border-gray-800/80 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: col.dotColor }}
                                        />
                                        <h3 className="font-bold text-sm text-[#292c31] dark:text-gray-100">
                                            {col.title}
                                        </h3>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeBg} ${col.badgeText}`}
                                        >
                                            {colTasks.length}
                                        </span>
                                    </div>

                                </div>

                                {/* Column Task List */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[140px]">
                                    {/* Cards */}
                                    {colTasks.length > 0 ? (
                                        colTasks.map((task) => (
                                            <KanbanCard
                                                key={task.id}
                                                task={task}
                                                people={people}
                                                groups={groups}
                                                currentColId={col.id}
                                                onEdit={onRequestEditTask}
                                                onMoveColumn={updateTaskColumn}
                                                onToggleComplete={handleToggleComplete}
                                            />
                                        ))
                                    ) : (
                                        <div className="h-28 border border-dashed border-[#e6e6e2] dark:border-gray-800 rounded-xl flex flex-col items-center justify-center text-center p-3 text-gray-400 dark:text-gray-600">
                                            <span className="text-lg opacity-40 mb-1">✳</span>
                                            <span className="text-xs font-medium">No tasks in {col.title}</span>
                                            <button
                                                onClick={() => onRequestAddTask(col.targetPct)}
                                                className="text-[11px] text-accent hover:underline font-bold mt-1"
                                            >
                                                ＋ Add one now
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Column Bottom Quick Add */}
                                <div className="p-3 border-t border-[#e6e6e2]/60 dark:border-gray-800/60">
                                    <button
                                        onClick={() => onRequestAddTask(col.targetPct)}
                                        className="w-full py-2 px-3 rounded-xl border border-dashed border-[#e6e6e2] dark:border-gray-800 hover:border-accent dark:hover:border-accent text-xs font-semibold text-[#545d4a] dark:text-gray-400 hover:text-accent flex items-center justify-center gap-1.5 transition-all bg-white/40 dark:bg-gray-800/40"
                                    >
                                        <span>＋</span>
                                        <span>Add Task</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default KanbanView;
