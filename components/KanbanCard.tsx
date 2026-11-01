import React from 'react';
import { Task, Person, Group, Priority } from '../types';

export interface KanbanCardProps {
    task: Task;
    people: Person[];
    groups: Group[];
    currentColId: 'todo' | 'inprogress' | 'review' | 'done';
    onEdit: (taskId: string) => void;
    onMoveColumn: (taskId: string, targetColId: 'todo' | 'inprogress' | 'review' | 'done') => void;
    onToggleComplete: (taskId: string) => void;
}

const COLUMNS_ORDER: ('todo' | 'inprogress' | 'review' | 'done')[] = ['todo', 'inprogress', 'review', 'done'];

// Authentic Sparkboard card background tones
const SPARK_CARD_THEMES: { [key: string]: { bg: string; border: string; accent: string; text: string } } = {
    yellow:   { bg: 'bg-[#fefcf3] dark:bg-[#282618]', border: 'border-[#fae69e] dark:border-[#4d4420]', accent: '#f8df87', text: 'text-[#846b0a] dark:text-[#f8df87]' },
    green:    { bg: 'bg-[#f6faf2] dark:bg-[#1a251c]', border: 'border-[#d6e8c4] dark:border-[#2d4833]', accent: '#dce7cc', text: 'text-[#446b33] dark:text-[#dce7cc]' },
    coral:    { bg: 'bg-[#fcf5f2] dark:bg-[#291d19]', border: 'border-[#f2cebf] dark:border-[#522e25]', accent: '#edcbbd', text: 'text-[#ba4f30] dark:text-[#edcbbd]' },
    lavender: { bg: 'bg-[#f8f5fc] dark:bg-[#231b2b]', border: 'border-[#e4d7f5] dark:border-[#422e54]', accent: '#e8ddf1', text: 'text-[#684399] dark:text-[#e8ddf1]' },
    blue:     { bg: 'bg-[#f2f9fb] dark:bg-[#17242a]', border: 'border-[#c7e6ea] dark:border-[#23454f]', accent: '#cde4e7', text: 'text-[#236875] dark:text-[#cde4e7]' },
    white:    { bg: 'bg-white dark:bg-[#212429]', border: 'border-[#e6e6e2] dark:border-gray-800', accent: '#e6e6e2', text: 'text-gray-600 dark:text-gray-300' },
};

