
import React, { useState } from 'react';
import { View } from '../types';
import Tooltip from './Tooltip';

interface SideNavbarProps {
    currentView: View;
    onViewChange: (view: View) => void;
    onSettings: () => void;
    onAddTask: () => void;
    onAddNote?: () => void;
    onTogglePeopleHub?: () => void;
    onToggleAIAssistant?: () => void;
    onOpenShortcutHelp: () => void;
}

const IconBase: React.FC<React.SVGProps<SVGSVGElement>> = ({ children, ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {children}
    </svg>
);

const NavHomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <path d="M3.5 11.2 12 4l8.5 7.2" />
        <path d="M5.5 10.5v8.25a1.25 1.25 0 0 0 1.25 1.25h10.5a1.25 1.25 0 0 0 1.25-1.25V10.5" />
        <path d="M9.5 20v-5.2h5V20" />
    </IconBase>
);

const NavTimelineIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <path d="M4 6.5h9" />
        <path d="M8 12h9" />
        <path d="M11 17.5h9" />
    </IconBase>
);

const NavTasksIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="m7.5 9 1.25 1.25L11.25 7.75" />
        <path d="M13.5 9.25h3" />
        <path d="m7.5 14.5 1.25 1.25 2.5-2.5" />
        <path d="M13.5 14.75h3" />
    </IconBase>
);

const NavCalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
        <path d="M8 4v3.5" />
        <path d="M16 4v3.5" />
        <path d="M4 10h16" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
    </IconBase>
);

const NavNotesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <path d="M7 4.5h7.5L19 9v10.5H7a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" />
        <path d="M14.5 4.5V9H19" />
        <path d="M8.5 13h7" />
        <path d="M8.5 16h5" />
    </IconBase>
);

const NavKanbanIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <rect x="4" y="4" width="4" height="16" rx="1.5" />
        <rect x="10" y="4" width="4" height="11" rx="1.5" />
        <rect x="16" y="4" width="4" height="8" rx="1.5" />
    </IconBase>
);

const NavSparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <path d="M12 3.75 13.7 8.3 18.25 10 13.7 11.7 12 16.25 10.3 11.7 5.75 10l4.55-1.7L12 3.75Z" />
        <path d="m5.5 15 .8 2.15L8.5 18l-2.2.85L5.5 21l-.8-2.15L2.5 18l2.2-.85L5.5 15Z" />
        <path d="m18 14 .65 1.7 1.85.7-1.85.7L18 18.8l-.65-1.7-1.85-.7 1.85-.7L18 14Z" />
    </IconBase>
);

const NavAddTaskIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
    </IconBase>
);

const NavAddNoteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <path d="M6.5 4.5h8L18 8v11.5H6.5a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z" />
        <path d="M14.5 4.5V8H18" />
        <path d="M11.5 11.5v5" />
        <path d="M9 14h5" />
    </IconBase>
);

const NavTeamIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <circle cx="9" cy="8.5" r="2.5" />
        <circle cx="16.5" cy="9.5" r="2" />
        <path d="M4.5 18.5a4.5 4.5 0 0 1 9 0" />
        <path d="M13.5 17.5a3.5 3.5 0 0 1 6 1" />
    </IconBase>
);

const NavHelpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9.75 9.75a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1.25.95-1.25 1.95" />
        <path d="M12 17.25h.01" />
    </IconBase>
);

const NavSettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
        <path d="M19.4 13.5a7.8 7.8 0 0 0 .05-1.5l2-1.5-2-3.5-2.45 1a8.2 8.2 0 0 0-1.3-.75L15.35 4h-6.7L8.3 6.75c-.46.2-.9.45-1.3.75L4.55 6.5l-2 3.5 2 1.5a7.8 7.8 0 0 0 .05 1.5l-2.05 1.55 2 3.45 2.45-.95c.4.3.84.55 1.3.75l.35 2.7h6.7l.35-2.7c.46-.2.9-.45 1.3-.75l2.45.95 2-3.45-2.05-1.55Z" />
    </IconBase>
);

