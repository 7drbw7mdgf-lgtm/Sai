import React from 'react';

// Relative so it resolves under any base path, including the hosted /sai/ build.
const BenchlineLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <img src="benchline-logo.svg" alt="" aria-hidden="true" className={`flex-shrink-0 ${className}`} />
);

export default BenchlineLogo;
