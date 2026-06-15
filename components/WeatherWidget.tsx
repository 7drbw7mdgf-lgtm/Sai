
import React from 'react';
import WeatherIcon from './WeatherIcon';

const WeatherWidget: React.FC = () => {
    // Static data for demo purposes
    const weatherData = {
        city: 'San Francisco',
        temperature: 68,
        condition: 'PartlyCloudy', // or 'Sunny', 'Cloudy', 'Rainy', 'Stormy'
    };

    return (
        <div className="flex flex-col items-center">
            <div className="text-5xl font-bold text-gray-800 dark:text-gray-100">
                {weatherData.temperature}°
            </div>
            <div className="w-16 h-16 text-gray-700 dark:text-gray-200 -mt-2">
                <WeatherIcon weather={weatherData.condition} />
            </div>
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 -mt-2">
                {weatherData.city}
            </div>
        </div>
    );
};

export default WeatherWidget;
