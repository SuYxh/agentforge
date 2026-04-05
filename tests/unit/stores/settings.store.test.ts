import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '@/stores/settings.store';

describe('useSettingsStore', () => {
  beforeEach(() => {
    const { setState } = useSettingsStore;
    setState({
      themeMode: 'system',
      isDarkMode: true,
      themeColor: 'royal-blue',
      themeHue: 220,
      themeSaturation: 70,
      language: 'en',
      autoSave: true,
      renderMarkdown: true,
      fontSize: 'medium',
      aiModels: [],
      sourceHistory: [],
    });
  });

  it('has correct default theme values', () => {
    const state = useSettingsStore.getState();
    expect(state.themeMode).toBe('system');
    expect(state.themeColor).toBe('royal-blue');
    expect(state.themeHue).toBe(220);
    expect(state.themeSaturation).toBe(70);
  });

  it('setLanguage normalizes language codes', () => {
    const { setLanguage } = useSettingsStore.getState();
    setLanguage('zh-CN');
    expect(useSettingsStore.getState().language).toBe('zh');
  });

  it('setLanguage handles japanese', () => {
    const { setLanguage } = useSettingsStore.getState();
    setLanguage('ja-JP');
    expect(useSettingsStore.getState().language).toBe('ja');
  });

  it('setAutoSave toggles autoSave setting', () => {
    const { setAutoSave } = useSettingsStore.getState();
    setAutoSave(false);
    expect(useSettingsStore.getState().autoSave).toBe(false);
    setAutoSave(true);
    expect(useSettingsStore.getState().autoSave).toBe(true);
  });

  it('setRenderMarkdown toggles markdown rendering', () => {
    const { setRenderMarkdown } = useSettingsStore.getState();
    setRenderMarkdown(false);
    expect(useSettingsStore.getState().renderMarkdown).toBe(false);
  });

  it('addSourceHistory adds and deduplicates entries', () => {
    const { addSourceHistory } = useSettingsStore.getState();
    addSourceHistory('source-a');
    addSourceHistory('source-b');
    addSourceHistory('source-a');
    const history = useSettingsStore.getState().sourceHistory;
    expect(history[0]).toBe('source-a');
    expect(history[1]).toBe('source-b');
    expect(history.length).toBe(2);
  });

  it('addSourceHistory ignores blank strings', () => {
    const { addSourceHistory } = useSettingsStore.getState();
    addSourceHistory('   ');
    expect(useSettingsStore.getState().sourceHistory.length).toBe(0);
  });

  it('setFontSize updates fontSize', () => {
    const { setFontSize } = useSettingsStore.getState();
    setFontSize('large');
    expect(useSettingsStore.getState().fontSize).toBe('large');
  });
});
