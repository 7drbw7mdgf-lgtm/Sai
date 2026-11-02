import React from 'react';

export const LINE = 'border-[#e6e6e2] dark:border-gray-800';
export const FIELD = 'h-[33px] rounded-[3px] border border-[#cfcfc9] dark:border-gray-600 bg-white dark:bg-gray-800 px-2 text-[13px] text-[#292c31] dark:text-gray-100 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent';
const BUTTON = 'inline-flex min-h-[31px] min-w-[88px] items-center justify-center rounded-[3px] px-4 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-default disabled:opacity-50';
export const BUTTON_PRIMARY = `${BUTTON} bg-accent text-white hover:bg-accent-hover`;
export const BUTTON_SECONDARY = `${BUTTON} border border-[#cfcfc9] dark:border-gray-600 bg-white dark:bg-gray-800 text-[#292c31] dark:text-gray-100 hover:bg-[#f0efeb] dark:hover:bg-gray-700`;

export const OptionsGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section data-settings-group={title} className="flex flex-col gap-3.5">
        <h3 className="flex items-center gap-3 text-[13px] font-semibold text-[#292c31] dark:text-gray-100">
            {title}
            <span className="h-px flex-1 bg-[#e6e6e2] dark:bg-gray-800" />
        </h3>
        {children}
    </section>
);

export const FormRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <label className="grid grid-cols-1 items-center gap-2 text-[13px] text-[#50564d] dark:text-gray-300 min-[721px]:grid-cols-[155px_minmax(0,1fr)] min-[721px]:gap-5">
        <span>{label}</span>
        <div className="flex min-w-0 items-center gap-2">{children}</div>
    </label>
);
