
import React from 'react';
import Modal from './Modal';

interface ShortcutHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const Shortcut: React.FC<{ keys: string[]; description: string }> = ({ keys, description }) => (
    <li className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
        <span className="text-gray-600">{description}</span>
        <div className="flex items-center gap-1">
            {keys.map((key, index) => (
                <React.Fragment key={key}>
                    {index > 0 && <span className="text-gray-400">+</span>}
                    <kbd className="px-2 py-1 text-sm font-semibold text-gray-700 bg-gray-200/60 border border-gray-300/60 rounded-md">
                        {key}
                    </kbd>
                </React.Fragment>
            ))}
        </div>
    </li>
);

const ShortcutHelpModal: React.FC<ShortcutHelpModalProps> = ({ isOpen, onClose }) => {
    const shortcuts = [
        { keys: ['/'], description: 'Focus search bar' },
        { keys: ['N'], description: 'Add a new task' },
        { keys: ['H'], description: 'Go to Home' },
        { keys: ['G'], description: 'Go to Gantt View' },
        { keys: ['T'], description: 'Go to Tasks View' },
        { keys: ['C'], description: 'Go to Calendar' },
        { keys: ['E'], description: 'Go to Notes View' },
        { keys: ['?'], description: 'Toggle this help menu' },
        { keys: ['Ctrl', 'Z'], description: 'Undo last action' },
        { keys: ['Ctrl', 'Y'], description: 'Redo last action' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" maxWidth="max-w-md">
            <ul className="space-y-1">
                {shortcuts.map(shortcut => (
                    <Shortcut key={shortcut.description} keys={shortcut.keys} description={shortcut.description} />
                ))}
            </ul>
        </Modal>
    );
};

export default ShortcutHelpModal;