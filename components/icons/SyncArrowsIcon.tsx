import React from 'react';

export const SyncArrowsIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l6.73-1.19" />
        </svg>
    );
};

export default SyncArrowsIcon;
