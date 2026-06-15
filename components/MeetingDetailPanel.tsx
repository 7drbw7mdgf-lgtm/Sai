


import React, { useMemo, useState, useRef } from 'react';
import { ProjectData, Meeting, Person, Job } from '../types';
import Tooltip from './Tooltip';
import DatePicker from './DatePicker';
import { TrashIcon } from './icons/TrashIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import PillAccordion from './PillAccordion';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import RichTextEditor from './RichTextEditor';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckCircleIcon, CheckCircleIconSolid } from './icons/CheckCircleIcon';
import ColorSwatchPicker from './ColorSwatchPicker';
import { PaintBrushIcon } from './icons/PaintBrushIcon';
import { ChevronDownIcon } from './icons/ChevronIcons';


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

const AttendeeEditor: React.FC<{
    people: Person[];
    attendees: string[];
    onToggle: (personId: string) => void;
}> = ({ people, attendees, onToggle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    useOnClickOutside(dropdownRef, () => setIsOpen(false));
    
    const assignedPeople = people.filter(p => attendees.includes(p.id));

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="flex flex-wrap gap-2">
                {assignedPeople.map(p => (
                     <div key={p.id} className="group relative">
                        <Tooltip text={p.name}>
                            <img src={p.avatarUrl} alt={p.name} className="w-8 h-8 rounded-full cursor-pointer"/>
                        </Tooltip>
                        <button onClick={() => onToggle(p.id)} className="absolute -top-1 -right-1 bg-gray-600 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                ))}
                <Tooltip text="Add Attendee">
                    <button onClick={() => setIsOpen(o => !o)} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-500 text-gray-400 flex items-center justify-center transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </button>
                </Tooltip>
            </div>
            
            {isOpen && (
                 <div className="absolute top-full mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto p-1">
                    {people.map(person => (
                        <div key={person.id} onClick={() => onToggle(person.id)} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={attendees.includes(person.id)} readOnly className="form-checkbox h-4 w-4 text-blue-600 rounded" />
                            <img src={person.avatarUrl} alt={person.name} className="w-6 h-6 rounded-full" />
                            <span className="text-sm font-medium text-gray-700">{person.name}</span>
                        </div>
                    ))}
                 </div>
            )}
        </div>
    );
}

const DatePickerButton: React.FC<{ date: Date, onChange: (date: Date) => void }> = ({ date, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative w-full">
            <button onClick={() => setIsOpen(true)} className="w-full text-left bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </button>
            {isOpen && (
                <DatePicker 
                    selectedDate={date}
                    onChange={(newDate) => {
                        onChange(newDate);
                        setIsOpen(false);
                    }}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

interface MeetingDetailPanelProps {
    meetingId: string;
    projectData: ProjectData;
    // FIX: Correctly type `onSetData` to handle nullable project data state.
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    onClose: () => void;
    onDelete: (meetingId: string) => void;
    onAddJob: (job: Job) => void;
    onUpdateJob: (jobId: string, updates: Partial<Job>) => void;
    onDeleteJob: (jobId: string) => void;
    isOpen: boolean;
}

const MeetingDetailPanel: React.FC<MeetingDetailPanelProps> = ({ meetingId, projectData, onSetData, onClose, onDelete, onAddJob, onUpdateJob, onDeleteJob, isOpen }) => {
    const meeting = useMemo(() => projectData.meetings.find(m => m.id === meetingId), [meetingId, projectData.meetings]);
    const meetingJobs = useMemo(() => (projectData.jobs || []).filter(j => j.meetingId === meetingId).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()), [projectData.jobs, meetingId]);
    
    const [newJobName, setNewJobName] = useState('');
    const [newJobStartDate, setNewJobStartDate] = useState(new Date());
    const [newJobEndDate, setNewJobEndDate] = useState(new Date());
    const [newJobStartTime, setNewJobStartTime] = useState('09:00');
    const [newJobEndTime, setNewJobEndTime] = useState('10:00');
    const [newJobAssignees, setNewJobAssignees] = useState<string[]>([]);
    
    const [isAssigneePickerOpen, setIsAssigneePickerOpen] = useState(false);
    const assigneePickerRef = useRef(null);
    useOnClickOutside(assigneePickerRef, () => setIsAssigneePickerOpen(false));

    if (!meeting) return null;

    const updateMeeting = (updates: Partial<Meeting>) => {
        onSetData(prev => {
            // FIX: Add null check to prevent runtime errors.
            if (!prev) return null;
            return {
                ...prev,
                meetings: prev.meetings.map(m => m.id === meetingId ? { ...m, ...updates } : m)
            }
        });
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this meeting? This will also delete any assignments from it.')) {
            meetingJobs.forEach(job => onDeleteJob(job.id));
            onDelete(meeting.id);
        }
    };
    
    const handleAddJob = () => {
        if (!newJobName.trim()) return;
        onAddJob({
            id: `job-${Date.now()}`,
            name: newJobName.trim(),
            meetingId: meeting.id,
            startDate: newJobStartDate,
            endDate: newJobEndDate,
            startTime: newJobStartTime,
            endTime: newJobEndTime,
            assignedTo: newJobAssignees,
            createdAt: new Date(),
            completed: false,
        });
        setNewJobName('');
        setNewJobAssignees([]);
    }
    
     const toggleNewJobAssignee = (personId: string) => {
        setNewJobAssignees(prev =>
            prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
        );
    }

    const handleDateChange = (newDate: Date) => {
        const adjustedDate = new Date(newDate);
        adjustedDate.setHours(meeting.date.getHours(), meeting.date.getMinutes(), meeting.date.getSeconds());
        updateMeeting({ date: adjustedDate });
    };

    return (
        <div
            onClick={e => e.stopPropagation()}
            className="h-full bg-gray-50 border-l border-gray-200 flex flex-col w-full animate-slide-in-right"
            role="dialog"
        >
            <header className="flex-shrink-0 p-4 pl-5 pr-3 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-700">Meeting Details</h2>
                <div className="flex items-center gap-1">
                    <Tooltip text="Delete Meeting">
                        <button onClick={handleDelete} className="p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-100 transition-colors">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </Tooltip>
                    <Tooltip text="Close (Esc)">
                         <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                            <XCircleIcon className="w-6 h-6"/>
                        </button>
                    </Tooltip>
                </div>
            </header>

            <div className="flex-grow p-6 flex flex-col overflow-y-auto space-y-6">
                <input 
                    type="text" 
                    value={meeting.title}
                    onChange={e => updateMeeting({ title: e.target.value })}
                    placeholder="Meeting Title"
                    className="text-2xl font-bold text-gray-800 bg-transparent focus:outline-none w-full border-b-2 border-transparent focus:border-blue-500 -ml-1 p-1 transition-colors"
                />

                <PillAccordion title={<><UserCircleIcon className="w-5 h-5 text-gray-500"/><span className="font-semibold">Attendees</span></>} defaultOpen>
                    <div className="p-1">
                        <AttendeeEditor 
                            people={projectData.people} 
                            attendees={meeting.attendees}
                            onToggle={(personId) => {
                                const newAttendees = meeting.attendees.includes(personId)
                                    ? meeting.attendees.filter(id => id !== personId)
                                    : [...meeting.attendees, personId];
                                updateMeeting({ attendees: newAttendees });
                            }}
                        />
                    </div>
                </PillAccordion>
                
                <PillAccordion title={<><CalendarDaysIcon className="w-5 h-5 text-gray-500"/><span className="font-semibold">Date & Time</span></>} defaultOpen>
                    <div className="p-1 space-y-2">
                         <div className="flex items-center gap-2">
                            <span className="w-12 text-sm text-gray-500">Date</span>
                            <DatePickerButton date={meeting.date} onChange={handleDateChange} />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-12 text-sm text-gray-500">From</span>
                            <input 
                                type="time" 
                                value={meeting.startTime} 
                                onChange={e => updateMeeting({ startTime: e.target.value })} 
                                className="w-full bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                         <div className="flex items-center gap-2">
                            <span className="w-12 text-sm text-gray-500">To</span>
                            <input 
                                type="time" 
                                value={meeting.endTime} 
                                onChange={e => updateMeeting({ endTime: e.target.value })} 
                                className="w-full bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </PillAccordion>
                
                 <PillAccordion title={<><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg><span className="font-semibold">Assignments</span></>} defaultOpen>
                     <div className="p-1 space-y-2">
                         {meetingJobs.map(job => (
                             <div key={job.id} className="group flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg hover:bg-gray-100/70">
                                <button onClick={() => onUpdateJob(job.id, { completed: !job.completed })}>
                                    {job.completed ? <CheckCircleIconSolid className="w-5 h-5 text-green-500"/> : <CheckCircleIcon className="w-5 h-5 text-gray-400"/>}
                                </button>
                                 <div className="flex-1">
                                    <p className={`${job.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>{job.name}</p>
                                     <div className="text-xs text-gray-500 flex items-center gap-4">
                                        <span>{job.startDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - {job.endDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>
                                        <div className="flex items-center -space-x-1">
                                            {projectData.people.filter(p => job.assignedTo.includes(p.id)).map(p => (
                                                <Tooltip text={p.name} key={p.id}><img src={p.avatarUrl} alt={p.name} className="w-4 h-4 rounded-full border border-white" /></Tooltip>
                                            ))}
                                        </div>
                                    </div>
                                 </div>
                                <button onClick={() => onDeleteJob(job.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        ))}
                        <div className="pt-2 border-t border-gray-200/80 space-y-2">
                            <input type="text" value={newJobName} onChange={e => setNewJobName(e.target.value)} placeholder="Add a new assignment..." className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-sm"/>
                             <div className="grid grid-cols-2 gap-2">
                                <DatePicker selectedDate={newJobStartDate} onChange={setNewJobStartDate} minDate={projectData.projectStartDate} maxDate={projectData.projectEndDate} onClose={() => {}} />
                                <DatePicker selectedDate={newJobEndDate} onChange={setNewJobEndDate} minDate={newJobStartDate} maxDate={projectData.projectEndDate} onClose={() => {}} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="time" value={newJobStartTime} onChange={e => setNewJobStartTime(e.target.value)} className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-sm"/>
                                <input type="time" value={newJobEndTime} onChange={e => setNewJobEndTime(e.target.value)} className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-sm"/>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1" ref={assigneePickerRef}>
                                    <button onClick={() => setIsAssigneePickerOpen(o => !o)} className="w-full text-left bg-white border border-gray-300 rounded-md px-2 py-1 text-sm flex justify-between items-center">
                                        <span className={newJobAssignees.length === 0 ? "text-gray-400" : ""}>{newJobAssignees.length > 0 ? `${newJobAssignees.length} people selected` : "Assign people..."}</span>
                                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                    </button>
                                    {isAssigneePickerOpen &&
                                        <div className="absolute bottom-full mb-1 w-full z-10 bg-white shadow-lg border rounded-md p-1 max-h-48 overflow-y-auto">
                                             <AssigneeEditor people={projectData.people} assignedTo={newJobAssignees} onToggle={toggleNewJobAssignee} />
                                        </div>
                                    }
                                </div>
                                <button onClick={handleAddJob} disabled={!newJobName.trim()} className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300">
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </PillAccordion>

                <PillAccordion title={<><DocumentTextIcon className="w-5 h-5 text-gray-500" /><span className="font-semibold">Agenda</span></>}>
                    <div className="min-h-[150px] h-full p-1">
                        <RichTextEditor 
                            value={meeting.agenda || ''}
                            onChange={agenda => updateMeeting({ agenda })}
                        />
                    </div>
                </PillAccordion>
                
                <PillAccordion title={<><PaintBrushIcon className="w-5 h-5 text-gray-500" /><span className="font-semibold">Color Tag</span></>}>
                    <div className="p-2">
                       <ColorSwatchPicker selectedColor={meeting.color} onSelectColor={(color) => updateMeeting({ color })} />
                    </div>
                </PillAccordion>
            </div>
        </div>
    );
};

export default MeetingDetailPanel;