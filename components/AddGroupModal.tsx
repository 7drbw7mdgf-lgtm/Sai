

import React, { useState } from 'react';
import Modal from './Modal';
import { Group } from '../types';
import { TASK_COLORS } from '../constants';
import ColorSwatchPicker from './ColorSwatchPicker';

interface AddGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newGroup: Group) => void;
}

const AddGroupModal: React.FC<AddGroupModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)]);

    const handleSave = () => {
        if (!name.trim()) {
            alert('Please enter a group name.');
            return;
        }
        onSave({
            id: `g-${Date.now()}`,
            name: name.trim(),
            color: color,
        });
        onClose();
        setName('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Group">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Group Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="e.g., Marketing Campaign" 
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Color</label>
                    <ColorSwatchPicker selectedColor={color} onSelectColor={setColor} />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-2">
                    <button onClick={onClose} className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors font-semibold text-gray-700 border border-gray-200">Cancel</button>
                    <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-semibold text-white shadow-sm">Add Group</button>
                </div>
            </div>
        </Modal>
    );
};

export default AddGroupModal;