
import React, { useMemo, useState, useRef } from 'react';
import { Task, Person, ProjectData, Priority, Group, CustomField, Assignment } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { PRIORITY_ORDER, PRIORITY_COLORS } from '../constants';
import Tooltip from './Tooltip';
import { ChevronDownIcon, ChevronUpIcon, ChevronRightIcon } from './icons/ChevronIcons';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import TableCustomizationHub from './TableCustomizationHub';
import { AdjustmentsHorizontalIcon } from './icons/AdjustmentsHorizontalIcon';
import { CheckCircleIcon, CheckCircleIconSolid } from './icons/CheckCircleIcon';

type SortableListKey = 'name' | 'assignees' | 'startDate' | 'endDate' | 'priority' | 'progress' | 'group' | 'tags' | string; // string for custom fields

interface TasksViewProps {
    projectData: ProjectData;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    onRequestEditTask: (taskId: string) => void;
}

const TasksView: React.FC<TasksViewProps> = ({ projectData, onSetData, onRequestEditTask }) => {
    const { tasks, people, groups, assignments = [], customFields = [] } = projectData;
    const [listSortConfig, setListSortConfig] = useState<{ key: SortableListKey; direction: 'ascending' | 'descending' }>({ key: 'priority', direction: 'descending' });
    const [visibleColumns, setVisibleColumns] = useState<SortableListKey[]>(['assignees', 'endDate', 'priority', 'progress', 'tags']);
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    const toggleTaskExpansion = (taskId: string) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };
    
    const assignmentsByTaskId = useMemo(() => {
        return assignments.reduce((acc, assignment) => {
            if (!acc[assignment.taskId]) acc[assignment.taskId] = [];
            acc[assignment.taskId].push(assignment);
            return acc;
        }, {} as Record<string, Assignment[]>);
    }, [assignments]);

    const requestListSort = (key: SortableListKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (listSortConfig && listSortConfig.key === key && listSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setListSortConfig({ key, direction });
    };
    
    const sortedTasksForList = useMemo(() => {
        const sortableItems = [...tasks];
        if (listSortConfig) {
            sortableItems.sort((a, b) => {
                let valA: any, valB: any;
                
                const customField = customFields.find(cf => cf.id === listSortConfig.key);

                if (customField) {
                    valA = a.customFieldValues?.[customField.id];
                    valB = b.customFieldValues?.[customField.id];
                    if (valA === undefined || valA === null) valA = customField.type === 'Text' ? 'zzzzzz' : -Infinity;
                    if (valB === undefined || valB === null) valB = customField.type === 'Text' ? 'zzzzzz' : -Infinity;
                } else {
                    switch (listSortConfig.key) {
                        case 'name':
                            valA = a.name.toLowerCase();
                            valB = b.name.toLowerCase();
                            break;
                        case 'assignees':
                            const aPerson = people.find(p => p.id === a.assignedTo[0]);
                            const bPerson = people.find(p => p.id === b.assignedTo[0]);
                            valA = a.assignedTo.length > 0 ? (aPerson?.name.toLowerCase() || '') : 'zzzzzz';
                            valB = b.assignedTo.length > 0 ? (bPerson?.name.toLowerCase() || '') : 'zzzzzz';
                            break;
                        case 'startDate':
                            valA = a.startDate.getTime();
                            valB = b.startDate.getTime();
                            break;
                        case 'endDate':
                            valA = a.endDate.getTime();
                            valB = b.endDate.getTime();
                            break;
                        case 'priority':
                            valA = PRIORITY_ORDER[a.priority!] || 0;
                            valB = PRIORITY_ORDER[b.priority!] || 0;
                            break;
                        case 'progress':
                            valA = a.completion;
                            valB = b.completion;
                            break;
                        case 'group':
                            valA = groups.find(g => g.id === a.groupId)?.name?.toLowerCase() || 'zzzz';
                            valB = groups.find(g => g.id === b.groupId)?.name?.toLowerCase() || 'zzzz';
                            break;
                        case 'tags':
                            valA = (a.tags || []).join(',').toLowerCase();
                            valB = (b.tags || []).join(',').toLowerCase();
                            break;
                        default:
                            valA = 0;
                            valB = 0;
                    }
                }

                if (valA < valB) {
                    return listSortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (valA > valB) {
                    return listSortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [tasks, people, groups, listSortConfig, customFields]);

    const UnsortedIcon = () => <ChevronDownIcon className="w-3 h-3 opacity-50" />;

    const SortIndicator: React.FC<{ sortKey: SortableListKey }> = ({ sortKey }) => (
         <span className={`transition-opacity text-gray-500 ${listSortConfig?.key === sortKey ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {listSortConfig?.key === sortKey ? (
                listSortConfig.direction === 'ascending' ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />
            ) : (
               <UnsortedIcon />
            )}
        </span>
    );

    const SortableHeader: React.FC<{ title: string; sortKey: SortableListKey; className?: string; }> = ({ title, sortKey, className = '' }) => (
        <th scope="col" className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${className}`}>
            <button onClick={() => requestListSort(sortKey)} className="flex items-center gap-1.5 group focus:outline-none w-full">
                <span>{title}</span>
                <SortIndicator sortKey={sortKey} />
            </button>
        </th>
    );

    const columnDefs: Record<SortableListKey, { title: string; render: (task: Task, hasAssignments?: boolean, isExpanded?: boolean) => React.ReactNode, className?: string }> = {
        name: { title: "Task Name", render: (task, hasAssignments, isExpanded) => (
            <div className="flex items-center">
                 {hasAssignments ? (
                    <button className="p-1 -ml-1 text-gray-400 hover:text-gray-600 transition-colors" onClick={(e) => {e.stopPropagation(); toggleTaskExpansion(task.id); }}>
                        <ChevronRightIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                ) : (
                    <div className="w-6"/>
                )}
                <div className="w-1.5 h-1.5 rounded-full mr-3 flex-shrink-0" style={{backgroundColor: task.color}}></div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{task.name}</div>
            </div>
        )},
        assignees: { title: 'Assignees', render: task => {
            const assignedPeople = people.filter(p => task.assignedTo.includes(p.id));
            return <div className="flex items-center -space-x-2">
                {assignedPeople.map(p => (
                    <Tooltip key={p.id} text={p.name}>
                        <img src={p.avatarUrl} alt={p.name} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"/>
                    </Tooltip>
                ))}
            </div>
        }},
        startDate: { title: 'Start Date', render: task => <span className="text-gray-600 dark:text-gray-400 font-medium">{new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> },
        endDate: { title: 'Due Date', render: task => <span className="text-gray-600 dark:text-gray-400 font-medium">{new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> },
        group: { title: 'Group', render: task => <span className="text-gray-500 dark:text-gray-400">{groups.find(g => g.id === task.groupId)?.name || '-'}</span> },
        priority: { title: 'Priority', render: task => (
            task.priority && <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-md" style={{ backgroundColor: `${PRIORITY_COLORS[task.priority]}20`, color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
        )},
        progress: { title: 'Progress', render: task => (
            <div className="flex items-center gap-2 w-24">
                <div className="flex-grow bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all duration-500" style={{width: `${task.completion}%`, backgroundColor: task.color}}></div>
                </div>
            </div>
        )},
        tags: { title: 'Tags', render: task => (
            <div className="flex flex-wrap gap-1">
                {(task.tags || []).map(tag => <span key={tag} className="text-gray-500 dark:text-gray-400 text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/50 rounded-md">#{tag}</span>)}
            </div>
        ), className: 'min-w-[150px]'},
    };
    
    customFields.forEach(cf => {
        columnDefs[cf.id] = {
            title: cf.name,
            render: (task: Task) => {
                const value = task.customFieldValues?.[cf.id];
                if (value === undefined || value === null) return <span className="text-gray-300">-</span>;
                if (cf.type === 'Date' && typeof value === 'string') {
                    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
                return value.toString();
            },
            className: 'min-w-[120px]'
        };
    });

    const allPossibleColumns: {id: SortableListKey, title: string}[] = [
        ...Object.keys(columnDefs)
                 .filter(c => c !== 'name' && !customFields.some(cf => cf.id === c))
                 .map(id => ({ id, title: columnDefs[id].title })),
        ...customFields.map(cf => ({ id: cf.id, title: cf.name }))
    ];
    
    const handleSaveCustomization = ({ fields, visible }: { fields: CustomField[], visible: string[] }) => {
        const deletedFieldIds = (projectData.customFields || [])
            .filter(oldField => !fields.some(newField => newField.id === oldField.id))
            .map(f => f.id);

        onSetData(prev => {
            if (!prev) return null;

            const updatedTasks = prev.tasks.map(task => {
                if (!task.customFieldValues || deletedFieldIds.length === 0) {
                    return task;
                }
                const newValues = { ...task.customFieldValues };
                deletedFieldIds.forEach(fieldId => {
                    delete newValues[fieldId];
                });
                return { ...task, customFieldValues: newValues };
            });

            return {
                ...prev,
                customFields: fields,
                tasks: updatedTasks,
            };
        });
        
        setVisibleColumns(visible);
    }

    if (tasks.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 h-full">
                <div className="text-center text-gray-400">
                    <PlusIcon className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2 text-lg font-medium">No tasks yet.</p>
                    <p className="text-sm">Add a task to get started.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex h-full bg-white dark:bg-gray-900">
            <div className="flex-1 flex flex-col relative">
                 <header className="flex-shrink-0 h-12 flex justify-end items-center px-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                     <div className="flex items-center gap-2">
                        <Tooltip text="Customize columns">
                            <button onClick={() => setIsCustomizeModalOpen(true)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                                <AdjustmentsHorizontalIcon className="w-5 h-5"/>
                            </button>
                        </Tooltip>
                     </div>
                </header>

                <main className="flex-1 overflow-auto">
                    <div className="">
                        <table className="min-w-full text-left border-separate border-spacing-0">
                            <thead className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-20">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 sticky left-0 bg-white/95 dark:bg-gray-900/95 z-30 w-[35%] min-w-[300px]">
                                        <button onClick={() => requestListSort('name')} className="flex items-center gap-1.5 group focus:outline-none w-full">
                                            <span>Task Name</span>
                                            <SortIndicator sortKey="name" />
                                        </button>
                                    </th>
                                    {visibleColumns.map(colId => (
                                        <SortableHeader 
                                            key={colId} 
                                            title={columnDefs[colId]?.title || ''} 
                                            sortKey={colId} 
                                            className={`${columnDefs[colId]?.className} border-b border-gray-200 dark:border-gray-700`}
                                        />
                                    ))}
                                    <th scope="col" className="px-2 py-3 border-b border-gray-200 dark:border-gray-700 w-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {sortedTasksForList.map(task => {
                                    const taskAssignments = (assignmentsByTaskId[task.id] || []).sort((a,b) => a.startDate.getTime() - b.startDate.getTime());
                                    const isExpanded = expandedTasks.has(task.id);
                                    
                                    return (
                                        <React.Fragment key={task.id}>
                                            <tr 
                                                onDoubleClick={() => onRequestEditTask(task.id)} 
                                                className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-4 py-2.5 whitespace-nowrap text-sm sticky left-0 bg-white dark:bg-gray-900 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 z-10 transition-colors">
                                                    {columnDefs.name.render(task, taskAssignments.length > 0, isExpanded)}
                                                </td>
                                                {visibleColumns.map(colId => <td key={colId} className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-500">{columnDefs[colId]?.render(task)}</td>)}
                                                <td className="px-2 py-2.5"></td>
                                            </tr>
                                            {isExpanded && taskAssignments.map(assignment => (
                                                <tr key={assignment.id} onDoubleClick={() => onRequestEditTask(assignment.taskId)} className="bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 sticky left-0 bg-gray-50/50 dark:bg-gray-800/30 z-10">
                                                        <div className="flex items-center pl-10">
                                                            <div className="w-px h-full bg-gray-200 absolute left-8 top-0 bottom-0"></div>
                                                            {assignment.completed ? <CheckCircleIconSolid className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> : <CheckCircleIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />}
                                                            <span className={`text-gray-600 dark:text-gray-300 truncate ${assignment.completed ? 'line-through opacity-70' : ''}`}>{assignment.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(assignment.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</td>
                                                    {/* Render empty cells for other columns */}
                                                    {visibleColumns.slice(1).map(colId => <td key={colId} className="px-4 py-2"></td>)}
                                                    <td className="px-2 py-2"></td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
            {isCustomizeModalOpen && (
                 <TableCustomizationHub
                    isOpen={isCustomizeModalOpen}
                    onClose={() => setIsCustomizeModalOpen(false)}
                    customFields={customFields}
                    visibleColumns={visibleColumns}
                    allPossibleColumns={allPossibleColumns}
                    onSave={handleSaveCustomization}
                />
            )}
        </div>
    );
};

export default TasksView;
