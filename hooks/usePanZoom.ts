

import React, { useState, useCallback, useRef } from 'react';

export const usePanZoom = (
    containerRef: React.RefObject<HTMLElement>,
    initialZoom = 1,
    minZoom = 0.1,
    maxZoom = 4
) => {
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: initialZoom });
    const isPanning = useRef(false);
    const lastPoint = useRef({ x: 0, y: 0 });

    const pan = useCallback((dx: number, dy: number) => {
        setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
    }, []);

    const zoom = useCallback((delta: number, point: { x: number, y: number }) => {
        setTransform(t => {
            const newScale = Math.max(minZoom, Math.min(maxZoom, t.scale - delta * t.scale));
            if (newScale === t.scale) return t;

            const worldPos = {
                x: (point.x - t.x) / t.scale,
                y: (point.y - t.y) / t.scale
            };

            const newX = point.x - worldPos.x * newScale;
            const newY = point.y - worldPos.y * newScale;

            return { x: newX, y: newY, scale: newScale };
        });
    }, [minZoom, maxZoom]);
    
    const fitToScreen = useCallback((contentWidth: number, contentHeight: number, padding = 50) => {
        const container = containerRef.current;
        if (!container) return;

        const { clientWidth, clientHeight } = container;
        if (contentWidth === 0 || contentHeight === 0) return;

        const scaleX = (clientWidth - padding * 2) / contentWidth;
        const scaleY = (clientHeight - padding * 2) / contentHeight;
        const newScale = Math.min(scaleX, scaleY, maxZoom);

        const newX = (clientWidth - contentWidth * newScale) / 2;
        const newY = (clientHeight - contentHeight * newScale) / 2;
        
        setTransform({ x: newX, y: newY, scale: newScale });
    }, [containerRef, maxZoom]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        zoom(e.deltaY * 0.001, point);
    }, [zoom]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 1 && !(e.button === 0 && e.altKey) && !(e.target as HTMLElement).closest('.grab-pan')) return;
        
        // Prevent pan when interacting with an element that has its own drag/mouse events
        if ((e.target as HTMLElement).closest('.no-pan')) return;
        
        e.preventDefault();
        isPanning.current = true;
        lastPoint.current = { x: e.clientX, y: e.clientY };
        (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanning.current) return;
        e.preventDefault();
        const dx = e.clientX - lastPoint.current.x;
        const dy = e.clientY - lastPoint.current.y;
        pan(dx, dy);
        lastPoint.current = { x: e.clientX, y: e.clientY };
    }, [pan]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (!isPanning.current) return;
        isPanning.current = false;
        (e.currentTarget as HTMLElement).style.cursor = 'grab';
    }, []);

    return {
        transform,
        setTransform,
        pan,
        zoom,
        handleWheel,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        fitToScreen,
    };
};