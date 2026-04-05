import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ChevronRightIcon, BrainIcon, Loader2Icon } from 'lucide-react';

interface CollapsibleThinkingProps {
    content: string | null;
    isLoading?: boolean;
    defaultExpanded?: boolean;
    className?: string;
}

export function CollapsibleThinking({
    content,
    isLoading = false,
    defaultExpanded = false,
    className = '',
}: CollapsibleThinkingProps) {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const contentRef = useRef<HTMLDivElement>(null);
    const prevContentLength = useRef(0);

    useEffect(() => {
        if (isExpanded && contentRef.current && content && content.length > prevContentLength.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
        prevContentLength.current = content?.length || 0;
    }, [content, isExpanded]);

    useEffect(() => {
        if (isLoading && content) {
            setIsExpanded(true);
        }
    }, [isLoading, content]);

    if (content === null && !isLoading) return null;

    const hasContent = content && content.length > 0;

    return (
        <div className={`rounded-xl border border-border/50 bg-muted/20 overflow-hidden transition-all duration-200 ${className}`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors group"
            >
                <span className="text-muted-foreground transition-transform duration-200">
                    {isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4" />
                    ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                    )}
                </span>

                <span className={`relative ${isLoading ? 'text-primary' : 'text-muted-foreground'}`}>
                    <BrainIcon className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
                    {isLoading && (
                        <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </span>
                    )}
                </span>

                <span className="text-xs font-medium text-muted-foreground">
                    {t('settings.thinkingContent', '思考过程')}
                </span>

                {isLoading && (
                    <Loader2Icon className="w-3 h-3 text-primary animate-spin ml-1" />
                )}

                {hasContent && (
                    <span className="ml-auto text-[10px] text-muted-foreground/60">
                        {content.length} {t('common.chars', 'chars')}
                    </span>
                )}
            </button>

            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div
                    ref={contentRef}
                    className="px-3 pb-3 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
                >
                    <div className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                        {hasContent ? content : (isLoading ? t('common.loading', '处理中...') : '')}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CollapsibleThinking;
