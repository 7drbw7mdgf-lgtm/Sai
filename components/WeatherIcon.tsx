
import React from 'react';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon'; // Assuming night variants might be needed

const WeatherIcon: React.FC<{ weather: string }> = ({ weather }) => {
    switch (weather) {
        case 'Sunny':
            return <SunIcon className="w-full h-full" />;
        case 'PartlyCloudy':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-full h-full">
                    <path d="M46.5 31.5h-.32a10.49 10.49 0 00-19.11-8.43A8 8 0 0022.5 25.5a8.31 8.31 0 00.18 1.68 8 8 0 00-6.08 7.82 7.92 7.92 0 008 8h11.5a8.48 8.48 0 008.4-8.5 8.41 8.41 0 00-8.18-8.5z" fill="#e2e8f0" stroke="#94a3b8" strokeMiterlimit="10" strokeWidth="2"/>
                    <path d="M24.5 29.5a10.5 10.5 0 0121 0h.5a8.5 8.5 0 010 17h-22a8.5 8.5 0 010-17z" fill="#f8fafc" stroke="#94a3b8" strokeMiterlimit="10" strokeWidth="2"/>
                </svg>
            );
        case 'Cloudy':
             return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-full h-full">
                   <path d="M46.5 31.5h-.32a10.49 10.49 0 00-19.11-8.43A8 8 0 0022.5 25.5a8.31 8.31 0 00.18 1.68 8 8 0 00-6.08 7.82 7.92 7.92 0 008 8h11.5a8.48 8.48 0 008.4-8.5 8.41 8.41 0 00-8.18-8.5z" fill="#e2e8f0" stroke="#94a3b8" strokeMiterlimit="10" strokeWidth="2"/>
                </svg>
            );
        case 'Rainy':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-full h-full">
                    <path d="M46.5 31.5h-.32a10.49 10.49 0 00-19.11-8.43A8 8 0 0022.5 25.5a8.31 8.31 0 00.18 1.68 8 8 0 00-6.08 7.82 7.92 7.92 0 008 8h11.5a8.48 8.48 0 008.4-8.5 8.41 8.41 0 00-8.18-8.5z" fill="#e2e8f0" stroke="#94a3b8" strokeMiterlimit="10" strokeWidth="2"/>
                    <path d="M31 44v8m-6-6v8m12-8v8" fill="none" stroke="#60a5fa" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2"/>
                </svg>
            );
        default:
            return <SunIcon className="w-full h-full" />;
    }
};

export default WeatherIcon;
