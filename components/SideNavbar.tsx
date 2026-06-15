
import React, { useState } from 'react';
import { View } from '../types';
import Tooltip from './Tooltip';
import { HomeIcon } from './icons/HomeIcon';
import { GanttChartIcon } from './icons/GanttChartIcon';
import { TasksIcon } from './icons/TasksIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { TaskPlusIcon } from './icons/TaskPlusIcon';
import { DocumentPlusIcon } from './icons/DocumentPlusIcon';
import { PeopleManagementIcon } from './icons/PeopleManagementIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface SideNavbarProps {
    currentView: View;
    onViewChange: (view: View) => void;
    onSettings: () => void;
    onAddTask: () => void;
    onAddNote: () => void;
    onTogglePeopleHub: () => void;
    onToggleAIAssistant: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onOpenShortcutHelp: () => void;
}

const NavButton: React.FC<{ tooltip: string; isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ tooltip, isActive, onClick, children }) => (
    <Tooltip text={tooltip}>
        <button
            onClick={onClick}
            className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ease-in-out
                ${isActive ? 'bg-[rgb(var(--color-primary-600))] text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-800 dark:hover:text-gray-200'}
            `}
        >
            {children}
        </button>
    </Tooltip>
);

const SideNavbar: React.FC<SideNavbarProps> = ({
    currentView, onViewChange, onSettings, onAddTask, onAddNote, onTogglePeopleHub, onToggleAIAssistant,
    undo, redo, canUndo, canRedo, onOpenShortcutHelp
}) => {

    const mainViews = [
        { id: View.GANTT, icon: <GanttChartIcon className="w-5 h-5" />, name: "Gantt" },
        { id: View.TASKS, icon: <TasksIcon className="w-5 h-5" />, name: "Tasks" },
        { id: View.CALENDAR, icon: <CalendarDaysIcon className="w-5 h-5" />, name: "Calendar" },
        { id: View.NOTES, icon: <DocumentTextIcon className="w-5 h-5" />, name: "Notes" },
    ];

    return (
        <nav className="h-full w-[68px] flex flex-col items-center justify-between py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl flex-shrink-0 border-r border-gray-200/80 dark:border-gray-700/50 z-40">
            <div>
                 <div className="mb-6 flex justify-center">
                    <NavButton tooltip="Home" isActive={currentView === View.HOME} onClick={() => onViewChange(View.HOME)}>
                        <HomeIcon className="w-5 h-5" />
                    </NavButton>
                </div>
                <div className="space-y-3 flex flex-col items-center">
                    {mainViews.map(view => (
                        <NavButton key={view.id} tooltip={view.name} isActive={currentView === view.id} onClick={() => onViewChange(view.id)}>
                            {view.icon}
                        </NavButton>
                    ))}
                </div>
            </div>

            <div className="space-y-3 flex flex-col items-center">
                {/* NotebookLM Style AI Assistant */}
                <Tooltip text="AI Assistant">
                    <button onClick={onToggleAIAssistant} className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:shadow-lg hover:scale-105 transition-all">
                        <SparklesIcon className="w-5 h-5" />
                    </button>
                </Tooltip>

                <div className="w-6 h-px bg-gray-200 dark:bg-gray-700 mx-auto my-2"></div>

                <Tooltip text="Add Task (N)">
                    <button onClick={onAddTask} className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50 dark:text-gray-400 transition-colors">
                        <TaskPlusIcon className="w-5 h-5" />
                    </button>
                </Tooltip>
                 <Tooltip text="Add Note">
                    <button onClick={onAddNote} className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50 dark:text-gray-400 transition-colors">
                        <DocumentPlusIcon className="w-5 h-5" />
                    </button>
                </Tooltip>
                 <Tooltip text="Manage Team">
                    <button onClick={onTogglePeopleHub} className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50 dark:text-gray-400 transition-colors">
                        <PeopleManagementIcon className="w-5 h-5" />
                    </button>
                </Tooltip>
                
                 <div className="w-6 h-px bg-gray-200 dark:bg-gray-700 mx-auto my-2"></div>
                
                 <Tooltip text="Undo (Ctrl+Z)">
                    <button onClick={undo} disabled={!canUndo} className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                        <UndoIcon className="w-5 h-5" />
                    </button>
                </Tooltip>
                 <Tooltip text="Redo (Ctrl+Y)">
                    <button onClick={redo} disabled={!canRedo} className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                        <RedoIcon className="w-5 h-5" />
                    </button>
                </Tooltip>

                 <Tooltip text="Help (?)">
                    <button onClick={onOpenShortcutHelp} className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50 dark:text-gray-400 transition-colors">
                        <QuestionMarkCircleIcon className="w-5 h-5" />
                    </button>
                </Tooltip>
                 <Tooltip text="Settings">
                    <button onClick={onSettings} className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50 dark:text-gray-400 transition-colors">
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                </Tooltip>
            </div>
        </nav>
    );
};

export default SideNavbar;
