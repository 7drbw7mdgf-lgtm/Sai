import React from 'react';

export const GoogleCalendarIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Blue background box */}
            <rect x="2" y="3" width="20" height="19" rx="3" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
            <path d="M2 7C2 5.34315 3.34315 4 5 4H19C20.6569 4 22 5.34315 22 7V8H2V7Z" fill="#4285F4" />
            {/* Top hanging rings */}
            <rect x="6" y="2" width="2" height="4" rx="1" fill="#1967D2" />
            <rect x="16" y="2" width="2" height="4" rx="1" fill="#1967D2" />
            {/* Calendar '31' / Google color accents */}
            <rect x="4" y="10" width="3" height="3" rx="0.5" fill="#4285F4" />
            <rect x="8.5" y="10" width="3" height="3" rx="0.5" fill="#34A853" />
            <rect x="13" y="10" width="3" height="3" rx="0.5" fill="#FBBC04" />
            <rect x="17.5" y="10" width="3" height="3" rx="0.5" fill="#EA4335" />
            
            <rect x="4" y="14.5" width="3" height="3" rx="0.5" fill="#9AA0A6" />
            <rect x="8.5" y="14.5" width="3" height="3" rx="0.5" fill="#4285F4" />
            <rect x="13" y="14.5" width="3" height="3" rx="0.5" fill="#34A853" />
            <rect x="17.5" y="14.5" width="3" height="3" rx="0.5" fill="#FBBC04" />
        </svg>
    );
};

export default GoogleCalendarIcon;
