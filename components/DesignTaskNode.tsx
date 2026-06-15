
import React from 'react';
import { Task } from '../types';
import { DesignLayoutNode } from '../types';

interface DesignTaskNodeProps {
    task: Task;
    layout: DesignLayoutNode;
    onDragStart: (e: React.MouseEvent) => void;
    onClick: () => void;
    isDragging: boolean;
    isLinkTarget?: boolean;
}

const DesignTaskNode: React.FC<DesignTaskNodeProps> = ({ task, layout, onDragStart, onClick, isDragging, isLinkTarget }) => {
    if (!layout) return null;

    return (
        <div
            className={`absolute px-4 py-2 bg-white rounded-lg shadow-md border-2 flex items-center gap-3 transition-all duration-300 
                ${isDragging ? 'dragging-node' : 'hover:shadow-lg'}
                ${isLinkTarget ? 'ring-2 ring-green-400 ring-offset-2 cursor-pointer' : 'cursor-grab'}
            `}
            style={{
                left: layout.x,
                top: layout.y,
                borderColor: task.color,
            }}
            onMouseDown={onDragStart}
            onClick={onClick}
        >
            <div className="font-semibold text-sm text-gray-800 truncate">{task.name}</div>
        </div>
    );
};

export default DesignTaskNode;
