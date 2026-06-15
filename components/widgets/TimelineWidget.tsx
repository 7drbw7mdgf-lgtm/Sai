
import React, { useMemo } from 'react';
import { ProjectData } from '../../types';
import { diffInDays } from '../../services/dateUtils';
import { GanttChartIcon } from '../icons/GanttChartIcon';
import Tooltip from '../Tooltip';

interface TimelineWidgetProps {
    projectData: ProjectData;
}

const TimelineWidget: React.FC<TimelineWidgetProps> = ({ projectData }) => {
    const { projectStartDate, projectEndDate, groups, tasks } = projectData;

    const stats = useMemo(() => {
        const totalDays = Math.max(1, diffInDays(projectStartDate, projectEndDate));
        const elapsedDays = Math.max(0, diffInDays(projectStartDate, new Date()));
        const progress = Math.max(0, Math.min(100, Math.round((elapsedDays / totalDays) * 100)));
        
        // Calculate milestones based on group completion (end dates of groups)
        const milestones = groups.map(group => {
            const groupTasks = tasks.filter(t => t.groupId === group.id);
            if (groupTasks.length === 0) return null;
            
            // Find max end date for the group
            const groupEnd = new Date(Math.max(...groupTasks.map(t => new Date(t.endDate).getTime())));
            const offsetDays = diffInDays(projectStartDate, groupEnd);
            const percentage = Math.max(0, Math.min(100, (offsetDays / totalDays) * 100));
            
            return {
                id: group.id,
                name: group.name,
                date: groupEnd,
                percentage,
                color: group.color
            };
        }).filter((m): m is NonNullable<typeof m> => m !== null).sort((a,b) => a.percentage - b.percentage);

        return { totalDays, elapsedDays, progress, milestones };
    }, [projectStartDate, projectEndDate, groups, tasks]);

    return (
        <div className="h-full flex flex-col p-4">
            <h2 className="text-lg font-semibold mb-3 flex-shrink-0 px-2 flex items-center gap-2">
                <GanttChartIcon className="w-5 h-5 text-gray-400" />
                Project Timeline
            </h2>
            <div className="flex-grow flex flex-col justify-center px-2 relative">
                {/* Dates */}
                <div className="flex justify-between text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">
                    <span>Start</span>
                    <span>End</span>
                </div>

                {/* Bar Container */}
                <div className="relative w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                    {/* Progress Fill */}
                    <div 
                        className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                        style={{ width: `${stats.progress}%` }}
                    />
                    
                    {/* Milestones */}
                    {stats.milestones.map(milestone => (
                        <Tooltip key={milestone.id} text={`${milestone.name} - ${milestone.date.toLocaleDateString('en-US', {month:'short', day:'numeric'})}`}>
                            <div 
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-2 rounded-full cursor-pointer hover:scale-125 transition-transform z-10"
                                style={{ 
                                    left: `calc(${milestone.percentage}% - 6px)`,
                                    borderColor: milestone.color
                                }}
                            />
                        </Tooltip>
                    ))}
                </div>

                {/* Text Stats */}
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium">
                    <span>{projectStartDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>
                    <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">Day {stats.elapsedDays} of {stats.totalDays}</span>
                    <span>{projectEndDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>
                </div>
            </div>
        </div>
    );
};

export default TimelineWidget;
