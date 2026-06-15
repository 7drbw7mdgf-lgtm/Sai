
import React, { useState } from 'react';
import Modal from './Modal';
import { CustomField, CustomFieldType } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface TableCustomizationHubProps {
    isOpen: boolean;
    onClose: () => void;
    customFields: CustomField[];
    visibleColumns: string[];
    allPossibleColumns: { id: string, title: string }[];
    onSave: (data: { fields: CustomField[], visible: string[] }) => void;
}

const fieldTypes: CustomFieldType[] = ['Text', 'Number', 'Date', 'Select'];

const TableCustomizationHub: React.FC<TableCustomizationHubProps> = ({ isOpen, onClose, customFields, visibleColumns, allPossibleColumns, onSave }) => {
    const [fields, setFields] = useState<CustomField[]>(() => JSON.parse(JSON.stringify(customFields)));
    const [visible, setVisible] = useState<string[]>(() => [...visibleColumns]);

    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState<CustomFieldType>('Text');

    const handleAddField = () => {
        if (!newFieldName.trim()) return;
        const newField: CustomField = {
            id: `cf-${Date.now()}`,
            name: newFieldName.trim(),
            type: newFieldType,
            ...(newFieldType === 'Select' && { options: [] })
        };
        setFields([...fields, newField]);
        setNewFieldName('');
    };

    const handleRemoveField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const handleUpdateField = (id: string, updates: Partial<CustomField>) => {
        setFields(fields.map(f => (f.id === id ? { ...f, ...updates } : f)));
    };

    const handleUpdateSelectOptions = (id: string, optionsString: string) => {
        const options = optionsString.split(',').map(o => o.trim()).filter(Boolean);
        handleUpdateField(id, { options });
    };

    const toggleColumn = (colId: string) => {
        setVisible(prev =>
            prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]
        );
    };

    const handleConfirm = () => {
        onSave({ fields, visible });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customize Table" maxWidth="max-w-4xl">
            <div className="flex gap-8 max-h-[70vh]">
                {/* Left Panel: Manage Fields */}
                <div className="w-2/3 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Manage Fields</h3>
                    <div className="flex-grow overflow-y-auto pr-3 space-y-3">
                        {fields.map(field => (
                            <div key={field.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={field.name}
                                        onChange={(e) => handleUpdateField(field.id, { name: e.target.value })}
                                        className="flex-grow bg-white border border-gray-300 rounded-md px-2 py-1 text-sm"
                                    />
                                    <select
                                        value={field.type}
                                        onChange={(e) => handleUpdateField(field.id, { type: e.target.value as CustomFieldType })}
                                        className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm"
                                    >
                                        {fieldTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                    <button onClick={() => handleRemoveField(field.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                {field.type === 'Select' && (
                                    <input
                                        type="text"
                                        placeholder="Comma-separated options (e.g., A, B, C)"
                                        value={field.options?.join(', ') || ''}
                                        onChange={(e) => handleUpdateSelectOptions(field.id, e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-sm mt-1"
                                    />
                                )}
                            </div>
                        ))}
                         {fields.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No custom fields created yet.</p>}
                    </div>
                     <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Add New Field</h4>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={newFieldName}
                                onChange={(e) => setNewFieldName(e.target.value)}
                                placeholder="Field Name"
                                className="flex-grow bg-white border border-gray-300 rounded-md px-2 py-1 text-sm"
                            />
                            <select
                                value={newFieldType}
                                onChange={(e) => setNewFieldType(e.target.value as CustomFieldType)}
                                className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm"
                            >
                                {fieldTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                            <button onClick={handleAddField} disabled={!newFieldName.trim()} className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300">
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Visible Columns */}
                <div className="w-1/3 border-l border-gray-200 pl-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Visible Columns</h3>
                     <div className="overflow-y-auto space-y-1">
                        {allPossibleColumns.map(col => (
                            <label key={col.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                                <input type="checkbox" checked={visible.includes(col.id)} onChange={() => toggleColumn(col.id)} className="form-checkbox h-4 w-4 rounded text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">{col.title}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                <button onClick={onClose} className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700">Cancel</button>
                <button onClick={handleConfirm} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold text-white">Save Changes</button>
            </div>
        </Modal>
    );
};

export default TableCustomizationHub;
