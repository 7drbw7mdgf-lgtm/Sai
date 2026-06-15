import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProjectData, Task, Person, Priority, Group, CustomField, Assignment } from '../types';
import { PRIORITY_COLORS, PRIORITY_ORDER, TASK_COLORS } from '../constants';
import Tooltip from './Tooltip';
import DatePicker from './DatePicker';
import { TrashIcon } from './icons/TrashIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { CheckCircleIcon, CheckCircleIconSolid } from './icons/CheckCircleIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { FlagIcon } from './icons/FlagIcon';
import { FolderIcon } from './icons/FolderIcon';
import { LinkIcon } from './icons/LinkIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ChevronDownIcon } from './icons/ChevronIcons';
import { ChartPieIcon } from './icons/ChartPieIcon';
import { TagIcon } from './icons/TagIcon';
import TagInput from './TagInput';
import PillAccordion from './PillAccordion';
import { PlusIcon } from './icons/PlusIcon';
import { PaintBrushIcon } from './icons/PaintBrushIcon';
import ColorSwatchPicker from './ColorSwatchPicker';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import MarkdownRenderer from './MarkdownRenderer';

interface TaskDetailPanelProps {
    taskId: string;
    projectData: ProjectData;
    // FIX: Correctly type `onSetData` to handle nullable project data state.
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    onClose: () => void;
    onDelete: (taskId: string) => void;
    onDeleteAssignment: (assignmentId: string) => void;
    isOpen: boolean;
    // FIX: Corrected typo 'postquisite' to 'postrequisite'
    onStartLinking?: (type: 'prerequisite' | 'postrequisite') => void;
    onRemoveDependency?: (sourceId: string, targetId: string) => void;
}

const PriorityEditor: React.FC<{
    selected?: Priority;
    onSelect: (priority?: Priority) => void;
}> = ({ selected, onSelect }) => (
    <div className="grid grid-cols-2 gap-2 p-2">
        {Object.values(Priority).sort((a,b) => PRIORITY_ORDER[b] - PRIORITY_ORDER[a]).map(p => (
            <button
              key={p}
              onClick={() => onSelect(p)}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-all border-2 flex items-center justify-center gap-2"
              style={{
                  backgroundColor: selected === p ? PRIORITY_COLORS[p] : '#f3f4f6',
                  color: selected === p ? 'white' : '#374151',
                  borderColor: selected === p ? PRIORITY_COLORS[p] : 'transparent',
              }}
            >
              {p}
            </button>
        ))}
    </div>
);


const AssigneeEditor: React.FC<{people: Person[], assignedTo: string[], onToggle: (personId: string) => void}> = ({ people, assignedTo, onToggle }) => {
    return (
        <div className="w-full max-h-64 overflow-y-auto p-1">
            {people.map(person => (
                <div key={person.id} onClick={() => onToggle(person.id)} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <input type="checkbox" checked={assignedTo.includes(person.id)} readOnly className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                    <img src={person.avatarUrl} alt={person.name} className="w-7 h-7 rounded-full" />
                    <span className="text-sm font-medium text-gray-700">{person.name}</span>
                </div>
            ))}
            {people.length === 0 && <span className="text-xs text-gray-400 p-2">No people in this project.</span>}
        </div>
    );
}

const MetadataRow: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode, className?: string}> = 
    ({ icon, label, children, className=""}) => (
    <div className={`w-full flex items-center group py-2 px-3 -mx-3 rounded-lg text-left ${className}`}>
        <div className="w-32 flex-shrink-0 flex items-center gap-3 text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
            {icon}
            <span>{label}</span>
        </div>
        <div className="flex-1 text-sm font-semibold text-gray-800 truncate flex items-center justify-between">
            {children}
        </div>
    </div>
);


