

import { useState, useCallback, useMemo } from 'react';

export const useHistory = <T,>(initialState: T): [
    T,
    (newState: T | ((prevState: T) => T), fromHistory?: boolean) => void,
    () => void,
    () => void,
    boolean,
    boolean
] => {
    const [history, setHistory] = useState<T[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const setState = useCallback((newStateOrFn: T | ((prevState: T) => T)) => {
        setHistory(currentHistory => {
            const currentState = currentHistory[currentIndex];
            const newState = typeof newStateOrFn === 'function'
                ? (newStateOrFn as (prevState: T) => T)(currentState)
                : newStateOrFn;
            
            // A deep-enough comparison to avoid adding identical states to history
            if (JSON.stringify(currentState) === JSON.stringify(newState)) {
                return currentHistory;
            }

            const newHistory = currentHistory.slice(0, currentIndex + 1);
            newHistory.push(newState);
            setCurrentIndex(newHistory.length - 1);
            return newHistory;
        });
    }, [currentIndex]);

    const undo = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(current => current - 1);
        }
    }, [currentIndex]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(current => current + 1);
        }
    }, [currentIndex, history.length]);

    const canUndo = useMemo(() => currentIndex > 0, [currentIndex]);
    const canRedo = useMemo(() => currentIndex < history.length - 1, [currentIndex, history.length]);

    return [history[currentIndex], setState, undo, redo, canUndo, canRedo];
};