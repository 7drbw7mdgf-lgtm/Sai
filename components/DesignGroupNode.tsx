
import React from 'react';
import { Group, Task, DesignLayoutGroupNode, DesignLayoutNode } from '../types';
import DesignTaskNode from './DesignTaskNode';

interface DesignGroupNodeProps {
    group: Group;
    tasks: Task[];
    layout: DesignLayoutGroupNode;
    taskLayouts: { [taskId: string]: DesignLayoutNode };
    onDragStart: (e: React.MouseEvent) => void;
    onTaskClick: (taskId: string) => void;
    isDragging: boolean;
    isLinkTarget?: boolean;
}

const DesignGroupNode: React.FC<DesignGroupNodeProps> = ({ group, tasks, layout, taskLayouts, onDragStart, onTaskClick, isDragging, isLinkTarget }) => {
    if (!layout) return null;

    const taskNodes = tasks.map(task => {
        const taskLayout = taskLayouts[task.id];
        if (!taskLayout) return null;
        
        // Calculate task position relative to the group container
        const relativeX = taskLayout.x - layout.x;
        const relativeY = taskLayout.y - layout.y;

        return (
             <DesignTaskNode
                key={task.id}
                task={task}
                layout={{x: relativeX, y: relativeY}}
                onDragStart={(e) => {
                    e.stopPropagation();
                    // To move the whole group, drag the group container itself.
                    onDragStart(e);
                }}
                onClick={() => onTaskClick(task.id)}
                isDragging={isDragging} // The task is part of the group drag
                isLinkTarget={isLinkTarget}
            />
        )
    })

    return (
        <div
            className={`absolute bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-300 transition-shadow duration-300 p-3 ${isDragging ? 'dragging-node' : ''}`}
            style={{
                left: layout.x,
                top: layout.y,
                width: layout.width,
                height: layout.height,
            }}
            onMouseDown={onDragStart}
        >
            <div className="font-bold text-lg text-gray-700 cursor-grab px-2" style={{ color: group.color }}>
                {group.name}
            </div>
            <div className="relative w-full h-full">
                {taskNodes}
            </div>
        </div>
    );
};

export default DesignGroupNode;
