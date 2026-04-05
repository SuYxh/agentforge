import { forwardRef, TextareaHTMLAttributes, useState, useEffect, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import { useSettingsStore } from '@/stores/settings.store';

const UNORDERED_LIST_PATTERN = /^(\s*)([-*+])\s(.*)$/;
const ORDERED_LIST_PATTERN = /^(\s*)(\d+)\.\s(.*)$/;
const CHECKBOX_PATTERN = /^(\s*)([-*+])\s\[([ x])\]\s(.*)$/;

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  enableMarkdownList?: boolean;
}

export function handleMarkdownListKeyDown(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  value: string,
  onChange?: (newValue: string, cursorPos: number) => void
): boolean {
  if (e.key !== 'Enter' || e.shiftKey) {
    return false;
  }

  const textarea = e.currentTarget;
  const { selectionStart, selectionEnd } = textarea;
  
  if (selectionStart !== selectionEnd) {
    return false;
  }

  const beforeCursor = value.substring(0, selectionStart);
  const afterCursor = value.substring(selectionEnd);
  const lineStart = beforeCursor.lastIndexOf('\n') + 1;
  const currentLine = beforeCursor.substring(lineStart);
  
  const lineEndIndex = afterCursor.indexOf('\n');
  const restOfLine = lineEndIndex === -1 ? afterCursor : afterCursor.substring(0, lineEndIndex);
  if (restOfLine.trim() !== '') {
    return false;
  }

  let match = currentLine.match(CHECKBOX_PATTERN);
  if (match) {
    const [, indent, marker, , content] = match;
    if (content.trim() === '') {
      e.preventDefault();
      const newValue = value.substring(0, lineStart) + afterCursor.replace(/^\s*/, '');
      const newCursorPos = lineStart;
      onChange?.(newValue, newCursorPos);
      return true;
    } else {
      e.preventDefault();
      const insertion = `\n${indent}${marker} [ ] `;
      const newValue = beforeCursor + insertion + afterCursor;
      const newCursorPos = selectionStart + insertion.length;
      onChange?.(newValue, newCursorPos);
      return true;
    }
  }

  match = currentLine.match(UNORDERED_LIST_PATTERN);
  if (match) {
    const [, indent, marker, content] = match;
    if (content.trim() === '') {
      e.preventDefault();
      const newValue = value.substring(0, lineStart) + afterCursor.replace(/^\s*/, '');
      const newCursorPos = lineStart;
      onChange?.(newValue, newCursorPos);
      return true;
    } else {
      e.preventDefault();
      const insertion = `\n${indent}${marker} `;
      const newValue = beforeCursor + insertion + afterCursor;
      const newCursorPos = selectionStart + insertion.length;
      onChange?.(newValue, newCursorPos);
      return true;
    }
  }

  match = currentLine.match(ORDERED_LIST_PATTERN);
  if (match) {
    const [, indent, numStr, content] = match;
    if (content.trim() === '') {
      e.preventDefault();
      const newValue = value.substring(0, lineStart) + afterCursor.replace(/^\s*/, '');
      const newCursorPos = lineStart;
      onChange?.(newValue, newCursorPos);
      return true;
    } else {
      e.preventDefault();
      const nextNum = parseInt(numStr, 10) + 1;
      const insertion = `\n${indent}${nextNum}. `;
      const newValue = beforeCursor + insertion + afterCursor;
      const newCursorPos = selectionStart + insertion.length;
      onChange?.(newValue, newCursorPos);
      return true;
    }
  }

  return false;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, value, onChange, enableMarkdownList, onKeyDown, ...props }, ref) => {
    const showLineNumbers = useSettingsStore((state) => state.showLineNumbers);
    const [lineCount, setLineCount] = useState(1);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const text = String(value || '');
      const lines = text.split('\n').length;
      setLineCount(Math.max(lines, 1));
    }, [value]);

    const handleScroll = () => {
      if (lineNumbersRef.current && textareaRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    };

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (enableMarkdownList) {
        const handled = handleMarkdownListKeyDown(
          e,
          String(value || ''),
          (newValue, cursorPos) => {
            if (onChange && textareaRef.current) {
              const syntheticEvent = {
                target: { ...textareaRef.current, value: newValue },
                currentTarget: { ...textareaRef.current, value: newValue },
              } as React.ChangeEvent<HTMLTextAreaElement>;
              onChange(syntheticEvent);
              
              requestAnimationFrame(() => {
                if (textareaRef.current) {
                  textareaRef.current.selectionStart = cursorPos;
                  textareaRef.current.selectionEnd = cursorPos;
                }
              });
            }
          }
        );
        if (handled) return;
      }
      
      onKeyDown?.(e);
    }, [enableMarkdownList, value, onChange, onKeyDown]);

    const setRefs = (element: HTMLTextAreaElement | null) => {
      textareaRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className={clsx(
          'flex rounded-xl overflow-hidden',
          'bg-white/20 dark:bg-white/8 border border-white/15 dark:border-white/8 backdrop-blur-sm',
          'focus-within:ring-2 focus-within:ring-white/30 focus-within:bg-white/30 dark:focus-within:bg-white/12',
          'transition-all duration-200',
          error && 'ring-2 ring-destructive/50'
        )}>
          {showLineNumbers && (
            <div
              ref={lineNumbersRef}
              className="flex-shrink-0 py-3 px-2 text-right text-sm text-muted-foreground select-none overflow-y-auto font-mono bg-white/10 dark:bg-white/5 scrollbar-hide"
              style={{ minWidth: '3rem', lineHeight: '1.625' }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1}>
                  {i + 1}
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={setRefs}
            value={value}
            onChange={onChange}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            className={clsx(
              'flex-1 min-h-[120px] py-3 bg-transparent border-0',
              showLineNumbers ? 'pl-2 pr-4' : 'px-4',
              'text-sm placeholder:text-muted-foreground',
              'focus:outline-none',
              'resize-none',
              'font-mono',
              className
            )}
            style={{ lineHeight: '1.625' }}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
