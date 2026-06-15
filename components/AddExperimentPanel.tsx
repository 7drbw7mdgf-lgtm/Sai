
import React, { useState } from 'react';
import { Experiment, ExperimentStatus, ExperimentVariant } from '../types';
import { BeakerIcon } from './icons/BeakerIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { TrashIcon } from './icons/TrashIcon';
import Tooltip from './Tooltip';
import TagInput from './TagInput';

interface AddExperimentPanelProps {
    onClose: () => void;
    onSave: (newExperiment: Experiment) => void;
}

const AddExperimentPanel: React.FC<AddExperimentPanelProps> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [hypothesis, setHypothesis] = useState('');
    const [metrics, setMetrics] = useState<string[]>([]);
    const [variants, setVariants] = useState<Partial<ExperimentVariant>[]>([
        { name: 'Control', split: 50 },
        { name: 'Variant A', split: 50 },
    ]);

    const handleSave = () => {
        if (!name.trim() || !hypothesis.trim()) {
            alert('Please provide a name and hypothesis.');
            return;
        }
        const totalSplit = variants.reduce((sum, v) => sum + (v.split || 0), 0);
        if (totalSplit !== 100) {
            alert('Variant splits must add up to 100%.');
            return;
        }

        const newExperiment: Experiment = {
            id: `exp-${Date.now()}`,
            name: name.trim(),
            hypothesis: hypothesis.trim(),
            metrics,
            status: ExperimentStatus.Planning,
            variants: variants.map((v, i) => ({
                id: `v-${Date.now()}-${i}`,
                name: v.name || `Variant ${i + 1}`,
                split: v.split || 0,
            })),
            linkedTasks: [],
        };
        onSave(newExperiment);
        onClose();
    };

    const updateVariant = (index: number, field: keyof ExperimentVariant, value: string | number) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setVariants(newVariants);
    };
    
    const addVariant = () => {
        setVariants([...variants, { name: '', split: 0 }]);
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    return (
        <div className="h-full bg-gray-50 border-l border-gray-200 flex flex-col w-full animate-slide-in-right">
            <header className="flex-shrink-0 px-4 border-b border-gray-200 flex justify-between items-center h-16">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <BeakerIcon className="w-6 h-6 text-gray-500" />
                    New Experiment
                </h2>
                <Tooltip text="Close (Esc)">
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                        <XCircleIcon className="w-6 h-6"/>
                    </button>
                </Tooltip>
            </header>

            <div className="flex-grow p-6 overflow-y-auto space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Experiment Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., New Checkout Flow" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Hypothesis</label>
                    <textarea value={hypothesis} onChange={e => setHypothesis(e.target.value)} placeholder="We believe that... will result in..." className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Key Metrics</label>
                    <TagInput tags={metrics} onChange={setMetrics} placeholder="e.g., Conversion Rate, AOV..." />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Variants</label>
                    <div className="space-y-2">
                        {variants.map((variant, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                <input
                                    type="text"
                                    value={variant.name}
                                    onChange={e => updateVariant(index, 'name', e.target.value)}
                                    placeholder={`Variant ${index + 1}`}
                                    className="w-1/2 bg-gray-50 border-gray-200 rounded px-2 py-1 text-sm"
                                />
                                <input
                                    type="number"
                                    value={variant.split || ''}
                                    onChange={e => updateVariant(index, 'split', parseInt(e.target.value) || 0)}
                                    className="w-1/4 bg-gray-50 border-gray-200 rounded px-2 py-1 text-sm"
                                    min="0"
                                    max="100"
                                />
                                <span className="text-sm font-semibold text-gray-500">%</span>
                                <button onClick={() => removeVariant(index)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        ))}
                        <button onClick={addVariant} className="text-sm font-semibold text-blue-600 hover:text-blue-800 mt-2">
                            + Add Variant
                        </button>
                    </div>
                </div>
            </div>
            
            <footer className="flex-shrink-0 p-4 border-t border-gray-200 flex justify-end gap-3 bg-white/50">
                <button onClick={onClose} className="px-5 py-2 rounded-lg bg-white hover:bg-gray-100 transition-colors font-semibold text-gray-700 border border-gray-200">Cancel</button>
                <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors font-semibold text-white shadow-sm">Create Experiment</button>
            </footer>
        </div>
    );
};

export default AddExperimentPanel;
