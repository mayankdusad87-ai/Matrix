export type MobileTab = 'focus' | 'matrix' | 'tasks' | 'more';

interface Props {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const tabs: { key: MobileTab; label: string; icon: JSX.Element }[] = [
  {
    key: 'focus',
    label: 'Focus',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'matrix',
    label: 'Matrix',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
        <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
      </svg>
    ),
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" /><path strokeLinecap="round" d="M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'more',
    label: 'More',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav
      className="shrink-0 flex items-end justify-around pb-safe z-30"
      style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map(tab => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="flex flex-col items-center gap-0.5 py-2 px-4 min-w-[64px] transition-colors duration-150"
            style={{ color: active ? 'var(--accent)' : 'var(--text-tertiary)' }}
          >
            {tab.icon}
            <span className="text-[10px] font-semibold">{tab.label}</span>
            {active && (
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
