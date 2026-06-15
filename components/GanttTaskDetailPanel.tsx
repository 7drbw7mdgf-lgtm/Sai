
import React from 'react';
import TaskDetailPanel from './TaskDetailPanel';
import { ProjectData } from '../types';

interface GanttTaskDetailPanelProps {
    taskId: string;
    projectData: ProjectData;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    onClose: () => void;
    isOpen: boolean;
    onStartLinking?: (type: 'prerequisite' | 'postrequisite') => void;
    onRemoveDependency?: (sourceId: string, targetId: string) => void;
}

const GanttTaskDetailPanel: React.FC<GanttTaskDetailPanelProps> = ({ onSetData, ...props }) => {
    
    const handleDeleteTask = (taskId: string) => {
        onSetData(p => { 
            if (!p) return null; 
            return { 
                ...p, 
                tasks: p.tasks.filter(t => t.id !== taskId), 
                assignments: (p.assignments || []).filter(a => a.taskId !== taskId) 
            } 
        });
        props.onClose();
    };

    const handleDeleteAssignment = (assignmentId: string) => {
        onSetData(p => { 
            if (!p) return null; 
            return { 
                ...p, 
                assignments: (p.assignments || []).filter(a => a.id !== assignmentId) 
            } 
        });
    };

    return (
        <TaskDetailPanel 
            {...props} 
            onSetData={onSetData}
            onDelete={handleDeleteTask} 
            onDeleteAssignment={handleDeleteAssignment} 
        />
    );
};

export default GanttTaskDetailPanel;
