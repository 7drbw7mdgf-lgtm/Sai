
import React from 'react';
import { Task, Person, ProjectData, Group, Priority, Assignment } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { FolderPlusIcon } from './icons/FolderPlusIcon';
import Tooltip from './Tooltip';
import { ChevronRightIcon } from './icons/ChevronIcons';
import { PRIORITY_COLORS } from '../constants';
import { CheckCircleIcon, CheckCircleIconSolid } from './icons/CheckCircleIcon';

type DisplayItem = 
    | { type: 'task'; data: Task; hasAssignments: boolean } 
    | { type: 'group'; data: Group }
    | { type: 'assignment'; data: Assignment };

interface TaskSidebarProps {
    width: number;
    projectData: ProjectData;
    scrollRef: React.RefObject<HTMLDivElement>;
    onSelectTask: (taskId: string) => void;
    onEditTask: (taskId: string) => void;
    selectedTaskId: string | null;
    displayItems: DisplayItem[];
    rowHeight: number;
    groupRowHeight: number;
    assignmentRowHeight: number;
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
    displayItems, 
    rowHeight, 
    groupRowHeight,
    assignmentRowHeight,
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
        <div style={{ width: `${width}px` }} className="flex-shrink-0 bg-gray-50/90 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full backdrop-blur-sm">
             <div className="flex justify-between items-center px-4 py-2 flex-shrink-0 h-[57px] border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project Tasks</h2>
                <div className="flex items-center gap-1">
                    <Tooltip text="Add Group">
                        <button onClick={onAddGroup} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                            <FolderPlusIcon className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip text="Add Task">
                        <button onClick={onAddTask} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    </Tooltip>
                </div>
            </div>
            <div ref={scrollRef} className="flex-grow overflow-y-hidden overflow-x-hidden bg-white dark:bg-gray-900">
                <div className="w-full">
                    {displayItems.map((item) => {
                        if (item.type === 'group') {
                            const group = item.data;
                            const isCollapsed = collapsedGroups.has(group.id);
                            return (
                                <div
                                    key={`group-${group.id}`}
                                    onClick={() => onToggleGroup(group.id)}
                                    className={`flex items-center group cursor-pointer bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ${dragOverGroupId === group.id ? 'bg-blue-50 ring-2 ring-blue-200 z-10' : ''}`}
                                    style={{ height: `${groupRowHeight}px` }}
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
                                    <div className="px-3 text-gray-400">
                                        <ChevronRightIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${!isCollapsed ? 'rotate-90' : ''}`} />
                                    </div>
                                    <div className="flex-1 w-0 truncate text-sm">{group.name}</div>
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
                                    className="flex items-center group cursor-pointer border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    style={{ height: `${assignmentRowHeight}px`, paddingLeft: '3.5rem' }}
                                >
                                    {assignment.completed ? <CheckCircleIconSolid className="w-3.5 h-3.5 text-green-500 mr-3 flex-shrink-0" /> : <CheckCircleIcon className="w-3.5 h-3.5 text-gray-300 mr-3 flex-shrink-0" />}
                                    <div className="flex-1 w-0 truncate text-sm text-gray-600 dark:text-gray-400 font-medium">{assignment.name}</div>
                                    <div className="flex items-center gap-4 pr-4">
                                        <div className="flex items-center -space-x-2">
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
                                className={`flex items-center group cursor-pointer border-b border-gray-50 dark:border-gray-800 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}
                                style={{ height: `${rowHeight}px`}}
                            >
                                <div className={`w-1 h-full transition-colors ${isSelected ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                <div className="flex items-center w-full" style={{ paddingLeft: task.groupId ? '1.5rem' : '0.5rem' }}>
                                    {item.hasAssignments ? (
                                        <div className="px-1 text-gray-400 hover:text-gray-600 cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleTaskExpansion(task.id); }}>
                                            <ChevronRightIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedTasks.has(task.id) ? 'rotate-90' : ''}`} />
                                        </div>
                                    ) : (
                                        <div className="w-6"/>
                                    )}
                                   <div className="w-1 h-8 relative rounded-full mr-3 flex-shrink-0" style={{backgroundColor: `${task.color}40`}}>
                                        <div className="absolute bottom-0 left-0 right-0 transition-all duration-300 rounded-full" style={{ height: `${task.completion}%`, backgroundColor: task.color }}></div>
                                   </div>
                                   <div className="flex-1 flex flex-col justify-center px-1 h-full w-0 py-1.5">
                                        <p className="font-medium truncate text-sm text-gray-800 dark:text-gray-200">{task.name}</p>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <div className="flex items-center -space-x-1.5">
                                                {assignedPeople.map(p => (
                                                    <Tooltip key={p.id} text={p.name}>
                                                    <img src={p.avatarUrl} alt={p.name} className="w-5 h-5 rounded-full border border-white dark:border-gray-800"/>
                                                    </Tooltip>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                                <span>
                                                    {task.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                                {task.priority && (
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} title={task.priority}/>
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
                className={`m-3 mt-auto p-3 text-center border-2 border-dashed rounded-xl transition-colors duration-200 ${
                    dragOverGroupId === 'ungrouped'
                        ? 'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-600'
                        : 'border-gray-200 dark:border-gray-700'
                }`}
            >
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 pointer-events-none">Drop here to ungroup task</span>
            </div>
        </div>
    );
};

export default TaskSidebar;
