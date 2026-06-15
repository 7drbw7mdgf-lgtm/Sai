
import React from 'react';
import { Experiment, ExperimentStatus, ProjectData } from '../types';
import { DesignLayoutNode } from '../types';
import { BeakerIcon } from './icons/BeakerIcon';
import { EXPERIMENT_STATUS_COLORS } from '../constants';
import Tooltip from './Tooltip';
import { LinkIcon } from './icons/LinkIcon';
import ExperimentActionsMenu from './ExperimentActionsMenu';

interface ExperimentNodeProps {
    experiment: Experiment;
    layout: DesignLayoutNode;
    onDragStart: (e: React.MouseEvent) => void;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    isDragging: boolean;
    onRequestEdit: (experimentId: string) => void;
    onDelete: (experimentId: string) => void;
    onStartLink: (experimentId: string) => void;
}

const ExperimentNode: React.FC<ExperimentNodeProps> = ({ 
    experiment, 
    layout, 
    onDragStart, 
    onSetData, 
    isDragging,
    onRequestEdit,
    onDelete,
    onStartLink,
}) => {
    
    const statusStyle = EXPERIMENT_STATUS_COLORS[experiment.status];

    const updateVariantSplit = (variantId: string, newSplit: number) => {
        onSetData(prev => {
            if (!prev || !prev.experiments) return prev;
            
            // Ensure split is within bounds
            const cleanSplit = Math.max(0, Math.min(100, newSplit));

            return {
                ...prev,
                experiments: prev.experiments.map(exp => {
                    if (exp.id !== experiment.id) return exp;
                    const newVariants = exp.variants.map(v => v.id === variantId ? {...v, split: cleanSplit} : v);
                    return {...exp, variants: newVariants};
                })
            }
        });
    }

    if (!layout) return null;

    return (
        <div
            className={`absolute w-[400px] bg-white rounded-2xl shadow-xl border border-gray-200 cursor-grab transition-shadow duration-300 ${isDragging ? 'dragging-node' : ''}`}
            style={{
                left: layout.x,
                top: layout.y,
            }}
            onMouseDown={onDragStart}
            onDoubleClick={() => onRequestEdit(experiment.id)}
        >
             <div className="absolute top-2 right-2 z-10 no-drag">
                <ExperimentActionsMenu
                    onEdit={() => onRequestEdit(experiment.id)}
                    onLink={() => onStartLink(experiment.id)}
                    onDelete={() => onDelete(experiment.id)}
                />
            </div>
            <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 pr-8">
                        <BeakerIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        <h3 className="font-bold text-lg text-gray-800 break-words">{experiment.name}</h3>
                    </div>
                    <div className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}>
                        {experiment.status}
                    </div>
                </div>
                <p className="text-sm text-gray-600 mt-2 ml-9">{experiment.hypothesis}</p>
            </div>
            <div className="p-4 space-y-4">
                <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-2">Metrics</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {experiment.metrics.map(metric => (
                            <span key={metric} className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">{metric}</span>
                        ))}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-2">Variants</h4>
                    <div className="space-y-3">
                        {experiment.variants.map(variant => (
                             <div key={variant.id} className="flex items-center gap-3">
                                <span className="font-medium text-sm text-gray-800 w-2/5 truncate">{variant.name}</span>
                                <input 
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={variant.split}
                                    onChange={(e) => updateVariantSplit(variant.id, parseInt(e.target.value))}
                                    className="flex-grow h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer no-drag"
                                />
                                <span className="text-sm font-semibold text-gray-600 w-10 text-right">{variant.split}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExperimentNode;
