import React from 'react';
import AnalogClock from '../AnalogClock';
import WeatherWidget from '../WeatherWidget';

const ClockWeatherWidget: React.FC = () => {
    return (
        <div className="h-full flex flex-col sm:flex-row items-center justify-around p-4">
            <AnalogClock />
            <WeatherWidget />
        </div>
    );
};

export default ClockWeatherWidget;