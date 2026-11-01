import React, { useMemo } from 'react';
import { Priority, ProjectData } from '../../types';
import { FlagIcon } from '../icons/FlagIcon';

interface PriorityBreakdownWidgetProps {
    projectData: ProjectData;
}

const PRIORITIES = [
    { key: Priority.Urgent, label: 'Urgent', color: 'bg-red-500', text: 'text-red-600' },
    { key: Priority.High, label: 'High', color: 'bg-orange-500', text: 'text-orange-600' },
    { key: Priority.Medium, label: 'Medium', color: 'bg-blue-500', text: 'text-blue-600' },
    { key: Priority.Low, label: 'Low', color: 'bg-emerald-500', text: 'text-emerald-600' },
];

const PriorityBreakdownWidget: React.FC<PriorityBreakdownWidgetProps> = ({ projectData }) => {
    const stats = useMemo(() => {
        const activeTasks = projectData.tasks.filter(task => task.completion < 100);
        const total = activeTasks.length || 1;
        return PRIORITIES.map(priority => {
            const count = activeTasks.filter(task => (task.priority || Priority.Medium) === priority.key).length;
            return { ...priority, count, percentage: Math.round((count / total) * 100) };
        });
    }, [projectData.tasks]);

    return (
        <div className="flex h-full flex-col p-4">
            <h2 className="mb-3 flex flex-shrink-0 items-center gap-2 px-2 text-lg font-semibold">
                <FlagIcon className="h-5 w-5 text-gray-400" />
                Priority Mix
            </h2>
            <div className="flex-grow space-y-3 overflow-y-auto px-2">
                {stats.map(priority => (
                    <div key={priority.key}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                            <span className={`font-bold ${priority.text}`}>{priority.label}</span>
                            <span className="font-semibold text-gray-500 dark:text-gray-400">{priority.count}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                            <div className={`h-full rounded-full ${priority.color}`} style={{ width: `${priority.percentage}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PriorityBreakdownWidget;