const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ taskId, projectData, onSetData, onClose, onDelete, onDeleteAssignment, isOpen, onStartLinking, onRemoveDependency }) => {
    const task = useMemo(() => projectData.tasks.find(t => t.id === taskId), [taskId, projectData.tasks]);
    const { people, groups, tasks, meetings, assignments = [], customFields = [], notes: allNotes } = projectData;

    const [isAssigneeEditorOpen, setIsAssigneeEditorOpen] = useState(false);
    const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
    const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
    const [isPriorityEditorOpen, setIsPriorityEditorOpen] = useState(false);
    const [isGroupEditorOpen, setIsGroupEditorOpen] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);


    const assigneeEditorRef = useRef(null);
    const priorityEditorRef = useRef(null);
    const groupEditorRef = useRef(null);
    const colorPickerRef = useRef(null);

    useOnClickOutside(assigneeEditorRef, () => setIsAssigneeEditorOpen(false));
    useOnClickOutside(priorityEditorRef, () => setIsPriorityEditorOpen(false));
    useOnClickOutside(groupEditorRef, () => setIsGroupEditorOpen(false));
    useOnClickOutside(colorPickerRef, () => setIsColorPickerOpen(false));

    const [newAssignmentName, setNewAssignmentName] = useState('');
    const [newAssignmentStartDate, setNewAssignmentStartDate] = useState(new Date());
    const [newAssignmentEndDate, setNewAssignmentEndDate] = useState(new Date());
    const [newAssignmentStartTime, setNewAssignmentStartTime] = useState('09:00');
    const [newAssignmentEndTime, setNewAssignmentEndTime] = useState('10:00');
    const [newAssignmentAssignees, setNewAssignmentAssignees] = useState<string[]>([]);
    
    const [isAssignmentAssigneePickerOpen, setIsAssignmentAssigneePickerOpen] = useState(false);
    const assignmentAssigneePickerRef = useRef(null);
    useOnClickOutside(assignmentAssigneePickerRef, () => setIsAssignmentAssigneePickerOpen(false));

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (e.key === 'Escape') {
                if(target.closest('[contenteditable]') || target.tagName === 'TEXTAREA') return;
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    
    if (!task) return null;
    
    useEffect(() => {
        setNewAssignmentStartDate(task.startDate);
        setNewAssignmentEndDate(task.startDate);
    }, [task.startDate]);
    
    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
            onDelete(taskId);
        }
    };

    const updateTask = (updates: Partial<Task>) => {
        onSetData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
            }
        });
    };
    
    const handleStartDateChange = (newStartDate: Date) => {
        if (newStartDate > task.endDate) {
            updateTask({ startDate: newStartDate, endDate: newStartDate });
        } else {
            updateTask({ startDate: newStartDate });
        }
        setIsStartDatePickerOpen(false);
    };

    const handleEndDateChange = (newEndDate: Date) => {
        updateTask({ endDate: newEndDate });
        setIsEndDatePickerOpen(false);
    };

    const toggleCompletion = () => {
        updateTask({ completion: task.completion === 100 ? 0 : 100 });
    }
    
    const handleAssignmentChange = (assignmentId: string, updates: Partial<Assignment>) => {
        onSetData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                assignments: (prev.assignments || []).map(j => j.id === assignmentId ? {...j, ...updates} : j)
            }
        });
    }

    const handleAddAssignment = () => {
        if(!newAssignmentName.trim()) return;
        const newAssignment: Assignment = {
            id: `a-${Date.now()}`,
            name: newAssignmentName.trim(),
            taskId: task.id,
            startDate: newAssignmentStartDate,
            endDate: newAssignmentEndDate,
            startTime: newAssignmentStartTime,
            endTime: newAssignmentEndTime,
            assignedTo: newAssignmentAssignees,
            completed: false
        };
        onSetData(prev => {
            if (!prev) return null;
            return { ...prev, assignments: [...(prev.assignments || []), newAssignment]}
        });
        setNewAssignmentName('');
        setNewAssignmentAssignees([]);
    }

    const handleCustomFieldChange = (fieldId: string, value: any) => {
        const newValues = { ...(task.customFieldValues || {}), [fieldId]: value };
        updateTask({ customFieldValues: newValues });
    }

    const prerequisites = tasks.filter(t => task.dependencies?.includes(t.id));
    const postrequisites = tasks.filter(t => t.dependencies?.includes(task.id));
    const taskAssignments = assignments.filter(j => j.taskId === task.id).sort((a,b) => a.startDate.getTime() - b.startDate.getTime());

    const assignedPeople = people.filter(p => task.assignedTo.includes(p.id));
    
    const toggleNewAssignmentAssignee = (personId: string) => {
        setNewAssignmentAssignees(prev =>
            prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
        );
    }

    return (
        <div
            onClick={e => e.stopPropagation()}
            className="h-full bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col w-full animate-slide-in-right"
            aria-modal="true"
            role="dialog"
            aria-labelledby="task-detail-title"
        >
            <header className="flex-shrink-0 px-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center gap-4 h-16">
                <button
                    onClick={toggleCompletion}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${task.completion === 100 ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 hover:bg-green-200' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                    {task.completion === 100 ? <CheckCircleIconSolid className="w-5 h-5"/> : <CheckCircleIcon className="w-5 h-5"/>}
                    {task.completion === 100 ? 'Completed' : 'Mark Complete'}
                </button>
                <div className="flex-grow"></div>
                <div className="flex items-center gap-1">
                    <Tooltip text="Delete Task">
                        <button onClick={handleDelete} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </Tooltip>
                    <Tooltip text="Close (Esc)">
                        <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <XCircleIcon className="w-6 h-6"/>
                        </button>
                    </Tooltip>
                </div>
            </header>

            <div className="flex-grow p-6 overflow-y-auto space-y-6">
                <input 
                    id="task-detail-title"
                    type="text" 
                    value={task.name}
                    onChange={e => updateTask({ name: e.target.value })}
                    onBlur={() => updateTask({ name: task.name.trim() })}
                    placeholder="Task Name"
                    className="text-2xl font-bold text-gray-800 dark:text-gray-100 bg-transparent focus:outline-none w-full border-b-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 -ml-1 p-1 transition-colors"
                />

                <div className="space-y-1">
                    <MetadataRow icon={<UserCircleIcon className="w-5 h-5"/>} label="Assignees">
                        <div className="relative" ref={assigneeEditorRef}>
                            <button onClick={() => setIsAssigneeEditorOpen(o => !o)} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 -m-1 rounded-md">
                                {assignedPeople.length > 0 ? (
                                    <div className="flex items-center -space-x-2">
                                        {assignedPeople.slice(0, 4).map(p => (
                                            <img key={p.id} src={p.avatarUrl} alt={p.name} className="w-7 h-7 rounded-full border-2 border-gray-50 dark:border-gray-800"/>
                                        ))}
                                        {assignedPeople.length > 4 && <div className="w-7 h-7 text-xs rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center border-2 border-gray-50 dark:border-gray-800">+{assignedPeople.length - 4}</div>}
                                    </div>
                                ) : (
                                    <span className="text-gray-400 dark:text-gray-500 font-medium">Unassigned</span>
                                )}
                            </button>
                            {isAssigneeEditorOpen && (
                                <div className="absolute top-full mt-1 w-64 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
                                    <AssigneeEditor 
                                        people={people} 
                                        assignedTo={task.assignedTo} 
                                        onToggle={personId => {
                                            const newAssigned = task.assignedTo.includes(personId)
                                                ? task.assignedTo.filter(id => id !== personId)
                                                : [...task.assignedTo, personId];
                                            updateTask({ assignedTo: newAssigned });
                                        }} 
                                    />
                                </div>
                            )}
                        </div>
                    </MetadataRow>
                    
                     <MetadataRow icon={<CalendarDaysIcon className="w-5 h-5"/>} label="Start date">
                         <div className="relative">
                            <button onClick={() => setIsStartDatePickerOpen(o => !o)} className="hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 -m-1 rounded-md">
                                {task.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </button>
                             {isStartDatePickerOpen && <DatePicker selectedDate={task.startDate} onChange={handleStartDateChange} onClose={() => setIsStartDatePickerOpen(false)} />}
                        </div>
                    </MetadataRow>
                    
                    <MetadataRow icon={<div className="w-5 h-5" />} label="Due date">
                         <div className="relative">
                            <button onClick={() => setIsEndDatePickerOpen(o => !o)} className="hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 -m-1 rounded-md">
                                {task.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </button>
                             {isEndDatePickerOpen && <DatePicker selectedDate={task.endDate} onChange={handleEndDateChange} minDate={task.startDate} onClose={() => setIsEndDatePickerOpen(false)} />}
                        </div>
                    </MetadataRow>

                    <MetadataRow icon={<TagIcon className="w-5 h-5" />} label="Tags">
                        <div className="flex-1 -my-1">
                            <TagInput tags={task.tags || []} onChange={(tags) => updateTask({ tags })} />
                        </div>
                    </MetadataRow>
                    
                    <MetadataRow icon={<FlagIcon className="w-5 h-5" />} label="Priority">
                        <div className="relative" ref={priorityEditorRef}>
                            <button onClick={() => setIsPriorityEditorOpen(o => !o)} className="hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 -m-1 rounded-md w-full text-left">
                                {task.priority ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: PRIORITY_COLORS[task.priority]}}></div>
                                        {task.priority}
                                    </span>
                                ) : <span className="text-gray-400 dark:text-gray-500 font-medium">Not set</span>}
                            </button>
                            {isPriorityEditorOpen && (
                                <div className="absolute top-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
                                    <PriorityEditor selected={task.priority} onSelect={(p) => { updateTask({ priority: p }); setIsPriorityEditorOpen(false); }} />
                                </div>
                            )}
                        </div>
                    </MetadataRow>
                    
                    <MetadataRow icon={<FolderIcon className="w-5 h-5" />} label="Group">
                        <div className="relative" ref={groupEditorRef}>
                            <button onClick={() => setIsGroupEditorOpen(o => !o)} className="hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 -m-1 rounded-md w-full text-left">
                                {task.groupId ? (groups.find(g => g.id === task.groupId)?.name || 'N/A') : <span className="text-gray-400 dark:text-gray-500 font-medium">Ungrouped</span>}
                            </button>
                            {isGroupEditorOpen && (
                                <div className="absolute top-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 w-48 max-h-48 overflow-auto">
                                    <div className="w-full p-1">
                                        <button onClick={() => { updateTask({ groupId: undefined }); setIsGroupEditorOpen(false); }} className="w-full text-left p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 text-sm font-medium text-gray-500 dark:text-gray-300">Ungrouped</button>
                                        <div className="h-px bg-gray-200 dark:bg-gray-600 my-1"/>
                                        {groups.map(g => (
                                            <button
                                                key={g.id}
                                                onClick={() => { updateTask({ groupId: g.id }); setIsGroupEditorOpen(false); }}
                                                className={`w-full text-left p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 text-sm font-medium ${task.groupId === g.id ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-700 dark:text-gray-200'}`}
                                            >
                                                {g.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </MetadataRow>
                    <MetadataRow icon={<PaintBrushIcon className="w-5 h-5"/>} label="Color">
                         <div className="relative" ref={colorPickerRef}>
                             <button onClick={() => setIsColorPickerOpen(o => !o)} className="w-6 h-6 rounded-full hover:scale-110 transition-transform" style={{backgroundColor: task.color}}></button>
                            {isColorPickerOpen && (
                                <div className="absolute top-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
                                    <ColorSwatchPicker
                                        selectedColor={task.color}
                                        onSelectColor={(color) => updateTask({ color })}
                                    />
                                </div>
                            )}
                        </div>
                    </MetadataRow>
                </div>
                
                <div className="space-y-1">
                    <div className="w-full flex items-center group py-2 px-3 -mx-3 rounded-lg">
                        <div className="w-32 flex-shrink-0 flex items-center gap-3 text-sm font-medium text-gray-500">
                           <ChartPieIcon className="w-5 h-5"/>
                           <span>Progress</span>
                        </div>
                        <div className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-100 truncate flex items-center gap-4">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={task.completion}
                                onChange={(e) => updateTask({ completion: parseInt(e.target.value, 10) })}
                                className="styled-slider flex-1"
                                style={{'--progress-color': task.color} as React.CSSProperties}
                            />
                            <span className="w-10 text-right">{task.completion}%</span>
                        </div>
                    </div>
                </div>

                <PillAccordion title="Assignments" defaultOpen>
                    <div className="space-y-2 p-1">
                        {taskAssignments.map(assignment => (
                             <div key={assignment.id} className="group flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg hover:bg-gray-100/70 dark:hover:bg-gray-700/50">
                                <button onClick={() => handleAssignmentChange(assignment.id, { completed: !assignment.completed })}>
                                    {assignment.completed ? <CheckCircleIconSolid className="w-5 h-5 text-green-500 dark:text-green-400"/> : <CheckCircleIcon className="w-5 h-5 text-gray-400 dark:text-gray-500"/>}
                                </button>
                                <span className={`flex-1 ${assignment.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>{assignment.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{assignment.startDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>
                                <button onClick={() => onDeleteAssignment(assignment.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        ))}
                        <div className="pt-2 border-t border-gray-200/80 dark:border-gray-700/80 space-y-2">
                            <input type="text" value={newAssignmentName} onChange={e => setNewAssignmentName(e.target.value)} placeholder="Add a new assignment..." className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm"/>
                            <div className="grid grid-cols-2 gap-2">
                                <DatePicker selectedDate={newAssignmentStartDate} onChange={setNewAssignmentStartDate} minDate={task.startDate} maxDate={task.endDate} onClose={() => {}} />
                                <DatePicker selectedDate={newAssignmentEndDate} onChange={setNewAssignmentEndDate} minDate={newAssignmentStartDate} maxDate={task.endDate} onClose={() => {}} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="time" value={newAssignmentStartTime} onChange={e => setNewAssignmentStartTime(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm"/>
                                <input type="time" value={newAssignmentEndTime} onChange={e => setNewAssignmentEndTime(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm"/>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1" ref={assignmentAssigneePickerRef}>
                                    <button onClick={() => setIsAssignmentAssigneePickerOpen(o => !o)} className="w-full text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm flex justify-between items-center">
                                        <span className={newAssignmentAssignees.length === 0 ? "text-gray-400" : ""}>{newAssignmentAssignees.length > 0 ? `${newAssignmentAssignees.length} people selected` : "Assign people..."}</span>
                                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                    </button>
                                    {isAssignmentAssigneePickerOpen &&
                                        <div className="absolute bottom-full mb-1 w-full z-10 bg-white dark:bg-gray-700 shadow-lg border rounded-md p-1 max-h-48 overflow-y-auto">
                                             <AssigneeEditor people={people} assignedTo={newAssignmentAssignees} onToggle={toggleNewAssignmentAssignee} />
                                        </div>
                                    }
                                </div>
                                <button onClick={handleAddAssignment} disabled={!newAssignmentName.trim()} className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300">
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </PillAccordion>

                {customFields.length > 0 && (
                    <PillAccordion title="Custom Fields">
                        <div className="space-y-3 px-1 pt-2">
                            {customFields.map(field => (
                                <div key={field.id} className="grid grid-cols-3 items-center">
                                    <label className="text-sm font-medium text-gray-500 col-span-1">{field.name}</label>
                                    <div className="col-span-2">
                                        {field.type === 'Text' && <input type="text" value={task.customFieldValues?.[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm" />}
                                        {field.type === 'Number' && <input type="number" value={task.customFieldValues?.[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.valueAsNumber)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm" />}
                                        {field.type === 'Select' && (
                                            <select value={task.customFieldValues?.[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm">
                                                <option value="">Select...</option>
                                                {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        )}
                                        {field.type === 'Date' && <input type="date" value={task.customFieldValues?.[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </PillAccordion>
                )}


                <div className="space-y-3">
                     <h3 className="text-sm font-semibold text-gray-500 px-3">Dependencies</h3>
                     {(onStartLinking || onRemoveDependency) && (
                        <div className="flex items-center gap-2 px-3">
                            <button onClick={() => onStartLinking?.('prerequisite')} className="flex-1 flex items-center justify-center gap-2 text-sm p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-800 rounded-lg transition-colors">
                                <LinkIcon className="w-4 h-4"/> Add Prerequisite
                            </button>
                             <button onClick={() => onStartLinking?.('postrequisite')} className="flex-1 flex items-center justify-center gap-2 text-sm p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-800 rounded-lg transition-colors">
                                <LinkIcon className="w-4 h-4 rotate-180"/> Add Postrequisite
                            </button>
                        </div>
                     )}

                    {prerequisites.length > 0 && <div className="text-xs font-semibold text-gray-400 uppercase pt-2 pl-2">Blocks this task</div>}
                    {prerequisites.map(dep => (
                        <div key={dep.id} className="group flex items-center justify-between text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">
                            <span className="font-medium text-gray-700 dark:text-gray-200">{dep.name}</span>
                            {onRemoveDependency && <button onClick={() => onRemoveDependency(dep.id, task.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                                <XCircleIcon className="w-4 h-4"/>
                            </button>}
                        </div>
                    ))}

                    {postrequisites.length > 0 && <div className="text-xs font-semibold text-gray-400 uppercase pt-2 pl-2">Blocked by this task</div>}
                    {postrequisites.map(dep => (
                        <div key={dep.id} className="group flex items-center justify-between text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">
                            <span className="font-medium text-gray-700 dark:text-gray-200">{dep.name}</span>
                            {onRemoveDependency && <button onClick={() => onRemoveDependency(task.id, dep.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                                <XCircleIcon className="w-4 h-4"/>
                            </button>}
                        </div>
                    ))}
                </div>

                <PillAccordion title={<><DocumentTextIcon className="w-5 h-5 text-gray-500" /><span className="font-semibold">Notes</span></>} defaultOpen>
                    <div className="p-1">
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={() => setIsEditingNotes(e => !e)}
                                className="px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"
                            >
                                {isEditingNotes ? 'Preview' : 'Edit'}
                            </button>
                        </div>
                        <div className="min-h-[200px] bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            {isEditingNotes ? (
                                <textarea
                                    value={task.notes || ''}
                                    onChange={e => updateTask({ notes: e.target.value })}
                                    placeholder="Add notes in Markdown..."
                                    className="w-full h-full min-h-[200px] p-3 text-sm rounded-lg bg-transparent focus:outline-none resize-none"
                                />
                            ) : (
                                <MarkdownRenderer
                                    content={task.notes || '*No notes yet.*'}
                                    notes={allNotes}
                                    tasks={tasks}
                                    people={people}
                                    onNoteLinkClick={() => {}}
                                    onTaskLinkClick={() => {}}
                                />
                            )}
                        </div>
                    </div>
                </PillAccordion>
            </div>
        </div>
    );
};

export default TaskDetailPanel;