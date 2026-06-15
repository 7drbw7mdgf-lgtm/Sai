import React, { useState, useMemo, useEffect } from 'react';
import { Person, Task, ProjectData, Meeting } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';
import Tooltip from './Tooltip';
import { XCircleIcon } from './icons/XCircleIcon';
// FIX: Add missing icon imports
import { TasksIcon } from './icons/TasksIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';

interface PeopleManagementHubProps {
    projectData: ProjectData;
    // FIX: Correctly type `onSetData` to handle nullable project data state.
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    onClose: () => void;
    initialSelectedPersonId?: string | null;
}

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-gray-100/60 dark:bg-gray-700/50 p-3 rounded-lg flex-1">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">{icon} <h4 className="text-xs font-bold uppercase">{title}</h4></div>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{value}</p>
    </div>
);


const PeopleManagementHub: React.FC<PeopleManagementHubProps> = ({ projectData, onSetData, onClose, initialSelectedPersonId }) => {
    const { people, tasks, meetings } = projectData;
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [newPersonName, setNewPersonName] = useState('');

    useEffect(() => {
        if (initialSelectedPersonId) {
            setSelectedPersonId(initialSelectedPersonId);
        } else if (!selectedPersonId && people.length > 0) {
            setSelectedPersonId(people[0].id);
        }
         if (people.length > 0 && !people.find(p => p.id === selectedPersonId)) {
            setSelectedPersonId(people[0].id);
        }
        if (people.length === 0) {
            setSelectedPersonId(null);
        }
    }, [people, selectedPersonId, initialSelectedPersonId]);

    const selectedPerson = useMemo(() => {
        return people.find(p => p.id === selectedPersonId) || null;
    }, [selectedPersonId, people]);

    const personStats = useMemo(() => {
        if (!selectedPerson) return { assignedTasks: [], upcomingMeetings: [], avgCompletion: 0 };

        const assignedTasks = tasks.filter(task => task.assignedTo.includes(selectedPerson.id));
        
        const totalCompletion = assignedTasks.reduce((sum, task) => sum + task.completion, 0);
        const avgCompletion = assignedTasks.length > 0 ? Math.round(totalCompletion / assignedTasks.length) : 0;
        
        const now = new Date();
        now.setHours(0,0,0,0);
        const upcomingMeetings = meetings
            .filter(m => m.attendees.includes(selectedPerson.id) && new Date(m.date) >= now)
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { assignedTasks, upcomingMeetings, avgCompletion };
    }, [selectedPerson, tasks, meetings]);

    const handleAddNewPerson = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPersonName.trim()) return;
        const newId = `p-${Date.now()}`;
        const newPerson: Person = {
            id: newId,
            name: newPersonName.trim(),
            avatarUrl: `https://picsum.photos/seed/${newId}/80/80`,
        };
        // FIX: Add null check to prevent runtime errors.
        onSetData(prev => { if (!prev) return null; return ({...prev, people: [...prev.people, newPerson]})});
        setNewPersonName('');
        setSelectedPersonId(newId);
    };

    const handleDeletePerson = (personId: string) => {
        if (window.confirm('Are you sure you want to delete this person? They will be unassigned from all tasks and meetings.')) {
            onSetData(prev => {
                // FIX: Add null check to prevent runtime errors.
                if (!prev) return null;
                const updatedTasks = prev.tasks.map(task => ({
                    ...task,
                    assignedTo: task.assignedTo.filter(id => id !== personId),
                }));
                 const updatedMeetings = prev.meetings.map(meeting => ({
                    ...meeting,
                    attendees: meeting.attendees.filter(id => id !== personId),
                }));
                const updatedPeople = prev.people.filter(p => p.id !== personId);
                return {...prev, tasks: updatedTasks, meetings: updatedMeetings, people: updatedPeople };
            });
        }
    };

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col w-full animate-slide-in-right">
            <header className="flex-shrink-0 px-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center h-16">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Team Hub</h2>
                <Tooltip text="Close (Esc)">
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <XCircleIcon className="w-6 h-6"/>
                    </button>
                </Tooltip>
            </header>
            <div className="flex-grow flex min-h-0">
                {/* Left Panel: Roster */}
                <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800/50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">Team Members</h3>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {people.map(person => (
                            <div
                                key={person.id}
                                onClick={() => setSelectedPersonId(person.id)}
                                className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors group border-l-4 ${selectedPersonId === person.id ? 'bg-blue-50 dark:bg-gray-700/50 border-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <img src={person.avatarUrl} alt={person.name} className="w-8 h-8 rounded-full" />
                                    <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{person.name}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleDeletePerson(person.id); }} className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100/60 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        <form onSubmit={handleAddNewPerson} className="flex gap-2">
                            <input
                                type="text"
                                value={newPersonName}
                                onChange={(e) => setNewPersonName(e.target.value)}
                                placeholder="Add new member..."
                                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button type="submit" className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:bg-gray-400 text-sm" disabled={!newPersonName.trim()}>Add</button>
                        </form>
                    </div>
                </div>

                {/* Right Panel: Details */}
                <div className="w-2/3 flex flex-col">
                    {selectedPerson ? (
                        <>
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <img src={selectedPerson.avatarUrl.replace('/40/40', '/80/80')} alt={selectedPerson.name} className="w-16 h-16 rounded-full shadow-md" />
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedPerson.name}</h3>
                                </div>
                                <div className="flex gap-3">
                                    <StatCard title="Tasks" value={personStats.assignedTasks.length} icon={<TasksIcon className="h-4 w-4" />} />
                                    <StatCard title="Avg. Progress" value={`${personStats.avgCompletion}%`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}/>
                                    <StatCard title="Meetings" value={personStats.upcomingMeetings.length} icon={<CalendarDaysIcon className="h-4 w-4"/>}/>
                                </div>
                            </div>
                            <div className="flex-grow p-4 overflow-y-auto space-y-6">
                                <div>
                                    <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-3 text-sm">Assigned Tasks</h4>
                                    <div className="space-y-3">
                                        {personStats.assignedTasks.length > 0 ? personStats.assignedTasks.map(task => (
                                            <div key={task.id} className="bg-white dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200/80 dark:border-gray-700">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{task.name}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">Due: {new Date(task.endDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                        <div className="h-2 rounded-full" style={{ width: `${task.completion}%`, backgroundColor: task.color }}></div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-12 text-right">{task.completion}%</span>
                                                </div>
                                            </div>
                                        )) : <p className="text-gray-400 dark:text-gray-500 text-center py-4 text-sm">No tasks assigned.</p>}
                                    </div>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-3 text-sm">Upcoming Meetings</h4>
                                    <div className="space-y-3">
                                        {personStats.upcomingMeetings.length > 0 ? personStats.upcomingMeetings.map(meeting => (
                                            <div key={meeting.id} className="bg-white dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200/80 dark:border-gray-700 flex items-center gap-3">
                                                <div className="w-1 h-10 rounded-full" style={{backgroundColor: meeting.color}}></div>
                                                <div>
                                                    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{meeting.title}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(meeting.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} @ {meeting.startTime}</p>
                                                </div>
                                            </div>
                                        )) : <p className="text-gray-400 dark:text-gray-500 text-center py-4 text-sm">No upcoming meetings.</p>}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-center text-gray-400 dark:text-gray-500">
                            <div>
                                 <UserPlusIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                                <p className="mt-2 text-base font-medium">Select or add a team member</p>
                                <p className="text-sm">View their workload and schedule here.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PeopleManagementHub;