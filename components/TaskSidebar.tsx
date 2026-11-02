
import React from 'react';
import { ProjectData } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { FolderPlusIcon } from './icons/FolderPlusIcon';
import Tooltip from './Tooltip';
import { ChevronRightIcon } from './icons/ChevronIcons';
import { PRIORITY_COLORS } from '../constants';
import { CheckCircleIcon, CheckCircleIconSolid } from './icons/CheckCircleIcon';
import { RowLayout, HEADER_HEIGHT, FOOTER_HEIGHT, BOTTOM_PADDING } from './ganttLayout';

interface TaskSidebarProps {
    width: number;
    projectData: ProjectData;
    scrollRef: React.RefObject<HTMLDivElement>;
    onSelectTask: (taskId: string) => void;
    onEditTask: (taskId: string) => void;
    selectedTaskId: string | null;
    rows: RowLayout[];
    totalHeight: number;
    collapsedGroups: Set<string>;
    onToggleGroup: (groupId: string) => void;
    expandedTasks: Set<string>;
    onToggleTaskExpansion: (taskId: string) => void;
    dragOverGroupId: string | null;
    onSetDragOverGroupId: (groupId: string | null) => void;
    onAssignTaskToGroup: (taskId: string, groupId: string | null) => void;
    onAddGroup: () => void;
    onAddTask: () => void;
}

