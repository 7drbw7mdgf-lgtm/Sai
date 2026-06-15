
import React, { useMemo, useState } from 'react';
import { ProjectData, Experiment, ExperimentStatus, ExperimentVariant } from '../types';
import Tooltip from './Tooltip';
import { TrashIcon } from './icons/TrashIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import PillAccordion from './PillAccordion';
import { BeakerIcon } from './icons/BeakerIcon';
import TagInput from './TagInput';

interface ExperimentDetailPanelProps {
    experimentId: string;
    projectData: ProjectData;
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    onClose: () => void;
    onDelete: (experimentId: string) => void;
    onRemoveLink: (experimentId: string, taskId: string) => void;
}

const ExperimentDetailPanel: React.FC<ExperimentDetailPanelProps> = ({
    experimentId,
    projectData,
    onSetData,
    onClose,
    onDelete,
    onRemoveLink
}) => {
    const experiment = useMemo(() => (projectData.experiments || []).find(e => e.id === experimentId), [experimentId, projectData.experiments]);

    if (!experiment) return null;

    const updateExperiment = (updates: Partial<Experiment>) => {
        onSetData(prev => {
            if (!prev || !prev.experiments) return prev;
            return {
                ...prev,
                experiments: prev.experiments.map(exp => exp.id === experimentId ? { ...exp, ...updates } : exp)
            };
        });
    };
    
    const addVariant = () => {
        const newVariant: ExperimentVariant = {
            id: `v-${Date.now()}`,
            name: `New Variant`,
            split: 0,
        };
        updateExperiment({ variants: [...experiment.variants, newVariant] });
    };
    
    const removeVariant = (variantId: string) => {
        const newVariants = experiment.variants.filter(v => v.id !== variantId);
        updateExperiment({ variants: newVariants });
    };

    const updateVariant = (variantId: string, field: 'name' | 'split', value: string | number) => {
         const newVariants = experiment.variants.map(v => {
            if (v.id === variantId) {
                const updatedValue = field === 'split' ? Math.max(0, Math.min(100, Number(value))) : value;
                return { ...v, [field]: updatedValue };
            }
            return v;
        });
        updateExperiment({ variants: newVariants });
    }

    const linkedTasks = useMemo(() => {
        return (experiment.linkedTasks || []).map(taskId => 
            projectData.tasks.find(t => t.id === taskId)
        ).filter((t): t is NonNullable<typeof t> => !!t);
    }, [experiment.linkedTasks, projectData.tasks]);


    return (
        <div className="h-full bg-gray-50 border-l border-gray-200 flex flex-col w-full animate-slide-in-right">
            <header className="flex-shrink-0 px-4 border-b border-gray-200 flex justify-between items-center h-16">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <BeakerIcon className="w-6 h-6 text-gray-500" />
                    Edit Experiment
                </h2>
                <Tooltip text="Close (Esc)">
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                        <XCircleIcon className="w-6 h-6"/>
                    </button>
                </Tooltip>
            </header>

            <div className="flex-grow p-6 overflow-y-auto space-y-6">
                <input 
                    type="text" 
                    value={experiment.name}
                    onChange={e => updateExperiment({ name: e.target.value })}
                    className="text-2xl font-bold text-gray-800 bg-transparent focus:outline-none w-full border-b-2 border-transparent focus:border-blue-500 -ml-1 p-1 transition-colors"
                />

                <PillAccordion title="Details" defaultOpen>
                     <div className="p-1 space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                            <select 
                                value={experiment.status} 
                                onChange={e => updateExperiment({ status: e.target.value as ExperimentStatus })}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {Object.values(ExperimentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Hypothesis</label>
                            <textarea 
                                value={experiment.hypothesis} 
                                onChange={e => updateExperiment({ hypothesis: e.target.value })} 
                                placeholder="We believe that... will result in..." 
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Key Metrics</label>
                            <TagInput tags={experiment.metrics} onChange={metrics => updateExperiment({ metrics })} placeholder="e.g., Conversion Rate..." />
                        </div>
                     </div>
                </PillAccordion>
                
                <PillAccordion title="Variants" defaultOpen>
                    <div className="p-1 space-y-2">
                        {experiment.variants.map((variant) => (
                            <div key={variant.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                <input
                                    type="text"
                                    value={variant.name}
                                    onChange={e => updateVariant(variant.id, 'name', e.target.value)}
                                    className="w-1/2 bg-gray-50 border-gray-200 rounded px-2 py-1 text-sm"
                                />
                                <input
                                    type="number"
                                    value={variant.split}
                                    onChange={e => updateVariant(variant.id, 'split', parseInt(e.target.value) || 0)}
                                    className="w-1/4 bg-gray-50 border-gray-200 rounded px-2 py-1 text-sm"
                                    min="0"
                                    max="100"
                                />
                                <span className="text-sm font-semibold text-gray-500">%</span>
                                 <button onClick={() => removeVariant(variant.id)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        ))}
                         <button onClick={addVariant} className="text-sm font-semibold text-blue-600 hover:text-blue-800 mt-2">
                            + Add Variant
                        </button>
                    </div>
                </PillAccordion>

                <PillAccordion title="Linked Tasks">
                    <div className="p-1 space-y-2">
                        {linkedTasks.length > 0 ? linkedTasks.map(task => (
                            <div key={task.id} className="group flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                                <span className="font-medium text-sm text-gray-700">{task.name}</span>
                                <button onClick={() => onRemoveLink(experiment.id, task.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <XCircleIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        )) : <p className="text-sm text-gray-400 text-center py-4">No tasks linked.</p>}
                    </div>
                </PillAccordion>
            </div>
            
             <footer className="flex-shrink-0 p-4 border-t border-gray-200 flex justify-between items-center bg-white/50">
                <button
                    onClick={() => onDelete(experiment.id)}
                    className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors font-semibold text-red-600 border border-red-200 flex items-center gap-2"
                >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                </button>
                <button onClick={onClose} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors font-semibold text-white shadow-sm">Done</button>
            </footer>
        </div>
    );
};

export default ExperimentDetailPanel;
