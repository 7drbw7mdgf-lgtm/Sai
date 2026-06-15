import React, { useMemo } from 'react';
import { ProjectData } from '../../types';

interface MyTasksWidgetProps {
    projectData: ProjectData;
    onRequestEditTask: (taskId: string) => void;
}

const MyTasksWidget: React.FC<MyTasksWidgetProps> = ({ projectData, onRequestEditTask }) => {
    const { tasks, people } = projectData;

    const myTasks = useMemo(() => {
        const currentUser = people.find(p => p.name === 'Alice'); // For demo
        if (!currentUser) return [];
        return tasks.filter(t => t.assignedTo.includes(currentUser.id) && t.completion < 100)
                    .sort((a,b) => a.endDate.getTime() - b.endDate.getTime())
                    .slice(0, 7);
    }, [tasks, people]);

    return (
        <div className="h-full flex flex-col p-4">
            <h2 className="text-lg font-semibold mb-3 flex-shrink-0 px-2">My Tasks</h2>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                {myTasks.length > 0 ? myTasks.map(task => (
                    <div key={task.id} onClick={() => onRequestEditTask(task.id)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                        <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{backgroundColor: task.color}}></div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold text-sm truncate">{task.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Due: {task.endDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</p>
                        </div>
                        <div className="w-16 text-right">
                            <span className="text-sm font-semibold">{task.completion}%</span>
                        </div>
                    </div>
                )) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-gray-400 text-center text-sm">You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTasksWidget;