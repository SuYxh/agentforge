import { useCallback, useEffect, useRef } from 'react';

interface UseSmoothStreamOptions {
    onUpdate: (text: string) => void;
    streamDone: boolean;
    minDelay?: number;
    initialText?: string;
}

export const useSmoothStream = ({
    onUpdate,
    streamDone,
    minDelay = 10,
    initialText = ''
}: UseSmoothStreamOptions) => {
    const chunkQueueRef = useRef<string[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const displayedTextRef = useRef<string>(initialText);
    const lastUpdateTimeRef = useRef<number>(0);

    const addChunk = useCallback((chunk: string) => {
        const chars = Array.from(chunk);
        chunkQueueRef.current = [...chunkQueueRef.current, ...chars];
    }, []);

    const reset = useCallback(
        (newText = '') => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            chunkQueueRef.current = [];
            displayedTextRef.current = newText;
            onUpdate(newText);
        },
        [onUpdate]
    );

    const renderLoop = useCallback(
        (currentTime: number) => {
            if (chunkQueueRef.current.length === 0) {
                if (streamDone) {
                    const finalText = displayedTextRef.current;
                    onUpdate(finalText);
                    return;
                }
                animationFrameRef.current = requestAnimationFrame(renderLoop);
                return;
            }

            if (currentTime - lastUpdateTimeRef.current < minDelay) {
                animationFrameRef.current = requestAnimationFrame(renderLoop);
                return;
            }
            lastUpdateTimeRef.current = currentTime;

            let charsToRenderCount = Math.max(1, Math.floor(chunkQueueRef.current.length / 5));

            if (streamDone) {
                charsToRenderCount = chunkQueueRef.current.length;
            }

            const charsToRender = chunkQueueRef.current.slice(0, charsToRenderCount);
            displayedTextRef.current += charsToRender.join('');

            onUpdate(displayedTextRef.current);

            chunkQueueRef.current = chunkQueueRef.current.slice(charsToRenderCount);

            if (chunkQueueRef.current.length > 0 || !streamDone) {
                animationFrameRef.current = requestAnimationFrame(renderLoop);
            }
        },
        [streamDone, onUpdate, minDelay]
    );

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(renderLoop);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [renderLoop]);

    return { addChunk, reset };
};
