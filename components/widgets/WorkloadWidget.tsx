import React, { useMemo } from 'react';
import { ProjectData } from '../../types';
import { PeopleManagementIcon } from '../icons/PeopleManagementIcon';

interface WorkloadWidgetProps {
    projectData: ProjectData;
    onTogglePeopleHub: () => void;
}

const WorkloadWidget: React.FC<WorkloadWidgetProps> = ({ projectData, onTogglePeopleHub }) => {
    const workload = useMemo(() => {
        const maxTasks = Math.max(1, ...projectData.people.map(person => (
            projectData.tasks.filter(task => task.assignedTo.includes(person.id) && task.completion < 100).length
        )));

        return projectData.people.map(person => {
            const activeTasks = projectData.tasks.filter(task => task.assignedTo.includes(person.id) && task.completion < 100).length;
            return { person, activeTasks, percentage: Math.round((activeTasks / maxTasks) * 100) };
        }).sort((a, b) => b.activeTasks - a.activeTasks);
    }, [projectData.people, projectData.tasks]);

    return (
        <div className="flex h-full flex-col p-4">
            <div className="mb-3 flex flex-shrink-0 items-center justify-between gap-3 px-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <PeopleManagementIcon className="h-5 w-5 text-gray-400" />
                    Workload
                </h2>
                <button onClick={onTogglePeopleHub} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300">
                    Manage
                </button>
            </div>
            <div className="flex-grow space-y-3 overflow-y-auto px-2">
                {workload.length > 0 ? workload.map(({ person, activeTasks, percentage }) => (
                    <div key={person.id} className="flex items-center gap-3">
                        <img src={person.avatarUrl} alt={person.name} className="h-8 w-8 rounded-full" />
                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex justify-between gap-2 text-xs">
                                <span className="truncate font-bold text-gray-800 dark:text-gray-100">{person.name}</span>
                                <span className="font-semibold text-gray-500">{activeTasks} tasks</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percentage}%` }} />
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="flex h-full items-center justify-center text-center text-sm text-gray-400">No team members yet.</div>
                )}
            </div>
        </div>
    );
};

export default WorkloadWidget;
