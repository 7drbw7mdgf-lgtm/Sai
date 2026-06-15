

import React, { useState, useRef } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { TaskPlusIcon } from './icons/TaskPlusIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { Task, ProjectData, Group, View } from '../types';
import { GroupIcon } from './icons/GroupIcon';
import AddGroupModal from './AddGroupModal';
import { CalendarPlusIcon } from './icons/CalendarPlusIcon';
import { DocumentPlusIcon } from './icons/DocumentPlusIcon';

interface ActionBarProps {
    currentView: View;
    projectData: ProjectData;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    onAddTaskClick: () => void;
    onScheduleMeetingClick: () => void;
    onAddNoteClick: () => void;
}

const ActionBar: React.FC<ActionBarProps> = ({ 
    currentView,
    projectData, 
    onSetData, 
    onAddTaskClick,
    onScheduleMeetingClick,
    onAddNoteClick,
}) => {
    const [isAddGroupModalOpen, setAddGroupModalOpen] = useState(false);
    
    const handleAddGroup = (newGroup: Group) => {
        onSetData(prev => {
            if (!prev) return prev;
            
            const newLayout = JSON.parse(JSON.stringify(prev.designLayout || { tasks: {}, groups: {} }));
            
            const existingGroupCount = Object.keys(newLayout.groups).length;
            const newX = 100 + (existingGroupCount % 4) * 400;
            const newY = 100 + Math.floor(existingGroupCount / 4) * 450;
            
            newLayout.groups[newGroup.id] = { x: newX, y: newY, width: 350, height: 400 };
    
            return { 
                ...prev, 
                groups: [...prev.groups, newGroup],
                designLayout: newLayout
            };
        });
    }

    const renderActions = () => {
        if (currentView === View.NOTES) {
            return (
                <button onClick={onAddNoteClick} className="flex items-center gap-2 h-12 px-5 bg-white hover:bg-gray-50 transition-colors rounded-full shadow-sm border border-gray-200 font-semibold text-gray-700 text-sm">
                    <DocumentPlusIcon className="text-gray-700 h-5 w-5"/>
                    New Note
                </button>
            )
        }

        if (currentView === View.GANTT || currentView === View.TASKS || currentView === View.CALENDAR) {
             return (
                <>
                    <button onClick={onAddTaskClick} className="flex items-center gap-2 h-12 px-5 bg-white hover:bg-gray-50 transition-colors rounded-full shadow-sm border border-gray-200 font-semibold text-gray-700 text-sm">
                        <TaskPlusIcon className="text-gray-700 h-5 w-5"/>
                        Add Task
                    </button>

                    {currentView === View.CALENDAR && (
                        <button onClick={onScheduleMeetingClick} className="flex items-center gap-2 h-12 px-5 bg-white hover:bg-gray-50 transition-colors rounded-full shadow-sm border border-gray-200 font-semibold text-gray-700 text-sm">
                            <CalendarPlusIcon className="text-gray-700 h-5 w-5"/>
                            Schedule Meeting
                        </button>
                    )}

                    <button onClick={() => setAddGroupModalOpen(true)} className="flex items-center gap-2 h-12 px-5 bg-white hover:bg-gray-50 transition-colors rounded-full shadow-sm border border-gray-200 font-semibold text-gray-700 text-sm">
                        <GroupIcon className="text-gray-700 h-5 w-5"/>
                        Add Group
                    </button>
                </>
            )
        }

        return null;
    }

    const actions = renderActions();
    if (!actions) return null;

    return (
        <>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-40">
                <div className="flex items-center space-x-3 bg-white/70 backdrop-blur-md p-2 rounded-full shadow-lg border border-gray-200/80">
                    {actions}
                </div>
            </div>
            {isAddGroupModalOpen && <AddGroupModal isOpen={isAddGroupModalOpen} onClose={() => setAddGroupModalOpen(false)} onSave={handleAddGroup} />}
        </>
    );
};

export default ActionBar;
