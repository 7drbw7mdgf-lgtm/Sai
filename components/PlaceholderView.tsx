
import React from 'react';

interface PlaceholderViewProps {
    title: string;
    message: string;
}

const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, message }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-white text-gray-800">
            <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-200 max-w-lg">
                <h1 className="text-3xl font-bold text-gray-700">{title}</h1>
                <p className="mt-4 text-md text-gray-500">{message}</p>
                 <div className="mt-6 text-lg font-mono animate-pulse text-blue-500">
                    (¬‿¬)
                </div>
            </div>
        </div>
    );
};

export default PlaceholderView;
