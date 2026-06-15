import React from 'react';
import { LinkIcon } from '../icons/LinkIcon';

// This is a static widget for now.
const links = [
    { name: 'Design Specs', url: '#' },
    { name: 'Marketing Brief', url: '#' },
    { name: 'GitHub Repo', url: '#' },
];

const QuickLinksWidget: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-4">
            <h2 className="text-lg font-semibold mb-3 flex-shrink-0 px-2 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-gray-400" />
                Quick Links
            </h2>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                {links.map(link => (
                    <a href={link.url} key={link.name} target="_blank" rel="noopener noreferrer" className="block p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-blue-600 dark:text-blue-400 font-semibold text-sm truncate">
                        {link.name}
                    </a>
                ))}
            </div>
        </div>
    );
};

export default QuickLinksWidget;