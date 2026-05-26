import { type ReactNode } from 'react'

interface LayoutProps {
  sidebar: ReactNode
  children: ReactNode
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Layout({ sidebar, children, theme, onToggleTheme }: LayoutProps) {
  return (
    <div className={`flex h-screen w-screen overflow-hidden transition-colors duration-500 ${
      theme === 'dark' ? 'bg-surface-dark text-white' : 'bg-surface-light text-gray-900'
    }`}>
      <aside className={`flex w-72 flex-shrink-0 flex-col border-r p-6 backdrop-blur-glass ${
        theme === 'dark' ? 'border-border-dark bg-panel-dark/60' : 'border-border-light bg-panel-light/80'
      }`}>
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-apple bg-blue-500 text-sm font-semibold text-white">A</span>
          <h1 className="text-lg font-semibold tracking-tight">AI Studio</h1>
        </div>

        <div className="flex-1">{sidebar}</div>

        <div className="border-t pt-4 mt-auto">
          <button onClick={onToggleTheme}
            className={`flex w-full items-center gap-3 rounded-apple px-3 py-2 text-sm font-medium transition-all duration-300 ${
              theme === 'dark' ? 'text-gray-400 hover:bg-white/5 hover:text-gray-200' : 'text-gray-500 hover:bg-black/5 hover:text-gray-700'
            }`}>
            {theme === 'dark' ? (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>浅色模式</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>深色模式</>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
