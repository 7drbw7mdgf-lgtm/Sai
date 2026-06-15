import React, { useMemo } from 'react';
import { ProjectData } from '../../types';
import { diffInDays } from '../../services/dateUtils';

interface ProjectHealthWidgetProps {
    projectData: ProjectData;
}

const ProjectHealthWidget: React.FC<ProjectHealthWidgetProps> = ({ projectData }) => {
    const { tasks } = projectData;

    const stats = useMemo(() => {
        if (tasks.length === 0) {
            return { total: 0, completed: 0, overdue: 0, overallCompletion: 0 };
        }
        const now = new Date();
        now.setHours(0,0,0,0);
        
        const completed = tasks.filter(t => t.completion === 100).length;
        const overdue = tasks.filter(t => t.endDate < now && t.completion < 100).length;
        const overallCompletion = Math.round(tasks.reduce((sum, t) => sum + t.completion, 0) / tasks.length);

        return { total: tasks.length, completed, overdue, overallCompletion };
    }, [tasks]);

    const circumference = 2 * Math.PI * 45; // 2 * pi * r

    return (
        <div className="h-full flex flex-col p-4">
            <h2 className="text-lg font-semibold mb-3 flex-shrink-0 px-2">Project Health</h2>
            <div className="flex-grow flex items-center justify-center gap-6">
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-200 dark:text-gray-700" />
                        <circle
                            cx="50" cy="50" r="45" fill="none"
                            stroke="currentColor" strokeWidth="10"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - (stats.overallCompletion / 100) * circumference}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            className="text-primary-500"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{stats.overallCompletion}%</span>
                    </div>
                </div>
                <div className="space-y-2">
                     <div className="text-center">
                        <p className="text-3xl font-bold">{stats.overdue}</p>
                        <p className="text-sm font-semibold text-red-500">Overdue</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold">{stats.completed}/{stats.total}</p>
                        <p className="text-sm font-semibold text-gray-500">Completed</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectHealthWidget;