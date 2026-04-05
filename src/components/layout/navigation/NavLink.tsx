import { memo } from 'react';

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
}

export const NavLink = memo(function NavLink({ icon, label, count, active, onClick }: NavLinkProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-all duration-200 ${
        active
          ? 'bg-primary/15 text-primary font-medium'
          : 'text-foreground/60 hover:bg-white/10 dark:hover:bg-white/5 hover:text-foreground'
      }`}
    >
      <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
      {count !== undefined && (
        <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded-full bg-white/10 dark:bg-white/5 text-foreground/40">
          {count}
        </span>
      )}
    </button>
  );
});
