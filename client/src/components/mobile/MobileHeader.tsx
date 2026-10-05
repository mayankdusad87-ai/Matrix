interface Props {
  onSearchOpen: () => void;
}

export default function MobileHeader({ onSearchOpen }: Props) {
  return (
    <header
      className="flex items-center justify-between px-4 h-[48px] shrink-0 z-20"
      style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--accent-subtle)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2}>
            <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
            <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
          </svg>
        </div>
        <span className="text-[14px] font-bold tracking-[-0.02em]" style={{ color: 'var(--text-primary)' }}>
          Priorix
        </span>
      </div>

      <button
        onClick={onSearchOpen}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
      </button>
    </header>
  );
}
