import React from 'react';

// Relative so it resolves under any base path, including the hosted /sai/ build.
const LabtrailLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <img src="labtrail-logo.svg" alt="" aria-hidden="true" className={`flex-shrink-0 ${className}`} />
);

export default LabtrailLogo;
