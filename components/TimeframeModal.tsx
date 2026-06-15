

import React, { useState } from 'react';
import Modal from './Modal';
import { getDaysInMonth, getMonthName } from '../services/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/ChevronIcons';
import DatePickerPopup from './DatePickerPopup';

interface TimeframeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentStart: Date;
    currentEnd: Date;
    onSave: (start: Date, end: Date) => void;
}

const TimeframeModal: React.FC<TimeframeModalProps> = ({ isOpen, onClose, currentStart, currentEnd, onSave }) => {
    const [currentDate, setCurrentDate] = useState(new Date(currentStart));
    const [startDate, setStartDate] = useState<Date | null>(new Date(currentStart));
    const [endDate, setEndDate] = useState<Date | null>(new Date(currentEnd));
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handleDateClick = (day: number) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        if (!startDate || (startDate && endDate)) {
            setStartDate(clickedDate);
            setEndDate(null);
        } else if (startDate && !endDate) {
            if (clickedDate < startDate) {
                setEndDate(startDate);
                setStartDate(clickedDate);
            } else {
                setEndDate(clickedDate);
            }
        }
    };

    const isDateInRange = (day: number) => {
        if (!startDate) return false;
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const end = endDate || hoverDate;
        if (!end) return false;
        const s = startDate > end ? end : startDate;
        const e = startDate > end ? startDate : end;
        return date >= s && date <= e;
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const renderDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const blanks = Array(firstDayOfMonth).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return [...blanks, ...days].map((day, index) => {
            if (!day) return <div key={`blank-${index}`} className="w-10 h-10"></div>;
            const date = new Date(year, month, day);
            const isSelectedStart = startDate && date.getTime() === startDate.getTime();
            const isSelectedEnd = endDate && date.getTime() === endDate.getTime();

            return (
                <div key={day}
                    onMouseEnter={() => !endDate && setHoverDate(date)}
                    onMouseLeave={() => setHoverDate(null)}
                    onClick={() => handleDateClick(day)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-colors
                        ${isDateInRange(day) ? 'bg-blue-500/20 text-blue-800' : ''}
                        ${isSelectedStart ? '!bg-blue-600 text-white' : ''}
                        ${isSelectedEnd ? '!bg-blue-600 text-white' : ''}
                        ${!isDateInRange(day) ? 'hover:bg-gray-100' : ''}
                    `}
                >
                    {day}
                </div>
            );
        });
    };
    
    const handleConfirm = () => {
        if (startDate && endDate) {
            onSave(startDate, endDate);
            onClose();
        }
    }

    const canConfirm = startDate && endDate;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adjust Project Timeframe" maxWidth="max-w-md">
             <p className="text-sm text-gray-500 mb-6 -mt-4">Select a new start and end date for your project.</p>
            <div className="flex justify-between items-center w-full mb-4 px-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"><ChevronLeftIcon /></button>
                <div className="relative">
                    <button onClick={() => setIsPickerOpen(o => !o)} className="text-lg font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">{getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}</button>
                     {isPickerOpen && <DatePickerPopup displayDate={currentDate} setDisplayDate={setCurrentDate} onClose={() => setIsPickerOpen(false)} />}
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"><ChevronRightIcon /></button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-400 font-medium mb-2 w-full">
                <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
                {renderDays()}
            </div>
            <div className="flex justify-end space-x-3 pt-8 mt-4 border-t border-gray-200">
                <button onClick={onClose} className="px-5 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors font-semibold text-gray-700">Cancel</button>
                <button
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                    className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors font-semibold text-white shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Save Changes
                </button>
            </div>
        </Modal>
    );
};

export default TimeframeModal;