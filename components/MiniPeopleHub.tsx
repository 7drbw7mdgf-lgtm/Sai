
import React from 'react';
import { Person, Task } from '../types';

interface MiniPeopleHubProps {
    people: Person[];
    tasks: Task[];
    onManageClick: () => void;
    isVisible: boolean;
}

const MiniPeopleHub: React.FC<MiniPeopleHubProps> = ({ people, tasks, onManageClick, isVisible }) => {
    return (
        <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 p-4 bg-white rounded-xl shadow-lg border border-gray-200 w-72 ${isVisible ? 'animate-fade-in' : 'animate-fade-out'}`}>
            <h3 className="font-bold text-gray-800 mb-3 px-1">Team Members</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {people.map(person => {
                    const taskCount = tasks.filter(t => t.assignedTo.includes(person.id)).length;
                    return (
                        <div key={person.id} className="flex items-center justify-between p-1 rounded-md">
                             <div className="flex items-center gap-2">
                                <img src={person.avatarUrl} alt={person.name} className="w-8 h-8 rounded-full"/>
                                <span className="font-semibold text-sm text-gray-700">{person.name}</span>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{taskCount} tasks</span>
                        </div>
                    )
                })}
                 {people.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No team members yet.</p>}
            </div>
            <button
                onClick={onManageClick}
                className="w-full mt-4 text-center py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-lg text-sm transition-colors"
            >
                Manage Team
            </button>
        </div>
    );
};

export default MiniPeopleHub;