const NavButton: React.FC<{ tooltip: string; label?: string; isActive: boolean; onClick: () => void; children: React.ReactNode; showLabel?: boolean }> = ({ tooltip, label = tooltip, isActive, onClick, children, showLabel = false }) => (
    <Tooltip text={tooltip}>
        <button
            aria-label={label}
            onClick={onClick}
            className={`relative flex h-10 items-center rounded-xl transition-all duration-200 ease-in-out
                ${showLabel ? 'w-[8.75rem] justify-start gap-3 px-3' : 'w-10 justify-center'}
                ${isActive 
                    ? 'bg-accent text-white shadow-xs font-semibold' 
                    : 'text-[#50564d] dark:text-gray-400 hover:bg-[#f0efeb] dark:hover:bg-gray-800/60 hover:text-[#292c31] dark:hover:text-gray-200 font-medium'}
            `}
        >
            {children}
            {showLabel && <span className="truncate text-sm">{label}</span>}
        </button>
    </Tooltip>
);

const SideNavbar: React.FC<SideNavbarProps> = ({
    currentView, onViewChange, onSettings, onAddTask, onAddNote, onTogglePeopleHub, onToggleAIAssistant,
    onOpenShortcutHelp
}) => {

    const mainViews = [
        { id: View.KANBAN, icon: <NavKanbanIcon className="w-[20px] h-[20px]" />, name: "Kanban" },
        { id: View.TASKS, icon: <NavTasksIcon className="w-[20px] h-[20px]" />, name: "List" },
        { id: View.GANTT, icon: <NavTimelineIcon className="w-[20px] h-[20px]" />, name: "Gantt" },
        { id: View.CALENDAR, icon: <NavCalendarIcon className="w-[20px] h-[20px]" />, name: "Calendar" },
    ];

    return (
        <nav className="h-full w-40 flex flex-col justify-between px-3 py-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl flex-shrink-0 border-r border-[#e6e6e2] dark:border-gray-800 z-40">
            <div>
                 <div className="mb-6">
                    <NavButton tooltip="Home" isActive={currentView === View.HOME} onClick={() => onViewChange(View.HOME)} showLabel>
                        <NavHomeIcon className="w-[20px] h-[20px]" />
                    </NavButton>
                </div>
                <div className="space-y-1.5 flex flex-col">
                    {mainViews.map(view => (
                        <NavButton key={view.id} tooltip={view.name} isActive={currentView === view.id} onClick={() => onViewChange(view.id)} showLabel>
                            {view.icon}
                        </NavButton>
                    ))}
                </div>
            </div>

            <div className="space-y-1.5 flex flex-col">
                <Tooltip text="Add Task (N)">
                    <button
                        aria-label="Add Task"
                        onClick={onAddTask}
                        className="flex h-10 w-[8.75rem] items-center justify-start gap-3 rounded-xl px-3 bg-accent-soft hover:bg-accent-soft2 dark:bg-accent/15 dark:hover:bg-accent/25 text-accent transition-all duration-200 ease-in-out font-semibold active:scale-[0.98]"
                    >
                        <NavAddTaskIcon className="w-[20px] h-[20px] text-accent" />
                        <span className="truncate text-sm">New Task</span>
                    </button>
                </Tooltip>
                
                <div className="mx-2 h-px bg-[#e6e6e2] dark:bg-gray-800 my-1"></div>

                <NavButton tooltip="Help (?)" label="Help" isActive={false} onClick={onOpenShortcutHelp} showLabel>
                    <NavHelpIcon className="w-[20px] h-[20px]" />
                </NavButton>
                <NavButton tooltip="Settings" isActive={false} onClick={onSettings} showLabel>
                    <NavSettingsIcon className="w-[20px] h-[20px]" />
                </NavButton>
            </div>
        </nav>
    );
};

export default SideNavbar;
