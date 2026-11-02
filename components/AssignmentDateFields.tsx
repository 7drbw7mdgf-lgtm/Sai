import React, { useState } from 'react';
import DatePicker from './DatePicker';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';

interface AssignmentDateFieldsProps {
    startDate: Date;
    endDate: Date;
    onStartChange: (date: Date) => void;
    onEndChange: (date: Date) => void;
    minDate?: Date;
    maxDate?: Date;
}

// Start and end fields that share one calendar, shown in the form's flow so a scrolling panel can't clip it.
const AssignmentDateFields: React.FC<AssignmentDateFieldsProps> = ({ startDate, endDate, onStartChange, onEndChange, minDate, maxDate }) => {
    const [openField, setOpenField] = useState<'start' | 'end' | null>(null);

    const fields = [
        { id: 'start', label: 'Assignment start date', date: startDate },
        { id: 'end', label: 'Assignment end date', date: endDate },
    ] as const;

    const handleChange = (date: Date) => {
        if (openField === 'start') {
            onStartChange(date);
            if (date > endDate) onEndChange(date);
        } else {
            onEndChange(date);
        }
        setOpenField(null);
    };

    return (
        <>
            <div className="grid grid-cols-2 gap-2">
                {fields.map(({ id, label, date }) => (
                    <button
                        key={id}
                        type="button"
                        aria-label={label}
                        aria-expanded={openField === id}
                        onClick={() => setOpenField(open => open === id ? null : id)}
                        className={`w-full flex items-center justify-between gap-2 bg-white dark:bg-gray-700 border rounded-md px-2 py-1 text-sm text-left text-gray-800 dark:text-gray-100 ${openField === id ? 'border-accent' : 'border-gray-300 dark:border-gray-600'}`}
                    >
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <CalendarDaysIcon className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                    </button>
                ))}
            </div>
            {openField && (
                <div className="flex justify-center rounded-md border border-gray-200 bg-white p-3 dark:border-gray-600">
                    <DatePicker
                        key={openField}
                        isInline
                        selectedDate={openField === 'start' ? startDate : endDate}
                        minDate={openField === 'start' ? minDate : startDate}
                        maxDate={maxDate}
                        onChange={handleChange}
                        onClose={() => {}}
                    />
                </div>
            )}
        </>
    );
};

export default AssignmentDateFields;