export const KanbanCard: React.FC<KanbanCardProps> = ({
    task,
    people,
    groups,
    currentColId,
    onEdit,
    onMoveColumn,
    onToggleComplete,
}) => {
    const group = groups.find((g) => g.id === task.groupId);
    const assignees = (Array.isArray(task.assignedTo) ? task.assignedTo : [])
        .map((pid) => people.find((p) => p.id === pid))
        .filter(Boolean) as Person[];

    // Deterministic palette pick per task id
    const themeKeys = ['white', 'yellow', 'coral', 'blue', 'green', 'lavender'];
    const charCodeSum = task.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const cardTheme = SPARK_CARD_THEMES[themeKeys[charCodeSum % themeKeys.length]];

    const currentIdx = COLUMNS_ORDER.indexOf(currentColId);
    const canMoveLeft = currentIdx > 0;
    const canMoveRight = currentIdx < COLUMNS_ORDER.length - 1;
    const leftCol = canMoveLeft ? COLUMNS_ORDER[currentIdx - 1] : null;
    const rightCol = canMoveRight ? COLUMNS_ORDER[currentIdx + 1] : null;

    const isDone = task.completion === 100;
    const isOverdue = task.endDate && new Date(task.endDate) < new Date() && !isDone;

    const formattedDueDate = task.endDate
        ? new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : null;

    const getPriorityBadge = (priority?: Priority) => {
        switch (priority) {
            case Priority.Urgent:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fee2e2] text-[#dc2626] dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] animate-pulse"></span>
                        Urgent
                    </span>
                );
            case Priority.High:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffedd5] text-[#ea580c] dark:bg-orange-950/60 dark:text-orange-400 border border-orange-200 dark:border-orange-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                        High
                    </span>
                );
            case Priority.Medium:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e0f2fe] text-[#0284c7] dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]"></span>
                        Medium
                    </span>
                );
            case Priority.Low:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f1f5f9] text-[#64748b] dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"></span>
                        Low
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', task.id);
                e.dataTransfer.effectAllowed = 'move';
            }}
            className={`group relative rounded-xl border p-4 shadow-2xs hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${cardTheme.bg} ${cardTheme.border}`}
        >
            {/* Top row: Priority & Group & Quick move */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {getPriorityBadge(task.priority)}
                    {group && (
                        <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300"
                            style={{ borderLeft: `3px solid ${group.color || '#ef754e'}` }}
                        >
                            {group.name}
                        </span>
                    )}
                </div>

                {/* Quick column shift arrows */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xs rounded-md border border-[#e6e6e2] dark:border-gray-700 px-1 py-0.5">
                    {canMoveLeft && leftCol && (
                        <button
                            title={`Move to ${leftCol}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoveColumn(task.id, leftCol);
                            }}
                            className="p-1 hover:bg-[#f0efeb] dark:hover:bg-gray-700 rounded text-gray-500 hover:text-gray-900 dark:hover:text-white text-xs leading-none"
                        >
                            ←
                        </button>
                    )}
                    {canMoveRight && rightCol && (
                        <button
                            title={`Move to ${rightCol}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoveColumn(task.id, rightCol);
                            }}
                            className="p-1 hover:bg-[#f0efeb] dark:hover:bg-gray-700 rounded text-gray-500 hover:text-gray-900 dark:hover:text-white text-xs leading-none"
                        >
                            →
                        </button>
                    )}
                </div>
            </div>

            {/* Task Name */}
            <h4
                onClick={() => onEdit(task.id)}
                className={`font-semibold text-sm leading-snug tracking-tight text-[#292c31] dark:text-gray-100 hover:text-[#ef754e] dark:hover:text-[#ef754e] transition-colors cursor-pointer mb-2.5 ${
                    isDone ? 'line-through text-gray-400 dark:text-gray-500' : ''
                }`}
            >
                {task.name}
            </h4>

            {/* Tags (if any) */}
            {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mb-3">
                    {task.tags.map((tag, idx) => (
                        <span
                            key={idx}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{task.completion}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200/80 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${
                            isDone ? 'bg-[#10b981]' : 'bg-[#ef754e]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, task.completion))}%` }}
                    />
                </div>
            </div>

            {/* Bottom Row: Due Date & Assignees & Done Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-gray-800/60">
                <div className="flex items-center gap-2">
                    {/* Done Checkbox */}
                    <button
                        title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(task.id);
                        }}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
                            isDone
                                ? 'bg-[#10b981] border-[#10b981] text-white'
                                : 'border-gray-300 dark:border-gray-600 hover:border-[#ef754e] text-transparent hover:text-gray-300'
                        }`}
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>

                    {/* Due Date */}
                    {formattedDueDate && (
                        <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                isOverdue
                                    ? 'text-[#ef754e] font-semibold'
                                    : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
                                <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" />
                            </svg>
                            <span>{formattedDueDate}</span>
                        </span>
                    )}
                </div>

                {/* Assignees */}
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                    {assignees.slice(0, 3).map((person) => (
                        <div
                            key={person.id}
                            title={person.name}
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-[#e3e8de] dark:bg-gray-700 text-[#445239] dark:text-gray-200 font-bold text-[9px] flex items-center justify-center overflow-hidden shadow-2xs"
                        >
                            {person.avatarUrl ? (
                                <img
                                    src={person.avatarUrl}
                                    alt={person.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                person.name.slice(0, 2).toUpperCase()
                            )}
                        </div>
                    ))}
                    {assignees.length > 3 && (
                        <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-[9px] flex items-center justify-center">
                            +{assignees.length - 3}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KanbanCard;
