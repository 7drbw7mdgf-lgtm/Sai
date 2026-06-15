

import React, { useState } from 'react';
import { Meeting, Person } from '../types';
import PillAccordion from './PillAccordion';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { PaintBrushIcon } from './icons/PaintBrushIcon';
import DatePicker from './DatePicker';
import Tooltip from './Tooltip';
import { XCircleIcon } from './icons/XCircleIcon';
import ColorSwatchPicker from './ColorSwatchPicker';

interface AddMeetingModalProps {
    onClose: () => void;
    onSave: (newMeeting: Meeting) => void;
    people: Person[];
}

const AddMeetingModal: React.FC<AddMeetingModalProps> = ({ onClose, onSave, people }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date());
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [attendees, setAttendees] = useState<string[]>([]);
    const [color, setColor] = useState('#818cf8'); // indigo-400
    const [agenda, setAgenda] = useState('');

    const handleSave = () => {
        if (!title.trim() || !date || !startTime || !endTime) {
            alert('Please fill out all meeting details.');
            return;
        }
        onSave({
            id: `m-${Date.now()}`,
            title: title.trim(),
            date,
            startTime,
            endTime,
            attendees,
            color,
            agenda,
        });
    };

    const togglePerson = (personId: string) => {
        setAttendees(prev =>
            prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
        );
    };

    return (
        <div className="h-full bg-gray-50 border-l border-gray-200 flex flex-col w-full animate-slide-in-right">
             <header className="flex-shrink-0 px-4 border-b border-gray-200 flex justify-between items-center h-16">
                <h2 className="text-xl font-bold text-gray-800">Schedule New Meeting</h2>
                <Tooltip text="Close (Esc)">
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                        <XCircleIcon className="w-6 h-6"/>
                    </button>
                </Tooltip>
            </header>

            <div className="flex-grow p-6 overflow-y-auto space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 ml-1">Meeting Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Weekly Sync" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <PillAccordion title={<><CalendarDaysIcon className="w-5 h-5 text-gray-500"/><span className="font-semibold">Date & Time</span></>} defaultOpen>
                    <div className="space-y-3 p-2">
                        <div className="flex items-center gap-4">
                            <label className="w-20 text-sm font-medium text-gray-500">Date</label>
                            <div className="relative w-full">
                                <button onClick={() => setIsDatePickerOpen(o => !o)} className="w-full text-left bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </button>
                                {isDatePickerOpen && (
                                    <DatePicker 
                                        selectedDate={date}
                                        onChange={(newDate) => { setDate(newDate); setIsDatePickerOpen(false); }}
                                        onClose={() => setIsDatePickerOpen(false)}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="w-20 text-sm font-medium text-gray-500">Start Time</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="w-20 text-sm font-medium text-gray-500">End Time</label>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                    </div>
                </PillAccordion>
                
                <PillAccordion title={<><UserCircleIcon className="w-5 h-5 text-gray-500"/><span className="font-semibold">Attendees</span></>} defaultOpen>
                    <div className="p-2">
                        <div className="flex flex-wrap gap-2">
                            {people.map(p => (
                                <button key={p.id} onClick={() => togglePerson(p.id)} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${attendees.includes(p.id) ? 'bg-blue-600 text-white shadow-sm' : 'bg-white hover:bg-gray-200 text-gray-700 border border-gray-200'}`}>
                                    <img src={p.avatarUrl} alt={p.name} className="w-5 h-5 rounded-full" />
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </PillAccordion>
                
                <PillAccordion title={<><DocumentTextIcon className="w-5 h-5 text-gray-500"/><span className="font-semibold">Agenda</span></>}>
                     <div className="p-2">
                        <textarea
                            value={agenda}
                            onChange={e => setAgenda(e.target.value)}
                            placeholder="Optional: Outline meeting topics..."
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                        />
                    </div>
                </PillAccordion>

                 <PillAccordion title={<><PaintBrushIcon className="w-5 h-5 text-gray-500"/><span className="font-semibold">Color Tag</span></>}>
                    <div className="p-2">
                        <ColorSwatchPicker selectedColor={color} onSelectColor={setColor} />
                    </div>
                </PillAccordion>
            </div>

            <footer className="flex-shrink-0 p-4 border-t border-gray-200 flex justify-end gap-3 bg-white/50">
                <button onClick={onClose} className="px-5 py-2 rounded-lg bg-white hover:bg-gray-100 transition-colors font-semibold text-gray-700 border border-gray-200">Cancel</button>
                <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-semibold text-white shadow-sm">Schedule Meeting</button>
            </footer>
        </div>
    );
};

export default AddMeetingModal;