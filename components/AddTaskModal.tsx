

import React, { useState, useEffect } from 'react';
import { Task, Person, Priority, Group, CustomField } from '../types';
import { TASK_COLORS, PRIORITY_COLORS, PRIORITY_ORDER } from '../constants';
import DatePicker from './DatePicker';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { FolderIcon } from './icons/FolderIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { FlagIcon } from './icons/FlagIcon';
import { PaintBrushIcon } from './icons/PaintBrushIcon';
import Tooltip from './Tooltip';
import { XCircleIcon } from './icons/XCircleIcon';
import { ChevronDownIcon } from './icons/ChevronIcons';
import TagInput from './TagInput';
import { TagIcon } from './icons/TagIcon';
import ColorSwatchPicker from './ColorSwatchPicker';

const MetadataRow: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode, onClick?: () => void, className?: string, isOpen?: boolean}> = 
    ({ icon, label, children, onClick, className="", isOpen=false }) => (
    <div onClick={onClick} className={`w-full flex items-center group py-2.5 px-3 -mx-3 rounded-lg hover:bg-gray-100 transition-colors text-left ${onClick ? 'cursor-pointer' : ''} ${className}`}>
        <div className="w-32 flex-shrink-0 flex items-center gap-3 text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
            {icon}
            <span>{label}</span>
        </div>
        <div className="flex-1 text-sm font-semibold text-gray-800 truncate flex items-center justify-between">
            <div className="truncate">{children}</div>
            {onClick && <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
        </div>
    </div>
);

const InlineEditorWrapper: React.FC<{isOpen: boolean; children: React.ReactNode}> = ({ isOpen, children }) => (
    <div
        className="transition-all duration-350 ease-in-out overflow-hidden"
        style={{ maxHeight: isOpen ? '400px' : '0px' }}
    >
        <div className={`pt-2 pb-1 px-1 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-white/60 p-3 rounded-xl border border-gray-200/80 shadow-inner">
                {children}
            </div>
        </div>
    </div>
);

const PrioritySelector: React.FC<{ selected?: Priority; onSelect: (priority?: Priority) => void; }> = ({ selected, onSelect }) => (
    <div className="grid grid-cols-2 gap-2 p-1">
        {Object.values(Priority).sort((a,b) => PRIORITY_ORDER[b] - PRIORITY_ORDER[a]).map(p => (
            <button key={p} onClick={() => onSelect(p)} className="px-4 py-2 text-sm font-semibold rounded-lg transition-all border-2 flex items-center justify-center gap-2" style={{ backgroundColor: selected === p ? PRIORITY_COLORS[p] : '#f3f4f6', color: selected === p ? 'white' : '#374151', borderColor: selected === p ? PRIORITY_COLORS[p] : 'transparent' }}>
                {p}
            </button>
        ))}
    </div>
);

const AssigneeEditor: React.FC<{people: Person[], assignedTo: string[], onToggle: (personId: string) => void}> = ({ people, assignedTo, onToggle }) => (
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


interface AddTaskPanelProps {
    onClose: () => void;
    onSave: (newTask: Task) => void;
    people: Person[];
    groups: Group[];
    customFields: CustomField[];
    initialData?: Partial<Task>;
}

const AddTaskPanel: React.FC<AddTaskPanelProps> = ({ onClose, onSave, people, groups, customFields, initialData }) => {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [assignedTo, setAssignedTo] = useState<string[]>([]);
    const [groupId, setGroupId] = useState<string | undefined>(undefined);
    const [color, setColor] = useState(TASK_COLORS[0]);
    const [priority, setPriority] = useState<Priority | undefined>(Priority.Medium);
    const [tags, setTags] = useState<string[]>([]);
    const [customFieldValues, setCustomFieldValues] = useState<{ [fieldId: string]: any }>({});
    const [openEditor, setOpenEditor] = useState<string | null>(null);
    
    useEffect(() => {
        setName(initialData?.name || '');
        const start = initialData?.startDate || new Date();
        setStartDate(start);
        setEndDate(initialData?.endDate || start);
        setAssignedTo(initialData?.assignedTo || []);
        setGroupId(initialData?.groupId || undefined);
        setColor(initialData?.color || TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)]);
        setPriority(initialData?.priority || Priority.Medium);
        setTags(initialData?.tags || []);
        setCustomFieldValues(initialData?.customFieldValues || {});
    }, [initialData]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (openEditor) setOpenEditor(null);
                else onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, openEditor]);

    const handleStartDateChange = (date: Date) => {
        setStartDate(date);
        if (date > endDate) setEndDate(date);
    };

    const handleEndDateChange = (date: Date) => {
        if (date >= startDate) setEndDate(date);
    };
    
    const handleSave = () => {
        if (!name) { alert('Please fill in a task name.'); return; }
        onSave({ id: `t-${Date.now()}`, name, groupId, startDate, endDate, assignedTo, color, completion: 0, priority, notes: '', tags, customFieldValues });
    };
    
    const togglePerson = (personId: string) => {
        setAssignedTo(prev => prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]);
    };

    const handleToggleEditor = (editorName: string) => {
        setOpenEditor(prev => prev === editorName ? null : editorName);
    };

    const handleCustomFieldChange = (fieldId: string, value: any) => {
        setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const assignedPeople = people.filter(p => assignedTo.includes(p.id));

    return (
        <div className="h-full bg-gray-50 border-l border-gray-200 flex flex-col w-full animate-slide-in-right">
            <header className="flex-shrink-0 px-4 border-b border-gray-200 flex justify-between items-center h-16">
                <h2 className="text-xl font-bold text-gray-800">Add New Task</h2>
                <Tooltip text="Close (Esc)">
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                        <XCircleIcon className="w-6 h-6"/>
                    </button>
                </Tooltip>
            </header>
            
            <div className="flex-grow p-6 overflow-y-auto space-y-4">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Design homepage" className="text-2xl font-bold text-gray-800 bg-transparent focus:outline-none w-full border-b-2 border-transparent focus:border-blue-500 -ml-1 p-1 transition-colors"/>

                <div className="space-y-1">
                    <div>
                        <MetadataRow icon={<UserCircleIcon className="w-5 h-5"/>} label="Assignees" onClick={() => handleToggleEditor('assignee')} isOpen={openEditor === 'assignee'}>
                            <div className="flex items-center gap-2">
                                {assignedPeople.length > 0 ? (
                                    <div className="flex items-center -space-x-2">
                                        {assignedPeople.slice(0, 4).map(p => <img key={p.id} src={p.avatarUrl} alt={p.name} className="w-7 h-7 rounded-full border-2 border-gray-50"/>)}
                                        {assignedPeople.length > 4 && <div className="w-7 h-7 text-xs rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-50">+{assignedPeople.length - 4}</div>}
                                    </div>
                                ) : <span className="text-gray-400 font-medium">Unassigned</span>}
                            </div>
                        </MetadataRow>
                        <InlineEditorWrapper isOpen={openEditor === 'assignee'}>
                            <AssigneeEditor people={people} assignedTo={assignedTo} onToggle={togglePerson} />
                        </InlineEditorWrapper>
                    </div>
                    
                    <div>
                        <MetadataRow icon={<CalendarDaysIcon className="w-5 h-5"/>} label="Start date" onClick={() => handleToggleEditor('startDate')} isOpen={openEditor === 'startDate'}>
                            {startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </MetadataRow>
                        <InlineEditorWrapper isOpen={openEditor === 'startDate'}>
                            <DatePicker isInline selectedDate={startDate} onChange={handleStartDateChange} onClose={() => {}} />
                        </InlineEditorWrapper>
                    </div>

                    <div>
                        <MetadataRow icon={<div className="w-5 h-5" />} label="Due date" onClick={() => handleToggleEditor('endDate')} isOpen={openEditor === 'endDate'}>
                            {endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </MetadataRow>
                        <InlineEditorWrapper isOpen={openEditor === 'endDate'}>
                            <DatePicker isInline selectedDate={endDate} onChange={handleEndDateChange} minDate={startDate} onClose={() => {}} />
                        </InlineEditorWrapper>
                    </div>
                    
                    <div>
                        <MetadataRow icon={<TagIcon className="w-5 h-5" />} label="Tags">
                            <div className="flex-1 -my-1">
                                <TagInput tags={tags} onChange={setTags} />
                            </div>
                        </MetadataRow>
                    </div>

                    <div>
                        <MetadataRow icon={<FlagIcon className="w-5 h-5" />} label="Priority" onClick={() => handleToggleEditor('priority')} isOpen={openEditor === 'priority'}>
                            {priority ? <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor: PRIORITY_COLORS[priority]}}></div>{priority}</span> : <span className="text-gray-400 font-medium">Not set</span>}
                        </MetadataRow>
                        <InlineEditorWrapper isOpen={openEditor === 'priority'}>
                            <PrioritySelector selected={priority} onSelect={(p) => { setPriority(p); handleToggleEditor('priority'); }} />
                        </InlineEditorWrapper>
                    </div>

                    <div>
                        <MetadataRow icon={<FolderIcon className="w-5 h-5" />} label="Group" onClick={() => handleToggleEditor('group')} isOpen={openEditor === 'group'}>
                            {groupId ? (groups.find(g => g.id === groupId)?.name || 'N/A') : <span className="text-gray-400 font-medium">Ungrouped</span>}
                        </MetadataRow>
                        <InlineEditorWrapper isOpen={openEditor === 'group'}>
                            <div className="w-full p-1">
                                <button onClick={() => { setGroupId(undefined); handleToggleEditor('group'); }} className="w-full text-left p-2 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-500">Ungrouped</button>
                                <div className="h-px bg-gray-200 my-1"/>
                                {groups.map(g => <button key={g.id} onClick={() => { setGroupId(g.id); handleToggleEditor('group'); }} className={`w-full text-left p-2 rounded-md hover:bg-gray-100 text-sm font-medium ${groupId === g.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'}`}>{g.name}</button>)}
                            </div>
                        </InlineEditorWrapper>
                    </div>

                    <div>
                        <MetadataRow icon={<PaintBrushIcon className="w-5 h-5"/>} label="Color" onClick={() => handleToggleEditor('color')} isOpen={openEditor === 'color'}>
                            <div className="w-6 h-6 rounded-full" style={{backgroundColor: color}}></div>
                        </MetadataRow>
                        <InlineEditorWrapper isOpen={openEditor === 'color'}>
                            <ColorSwatchPicker selectedColor={color} onSelectColor={setColor} />
                        </InlineEditorWrapper>
                    </div>

                    {customFields.length > 0 && <div className="border-t border-gray-200 pt-3 mt-3 -mx-3"/>}
                     {customFields.map(field => (
                        <div key={field.id} className="w-full flex items-center py-1.5 px-3 -mx-3">
                             <div className="w-32 flex-shrink-0 flex items-center gap-3 text-sm font-medium text-gray-500">
                                <span>{field.name}</span>
                            </div>
                            <div className="flex-1">
                                {field.type === 'Text' && <input type="text" value={customFieldValues[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.value)} className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-sm" />}
                                {field.type === 'Number' && <input type="number" value={customFieldValues[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.valueAsNumber)} className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-sm" />}
                                {field.type === 'Select' && (
                                    <select value={customFieldValues[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.value)} className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-sm">
                                        <option value="">Select...</option>
                                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                )}
                                {field.type === 'Date' && (
                                    <DatePicker isInline selectedDate={customFieldValues[field.id] ? new Date(customFieldValues[field.id]) : new Date()} onChange={(date) => handleCustomFieldChange(field.id, date.toISOString().split('T')[0])} onClose={() => {}} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="flex-shrink-0 p-4 border-t border-gray-200 flex justify-end gap-3 bg-white/50">
                <button onClick={onClose} className="px-5 py-2 rounded-lg bg-white hover:bg-gray-100 transition-colors font-semibold text-gray-700 border border-gray-200">Cancel</button>
                <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors font-semibold text-white shadow-sm">Add Task</button>
            </footer>
        </div>
    );
};

export default AddTaskPanel;