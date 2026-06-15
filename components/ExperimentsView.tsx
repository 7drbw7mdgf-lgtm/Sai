
import React, { useRef, useState, useCallback } from 'react';
import { ProjectData, DesignLayout, Task, Group, Experiment } from '../types';
import { usePanZoom } from '../hooks/usePanZoom';
import ExperimentNode from './ExperimentNode';
import DesignTaskNode from './DesignTaskNode';
import DesignGroupNode from './DesignGroupNode';

interface ExperimentsViewProps {
    projectData: ProjectData;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    onRequestEditExperiment: (experimentId: string) => void;
    onDeleteExperiment: (experimentId: string) => void;
    onStartLink: (experimentId: string) => void;
    onLinkTask: (taskId: string) => void;
    experimentLink: { fromExperimentId: string } | null;
}

const ExperimentsView: React.FC<ExperimentsViewProps> = ({ 
    projectData, 
    onSetData, 
    onRequestEditExperiment, 
    onDeleteExperiment,
    onStartLink,
    onLinkTask,
    experimentLink
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { transform, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp } = usePanZoom(containerRef, 0.8);
    
    const [draggedNode, setDraggedNode] = useState<{ id: string; type: 'task' | 'group' | 'experiment'; x: number; y: number } | null>(null);

    const { tasks, groups, experiments = [], designLayout } = projectData;

    const handleNodeDragStart = (e: React.MouseEvent, id: string, type: 'task' | 'group' | 'experiment') => {
        // Prevent starting a drag when clicking on interactive elements within a node
        if ((e.target as HTMLElement).closest('.no-drag')) return;
        
        e.preventDefault();
        e.stopPropagation();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        setDraggedNode({
            id,
            type,
            x: (e.clientX - rect.left - transform.x) / transform.scale,
            y: (e.clientY - rect.top - transform.y) / transform.scale,
        });
    };
    
    const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
        handleMouseMove(e); // For panning
        if (!draggedNode) return;
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const newX = (e.clientX - rect.left - transform.x) / transform.scale - (draggedNode.x - (designLayout?.[draggedNode.type + 's' as 'tasks' | 'groups' | 'experiments']?.[draggedNode.id]?.x || 0));
        const newY = (e.clientY - rect.top - transform.y) / transform.scale - (draggedNode.y - (designLayout?.[draggedNode.type + 's' as 'tasks' | 'groups' | 'experiments']?.[draggedNode.id]?.y || 0));
        
        onSetData(prev => {
            if (!prev || !prev.designLayout) return prev;
            
            const layoutKey = `${draggedNode.type}s` as 'tasks' | 'groups' | 'experiments';
            
            const newLayoutForType = {
                ...(prev.designLayout[layoutKey] || {}),
                [draggedNode.id]: {
                     ...(prev.designLayout[layoutKey]?.[draggedNode.id] || {}),
                    x: newX,
                    y: newY,
                }
            };
            
            const newDesignLayout = {
                ...prev.designLayout,
                [layoutKey]: newLayoutForType
            };
            
            return {
                ...prev,
                designLayout: newDesignLayout as DesignLayout
            };
        });

    }, [draggedNode, transform, onSetData, designLayout, handleMouseMove]);

    const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
        handleMouseUp(e);
        setDraggedNode(null);
    }, [handleMouseUp]);
    
    const ungroupedTasks = tasks.filter(task => !task.groupId || !groups.find(g => g.id === task.groupId));

    return (
        <div 
            ref={containerRef} 
            className="h-full w-full flex flex-col bg-gray-100 overflow-hidden relative grab-pan"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
        >
            {/* Background Grid */}
            <div className="absolute inset-0" style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                backgroundSize: `${40 * transform.scale}px ${40 * transform.scale}px`,
                backgroundImage: `radial-gradient(circle, #d1d5db ${1 * transform.scale}px, transparent ${1 * transform.scale}px)`,
            }}></div>

            {/* Content */}
            <div 
                className="absolute top-0 left-0" 
                style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
            >
                {/* Render Groups */}
                {groups.map(group => {
                    const groupTasks = tasks.filter(t => t.groupId === group.id);
                    return (
                        <DesignGroupNode
                            key={group.id}
                            group={group}
                            tasks={groupTasks}
                            layout={designLayout?.groups?.[group.id]}
                            taskLayouts={designLayout?.tasks || {}}
                            onDragStart={(e) => handleNodeDragStart(e, group.id, 'group')}
                            onTaskClick={onLinkTask}
                            isDragging={draggedNode?.id === group.id}
                            isLinkTarget={!!experimentLink}
                        />
                    );
                })}

                {/* Render Ungrouped Tasks */}
                {ungroupedTasks.map(task => (
                    <DesignTaskNode
                        key={task.id}
                        task={task}
                        layout={designLayout?.tasks?.[task.id]}
                        onDragStart={(e) => handleNodeDragStart(e, task.id, 'task')}
                        onClick={() => onLinkTask(task.id)}
                        isDragging={draggedNode?.id === task.id}
                        isLinkTarget={!!experimentLink}
                    />
                ))}

                {/* Render Experiments */}
                {experiments.map(exp => (
                    <ExperimentNode
                        key={exp.id}
                        experiment={exp}
                        layout={designLayout?.experiments?.[exp.id]}
                        onDragStart={(e) => handleNodeDragStart(e, exp.id, 'experiment')}
                        isDragging={draggedNode?.id === exp.id}
                        onSetData={onSetData}
                        onRequestEdit={onRequestEditExperiment}
                        onDelete={onDeleteExperiment}
                        onStartLink={onStartLink}
                    />
                ))}
            </div>
        </div>
    );
};

export default ExperimentsView;