const TaskSidebar: React.FC<TaskSidebarProps> = ({ 
    width, 
    projectData, 
    scrollRef, 
    onSelectTask, 
    onEditTask, 
    selectedTaskId, 
    rows,
    totalHeight,
    collapsedGroups, 
    onToggleGroup,
    expandedTasks,
    onToggleTaskExpansion,
    dragOverGroupId,
    onSetDragOverGroupId,
    onAssignTaskToGroup,
    onAddGroup,
    onAddTask
}) => {
    const { people } = projectData;

    return (
        <div style={{ width: `${width}px` }} className="flex-shrink-0 bg-white/95 dark:bg-gray-900/95 flex flex-col h-full backdrop-blur-sm select-none">
             <div className="flex justify-between items-center px-4 py-2 flex-shrink-0 h-[60px] border-b border-[#e6e6e2] dark:border-gray-800 bg-white/95 dark:bg-gray-900/95">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent"></span>
                    <h2 className="text-xs font-bold text-[#292c31] dark:text-gray-100 uppercase tracking-wider font-['Manrope']">Project Tasks</h2>
                </div>
                <div className="flex items-center gap-1">
                    <Tooltip text="Add Group">
                        <button onClick={onAddGroup} className="p-1.5 rounded-lg hover:bg-[#f0efeb] dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors" title="Add Group">
                            <FolderPlusIcon className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip text="Add Task">
                        <button onClick={onAddTask} className="p-1.5 rounded-lg hover:bg-[#f0efeb] dark:hover:bg-gray-800 text-accent dark:text-accent transition-colors" title="Add Task">
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    </Tooltip>
                </div>
            </div>
            {/* Column header: same height as the timeline's date header so rows line up. */}
            <div
                className="flex-shrink-0 flex items-end justify-between px-4 pb-1.5 border-b border-[#e6e6e2] dark:border-gray-800 bg-[#fafaf8] dark:bg-gray-800/60 text-[10px] font-bold uppercase tracking-wider text-[#7a8472] dark:text-gray-500"
                style={{ height: HEADER_HEIGHT }}
            >
                <span>Task</span>
                <span>Start</span>
            </div>
            <div ref={scrollRef} className="flex-grow overflow-y-hidden overflow-x-hidden bg-white dark:bg-gray-900">
                <div className="w-full" style={{ height: totalHeight + BOTTOM_PADDING }}>
                    {rows.map(({ item, height }) => {
                        if (item.type === 'group') {
                            const group = item.data;
                            const isCollapsed = collapsedGroups.has(group.id);
                            const groupTasksCount = projectData.tasks.filter(t => t.groupId === group.id).length;
                            return (
                                <div
                                    key={`group-${group.id}`}
                                    onClick={() => onToggleGroup(group.id)}
                                    className={`flex items-center justify-between px-3 group cursor-pointer bg-[#fafaf8] dark:bg-gray-800/60 border-b border-[#e6e6e2] dark:border-gray-800 font-bold text-xs text-[#292c31] dark:text-gray-200 hover:bg-[#f0efeb] dark:hover:bg-gray-800 transition-all ${dragOverGroupId === group.id ? 'bg-accent-soft ring-2 ring-accent/30 z-10' : ''}`}
                                    style={{ height }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const taskId = e.dataTransfer.getData('taskId');
                                        if (taskId) {
                                            onAssignTaskToGroup(taskId, group.id);
                                        }
                                        onSetDragOverGroupId(null);
                                    }}
                                    onDragEnter={(e) => { e.preventDefault(); onSetDragOverGroupId(group.id); }}
                                    onDragLeave={(e) => { e.preventDefault(); onSetDragOverGroupId(null); }}
                                >
                                    <div className="flex items-center gap-2 flex-1 w-0 truncate">
                                        <ChevronRightIcon className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${!isCollapsed ? 'rotate-90' : ''}`} />
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color || 'rgb(var(--color-primary-500))' }} />
                                        <span className="truncate text-xs font-bold text-[#292c31] dark:text-gray-100 font-['Manrope']">{group.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.span && (
                                            <span className="text-[10px] font-semibold text-gray-400 tabular-nums" title="Group progress (weighted by task duration)">{item.span.completion}%</span>
                                        )}
                                        <span className="text-[10px] font-semibold text-gray-400 px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10">
                                            {groupTasksCount}
                                        </span>
                                    </div>
                                </div>
                            );
                        }
                        
                        if (item.type === 'assignment') {
                            const assignment = item.data;
                            const assignedPeople = people.filter(p => assignment.assignedTo.includes(p.id));
                            return (
                                <div
                                    key={`assignment-${assignment.id}`}
                                    onClick={() => onEditTask(assignment.taskId)}
                                    className="flex items-center group cursor-pointer border-b border-[#f0f0ec] dark:border-gray-800 hover:bg-[#fafaf8] dark:hover:bg-gray-800/50 transition-colors"
                                    style={{ height, paddingLeft: '3.5rem' }}
                                >
                                    {assignment.completed ? <CheckCircleIconSolid className="w-3.5 h-3.5 text-emerald-500 mr-3 flex-shrink-0" /> : <CheckCircleIcon className="w-3.5 h-3.5 text-gray-300 mr-3 flex-shrink-0" />}
                                    <div className="flex-1 w-0 truncate text-xs text-gray-600 dark:text-gray-400 font-medium">{assignment.name}</div>
                                    <div className="flex items-center gap-4 pr-4">
                                        <div className="flex items-center -space-x-1.5">
                                            {assignedPeople.map(p => (
                                                <Tooltip key={p.id} text={p.name}>
                                                    <img src={p.avatarUrl} alt={p.name} className="w-5 h-5 rounded-full border border-white dark:border-gray-800"/>
                                                </Tooltip>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // item.type === 'task'
                        const task = item.data;
                        const key = `task-${task.id}`;
                        const assignedPeople = people.filter(p => task.assignedTo.includes(p.id));
                        const isSelected = selectedTaskId === task.id;
                        const isCompleted = task.completion >= 100;
                        return (
                            <div
                                key={key}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('taskId', task.id);
                                    e.dataTransfer.effectAllowed = 'move';
                                }}
                                onClick={() => onSelectTask(task.id)}
                                onDoubleClick={() => onEditTask(task.id)}
                                className={`flex items-center group cursor-pointer border-b border-[#f0f0ec] dark:border-gray-800/80 transition-colors ${
                                    isCompleted 
                                        ? 'bg-gray-50/60 dark:bg-gray-900/60' 
                                        : isSelected 
                                            ? 'bg-accent-soft dark:bg-[#2d221f] border-l-4 border-l-accent' 
                                            : 'hover:bg-[#fafaf8] dark:hover:bg-gray-800/30'
                                }`}
                                style={{ height }}
                            >
                                <div className={`w-1 h-full transition-colors ${isSelected ? 'bg-accent' : isCompleted ? 'bg-emerald-400' : 'bg-transparent'}`}></div>
                                <div className="flex items-center w-full" style={{ paddingLeft: task.groupId ? '1.5rem' : '0.5rem' }}>
                                    {item.hasAssignments ? (
                                        <div className="px-1 text-gray-400 hover:text-gray-600 cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleTaskExpansion(task.id); }}>
                                            <ChevronRightIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedTasks.has(task.id) ? 'rotate-90' : ''}`} />
                                        </div>
                                    ) : (
                                        <div className="w-5"/>
                                    )}
                                   {isCompleted && (
                                        <CheckCircleIconSolid className="mr-2 h-4 w-4 flex-shrink-0 text-emerald-500" />
                                   )}
                                   <div className={`w-1.5 h-8 relative rounded-full mr-3 flex-shrink-0 ${isCompleted ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                        <div 
                                            className="absolute bottom-0 left-0 right-0 transition-all duration-300 rounded-full" 
                                            style={{ height: `${task.completion}%`, backgroundColor: isCompleted ? '#10b981' : 'rgb(var(--color-primary-500))' }}
                                        />
                                   </div>
                                   <div className="flex-1 flex flex-col justify-center px-1 h-full w-0 py-1.5 pr-3">
                                        <p className={`font-semibold truncate text-xs ${isCompleted ? 'text-gray-400 line-through decoration-gray-300 dark:text-gray-500 dark:decoration-gray-600' : 'text-[#292c31] dark:text-gray-200'}`}>
                                            {task.name}
                                        </p>
                                        <div className="flex justify-between items-center mt-1">
                                            <div className="flex items-center -space-x-1.5">
                                                {assignedPeople.map(p => (
                                                    <Tooltip key={p.id} text={p.name}>
                                                        <img src={p.avatarUrl} alt={p.name} className="w-4 h-4 rounded-full border border-white dark:border-gray-800 shadow-2xs"/>
                                                    </Tooltip>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                                <span>
                                                    {task.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                                {task.priority && !isCompleted && (
                                                    <span 
                                                        className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-full uppercase" 
                                                        style={{ 
                                                            backgroundColor: `${PRIORITY_COLORS[task.priority]}15`,
                                                            color: PRIORITY_COLORS[task.priority]
                                                        }} 
                                                        title={`Priority: ${task.priority}`}
                                                    >
                                                        {task.priority}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="flex-shrink-0 flex items-stretch p-2 border-t border-[#e6e6e2] dark:border-gray-800" style={{ height: FOOTER_HEIGHT }}>
             <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    const taskId = e.dataTransfer.getData('taskId');
                    if (taskId) {
                        onAssignTaskToGroup(taskId, null);
                    }
                    onSetDragOverGroupId(null);
                }}
                onDragEnter={(e) => { e.preventDefault(); onSetDragOverGroupId('ungrouped'); }}
                onDragLeave={(e) => { e.preventDefault(); onSetDragOverGroupId(null); }}
                className={`flex-1 flex items-center justify-center border border-dashed rounded-xl transition-all duration-200 ${
                    dragOverGroupId === 'ungrouped'
                        ? 'bg-accent-soft border-accent dark:bg-[#2d221f]'
                        : 'border-[#e6e6e2] dark:border-gray-800 bg-[#fafaf8]/50 dark:bg-gray-800/30'
                }`}
            >
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 pointer-events-none">Drop here to ungroup task</span>
            </div>
            </div>
        </div>
    );
};

export default TaskSidebar;
