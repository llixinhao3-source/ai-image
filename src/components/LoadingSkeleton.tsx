export function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-6">
      {[1, 2].map(i => (
        <div key={i} className="relative aspect-square overflow-hidden rounded-apple-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/5 dark:to-white/[0.02]">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-xs font-medium text-gray-400">AI 正在生成...</p>
          </div>
          <div className="absolute inset-0 animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </div>
      ))}
    </div>
  )
}
