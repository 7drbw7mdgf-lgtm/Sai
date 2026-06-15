
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface HorizontalScrollbarProps {
    scrollRef: React.RefObject<HTMLDivElement>;
}

const HorizontalScrollbar: React.FC<HorizontalScrollbarProps> = ({ scrollRef }) => {
    const thumbRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const [thumbWidth, setThumbWidth] = useState(0);
    const [thumbPosition, setThumbPosition] = useState(0);
    const dragInfo = useRef({ isDragging: false, startX: 0, startScrollLeft: 0 });

    const updateThumb = useCallback(() => {
        if (!scrollRef.current || !trackRef.current) return;
        const { scrollWidth, clientWidth, scrollLeft } = scrollRef.current;

        if (scrollWidth <= clientWidth) {
            setThumbWidth(0); // Hide thumb if not scrollable
            return;
        }

        const trackWidth = trackRef.current.clientWidth;
        const newThumbWidth = Math.max(20, (clientWidth / scrollWidth) * trackWidth);
        const maxThumbPosition = trackWidth - newThumbWidth;
        const newThumbPosition = (scrollLeft / (scrollWidth - clientWidth)) * maxThumbPosition;

        setThumbWidth(newThumbWidth);
        setThumbPosition(newThumbPosition);
    }, [scrollRef]);

    useEffect(() => {
        const scrollable = scrollRef.current;
        if (!scrollable) return;

        const observer = new ResizeObserver(updateThumb);
        observer.observe(scrollable);
        // We might need to observe children if their size changes dynamically without changing the scrollable's size
        // For now, observing the scrollable element itself and listening to its scroll event is sufficient.
        
        scrollable.addEventListener('scroll', updateThumb, { passive: true });
        window.addEventListener('resize', updateThumb); // Update on window resize as well
        updateThumb(); // Initial call

        return () => {
            observer.disconnect();
            if (scrollable) {
                scrollable.removeEventListener('scroll', updateThumb);
            }
            window.removeEventListener('resize', updateThumb);
        };
    }, [scrollRef, updateThumb]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragInfo.current.isDragging || !scrollRef.current || !trackRef.current) return;
        e.preventDefault();
        
        const dx = e.clientX - dragInfo.current.startX;
        const { scrollWidth, clientWidth } = scrollRef.current;
        const trackWidth = trackRef.current.clientWidth;

        const scrollRatio = (scrollWidth - clientWidth) / (trackWidth - thumbWidth);
        scrollRef.current.scrollLeft = dragInfo.current.startScrollLeft + dx * scrollRatio;
    }, [scrollRef, thumbWidth]);


    const handleMouseUp = useCallback(() => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        dragInfo.current.isDragging = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleThumbMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!scrollRef.current) return;
        
        dragInfo.current.isDragging = true;
        dragInfo.current.startX = e.clientX;
        dragInfo.current.startScrollLeft = scrollRef.current.scrollLeft;

        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [scrollRef, handleMouseMove, handleMouseUp]);

    return (
        <div ref={trackRef} className="h-3.5 bg-gray-200/70 rounded-full relative w-full flex items-center">
            {thumbWidth > 0 && (
                <div
                    ref={thumbRef}
                    className="h-2.5 bg-gray-400/80 rounded-full absolute cursor-grab active:cursor-grabbing hover:bg-gray-500 transition-colors"
                    style={{ width: `${thumbWidth}px`, transform: `translateX(${thumbPosition}px)` }}
                    onMouseDown={handleThumbMouseDown}
                />
            )}
        </div>
    );
};

export default HorizontalScrollbar;
