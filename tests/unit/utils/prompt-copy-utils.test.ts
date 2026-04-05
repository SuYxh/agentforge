import { describe, it, expect } from 'vitest';
import {
  resolvePromptContentByLanguage,
  hasUserDefinedPromptVariables,
  buildPromptCopyText,
} from '@/components/prompt/prompt-copy-utils';
import type { Prompt } from '@/types';

const makePrompt = (overrides: Partial<Prompt> = {}): Prompt => ({
  id: '1',
  title: 'Test',
  userPrompt: 'Hello {{name}}',
  variables: [],
  tags: [],
  isFavorite: false,
  isPinned: false,
  version: 1,
  currentVersion: 1,
  usageCount: 0,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('resolvePromptContentByLanguage', () => {
  it('returns original prompts when showEnglish is false', () => {
    const prompt = makePrompt({
      systemPrompt: 'sys-zh',
      systemPromptEn: 'sys-en',
      userPrompt: 'user-zh',
      userPromptEn: 'user-en',
    });
    const result = resolvePromptContentByLanguage(prompt, false);
    expect(result.systemPrompt).toBe('sys-zh');
    expect(result.userPrompt).toBe('user-zh');
  });

  it('returns english prompts when showEnglish is true', () => {
    const prompt = makePrompt({
      systemPrompt: 'sys-zh',
      systemPromptEn: 'sys-en',
      userPrompt: 'user-zh',
      userPromptEn: 'user-en',
    });
    const result = resolvePromptContentByLanguage(prompt, true);
    expect(result.systemPrompt).toBe('sys-en');
    expect(result.userPrompt).toBe('user-en');
  });

  it('falls back to original when english version is missing', () => {
    const prompt = makePrompt({
      systemPrompt: 'sys-zh',
      userPrompt: 'user-zh',
    });
    const result = resolvePromptContentByLanguage(prompt, true);
    expect(result.systemPrompt).toBe('sys-zh');
    expect(result.userPrompt).toBe('user-zh');
  });
});

describe('hasUserDefinedPromptVariables', () => {
  it('returns true when user-defined variables exist', () => {
    expect(hasUserDefinedPromptVariables(undefined, 'Hello {{name}}')).toBe(true);
  });

  it('returns false when only system variables exist', () => {
    expect(hasUserDefinedPromptVariables(undefined, 'Today is {{CURRENT_DATE}}')).toBe(false);
  });

  it('returns false for text without variables', () => {
    expect(hasUserDefinedPromptVariables('plain system', 'plain user')).toBe(false);
  });

  it('detects variables in system prompt', () => {
    expect(hasUserDefinedPromptVariables('Role: {{role}}', 'Do something')).toBe(true);
  });
});

describe('buildPromptCopyText', () => {
  it('returns only userPrompt when no systemPrompt', () => {
    const result = buildPromptCopyText({ userPrompt: 'Hello world' });
    expect(result).toBe('Hello world');
  });

  it('combines system and user prompts with labels', () => {
    const result = buildPromptCopyText({
      systemPrompt: 'You are a helper',
      userPrompt: 'Help me',
    });
    expect(result).toBe('[System]\nYou are a helper\n\n[User]\nHelp me');
  });

  it('returns only userPrompt when systemPrompt is empty string', () => {
    const result = buildPromptCopyText({ systemPrompt: '', userPrompt: 'test' });
    expect(result).toBe('test');
  });
});
