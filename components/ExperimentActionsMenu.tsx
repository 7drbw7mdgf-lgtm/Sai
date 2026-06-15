
import React, { useState, useRef } from 'react';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { DotsVerticalIcon } from './icons/DotsVerticalIcon';
import { PencilIcon } from './icons/PencilIcon';
import { LinkIcon } from './icons/LinkIcon';
import { TrashIcon } from './icons/TrashIcon';
import Tooltip from './Tooltip';

interface ExperimentActionsMenuProps {
    onEdit: () => void;
    onLink: () => void;
    onDelete: () => void;
}

const ExperimentActionsMenu: React.FC<ExperimentActionsMenuProps> = ({ onEdit, onLink, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    useOnClickOutside(menuRef, () => setIsOpen(false));

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    return (
        <div ref={menuRef} className="relative">
            <Tooltip text="Actions">
                <button
                    onClick={() => setIsOpen(o => !o)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <DotsVerticalIcon className="w-5 h-5" />
                </button>
            </Tooltip>
            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-40 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/80 p-2 z-20 animate-fade-in">
                    <button
                        onClick={() => handleAction(onEdit)}
                        className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                        <PencilIcon className="w-4 h-4" /> Edit
                    </button>
                    <button
                        onClick={() => handleAction(onLink)}
                        className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                        <LinkIcon className="w-4 h-4" /> Link to Task
                    </button>
                    <div className="h-px bg-gray-200 my-1" />
                    <button
                        onClick={() => handleAction(onDelete)}
                        className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                    >
                        <TrashIcon className="w-4 h-4" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExperimentActionsMenu;
