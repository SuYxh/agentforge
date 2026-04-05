import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { SunIcon, MoonIcon, MonitorIcon, GlobeIcon, DatabaseIcon, InfoIcon } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Theme = 'light' | 'dark' | 'system';
type Language = 'zh' | 'en';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [theme, setTheme] = useState<Theme>('system');
  const [language, setLanguage] = useState<Language>('zh');
  const [autoSave, setAutoSave] = useState(true);

  const themeOptions = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'system', label: 'Follow System', icon: MonitorIcon },
  ];

  const languageOptions = [
    { value: 'zh', label: '简体中文' },
    { value: 'en', label: 'English' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings / 设置" size="md">
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <SunIcon className="w-4 h-4 text-primary" />
            Appearance / 外观
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value as Theme)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                  ${theme === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <option.icon className={`w-6 h-6 ${theme === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${theme === option.value ? 'text-primary' : 'text-foreground'}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <GlobeIcon className="w-4 h-4 text-primary" />
            Language / 语言
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {languageOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setLanguage(option.value as Language)}
                className={`
                  flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all
                  ${language === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <span className={`text-sm font-medium ${language === option.value ? 'text-primary' : 'text-foreground'}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <DatabaseIcon className="w-4 h-4 text-primary" />
            Data / 数据
          </h3>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-sm">Auto Save / 自动保存</span>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={`
                  relative w-12 h-7 rounded-full transition-colors
                  ${autoSave ? 'bg-primary' : 'bg-muted-foreground/30'}
                `}
              >
                <span
                  className={`
                    absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform
                    ${autoSave ? 'left-6' : 'left-1'}
                  `}
                />
              </button>
            </label>
            <button className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <span className="text-sm">Export Data / 导出数据</span>
              <span className="text-xs text-muted-foreground">JSON Format / JSON 格式</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <span className="text-sm">Import Data / 导入数据</span>
              <span className="text-xs text-muted-foreground">Import from file / 从文件导入</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <InfoIcon className="w-4 h-4 text-primary" />
            About / 关于
          </h3>
          <div className="p-4 rounded-xl bg-muted/50 text-center">
            <svg viewBox="0 0 512 512" className="w-12 h-12 mx-auto mb-3 rounded-xl" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sm-bg" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0%" stopColor="#0c0a1d"/><stop offset="100%" stopColor="#1a1530"/></linearGradient>
                <linearGradient id="sm-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#3b82f6"/></linearGradient>
                <linearGradient id="sm-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fde68a"/><stop offset="50%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#f59e0b"/></linearGradient>
                <filter id="sm-glow"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <rect width="512" height="512" rx="112" fill="url(#sm-bg)"/>
              <path d="M256 96 L148 404 L192 404 L220 320 L292 320 L320 404 L364 404 Z" fill="none" stroke="url(#sm-blue)" strokeWidth="7" strokeLinejoin="round" opacity="0.85"/>
              <line x1="210" y1="284" x2="302" y2="284" stroke="url(#sm-blue)" strokeWidth="6" strokeLinecap="round" opacity="0.6"/>
              <path d="M280 128 L248 238 L280 238 L244 368" fill="none" stroke="url(#sm-gold)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" filter="url(#sm-glow)" opacity="0.9"/>
            </svg>
            <h4 className="font-semibold text-foreground">AgentForge</h4>
            <p className="text-xs text-muted-foreground mt-1">版本 1.0.0</p>
            <p className="text-xs text-muted-foreground mt-2">
              Local Prompt manager with version control / 本地版的 Prompt 管理器，带版本控制
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={onClose}>
            Done / 完成
          </Button>
        </div>
      </div>
    </Modal>
  );
}
