import React from 'react';

export const OutlookIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="20" height="18" rx="3" fill="#0078D4" />
            <path d="M2 7.5L12 13.5L22 7.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="14" r="5" fill="#005A9E" stroke="#FFFFFF" strokeWidth="1" />
            <text x="12" y="16.5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">O</text>
        </svg>
    );
};

export default OutlookIcon;
