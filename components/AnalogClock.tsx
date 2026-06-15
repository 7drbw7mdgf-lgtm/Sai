
import React, { useState, useEffect } from 'react';

const AnalogClock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const seconds = time.getSeconds();
    const minutes = time.getMinutes();
    const hours = time.getHours();

    const secondHandRotation = seconds * 6;
    const minuteHandRotation = minutes * 6 + seconds * 0.1;
    const hourHandRotation = (hours % 12) * 30 + minutes * 0.5;

    return (
        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700/50 border-4 border-white dark:border-gray-800 shadow-inner relative">
            {/* Hour Hand */}
            <div
                className="absolute top-1/2 left-1/2 w-1 h-6 bg-gray-800 dark:bg-gray-200 rounded-full"
                style={{
                    transform: `rotate(${hourHandRotation}deg)`,
                    transformOrigin: 'bottom',
                    top: 'calc(50% - 1.5rem)',
                }}
            />
            {/* Minute Hand */}
            <div
                className="absolute top-1/2 left-1/2 w-0.5 h-8 bg-gray-600 dark:bg-gray-300 rounded-full"
                style={{
                    transform: `rotate(${minuteHandRotation}deg)`,
                    transformOrigin: 'bottom',
                    top: 'calc(50% - 2rem)',
                }}
            />
            {/* Second Hand */}
            <div
                className="absolute top-1/2 left-1/2 w-px h-10 bg-primary-500"
                style={{
                    transform: `rotate(${secondHandRotation}deg)`,
                    transformOrigin: 'bottom',
                    top: 'calc(50% - 2.5rem)',
                }}
            />
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-200 rounded-full" />
        </div>
    );
};

export default AnalogClock;
