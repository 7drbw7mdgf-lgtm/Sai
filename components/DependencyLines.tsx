
import React from 'react';

interface Point {
    x: number;
    y: number;
}

interface Dependency {
    sourceId: string;
    targetId: string;
    start: Point;
    end: Point;
}

interface DependencyLinesProps {
    dependencies: Dependency[];
    onRemoveDependency?: (sourceId: string, targetId: string) => void;
}

const DependencyLines: React.FC<DependencyLinesProps> = ({ dependencies, onRemoveDependency }) => {
    
    const getPathData = (start: Point, end: Point): string => {
        const curvature = 40;
        // If the target is behind the source, we need a bigger curve loop to avoid cutting through
        const dist = Math.abs(end.x - start.x);
        
        // Control Points for Bezier Curve (C)
        // cp1 extends to the right from start
        // cp2 extends from the left of end
        
        const cp1 = { x: start.x + curvature, y: start.y };
        const cp2 = { x: end.x - curvature, y: end.y };

        // If the target is very close or behind horizontally, adjust control points to loop
        if (end.x < start.x + 20) {
             // Loop back logic could be added here, but simple bezier often handles "S" shapes gracefully enough for visuals
             cp1.x = start.x + Math.max(curvature, dist / 2);
             cp2.x = end.x - Math.max(curvature, dist / 2);
        }

        return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
    };
    
    const getMidPoint = (start: Point, end: Point): Point => {
        // Estimate mid point on the bezier curve (t=0.5)
        const t = 0.5;
        const curvature = 40;
        const cp1 = { x: start.x + curvature, y: start.y };
        const cp2 = { x: end.x - curvature, y: end.y };
        
        if (end.x < start.x + 20) {
             const dist = Math.abs(end.x - start.x);
             cp1.x = start.x + Math.max(curvature, dist / 2);
             cp2.x = end.x - Math.max(curvature, dist / 2);
        }

        // Bezier formula for x and y
        const x = Math.pow(1-t, 3)*start.x + 3*Math.pow(1-t, 2)*t*cp1.x + 3*(1-t)*Math.pow(t, 2)*cp2.x + Math.pow(t, 3)*end.x;
        const y = Math.pow(1-t, 3)*start.y + 3*Math.pow(1-t, 2)*t*cp1.y + 3*(1-t)*Math.pow(t, 2)*cp2.y + Math.pow(t, 3)*end.y;
        
        return { x, y };
    }

    return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
                <marker
                    id="arrow-head"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
                </marker>
            </defs>
            {dependencies.map((dep, index) => {
                const pathData = getPathData(dep.start, dep.end);
                const midPoint = getMidPoint(dep.start, dep.end);
                
                return (
                    <g key={index} className="group pointer-events-auto">
                        {/* Invisible wide stroke for easier hovering */}
                        <path d={pathData} stroke="transparent" strokeWidth="15" fill="none" />
                        
                        {/* The visible line */}
                        <path
                            d={pathData}
                            stroke="#9ca3af"
                            strokeWidth="1.5"
                            fill="none"
                            markerEnd="url(#arrow-head)"
                            className="group-hover:stroke-blue-500 transition-colors"
                        />
                        
                        {onRemoveDependency && (
                            <g
                                onClick={(e) => { e.stopPropagation(); onRemoveDependency(dep.sourceId, dep.targetId); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <circle cx={midPoint.x} cy={midPoint.y} r="8" className="fill-white dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600" strokeWidth="1" />
                                <path 
                                    d={`M ${midPoint.x - 3} ${midPoint.y - 3} L ${midPoint.x + 3} ${midPoint.y + 3}`} 
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" 
                                    className="text-gray-400 hover:text-red-500"
                                />
                                <path 
                                    d={`M ${midPoint.x + 3} ${midPoint.y - 3} L ${midPoint.x - 3} ${midPoint.y + 3}`} 
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" 
                                    className="text-gray-400 hover:text-red-500"
                                />
                            </g>
                        )}
                    </g>
                );
            })}
        </svg>
    );
};

export default DependencyLines;
