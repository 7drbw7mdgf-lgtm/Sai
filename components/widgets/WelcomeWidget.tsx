import React from 'react';
import { WidgetLayout } from '../../types';

interface WelcomeWidgetProps {
    layout: WidgetLayout;
}

const WelcomeWidget: React.FC<WelcomeWidgetProps> = ({ layout }) => {
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    const getGreeting = () => {
        const hour = today.getHours();
        if (hour < 12) return "Good Morning, Alice!";
        if (hour < 18) return "Good Afternoon, Alice!";
        return "Good Evening, Alice!";
    };

    const bgClass = layout.config?.bg || 'bg-gradient-to-br from-blue-500 to-indigo-600';

    return (
        <div className={`h-full flex flex-col justify-center p-6 text-white ${bgClass}`}>
            <h1 className="text-3xl font-bold">{getGreeting()}</h1>
            <p className="opacity-80">{dateString}</p>
        </div>
    );
};

export default WelcomeWidget;