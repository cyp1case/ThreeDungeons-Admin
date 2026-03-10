export function Card({ children, className = '' }) {
  return (
    <div
      className={`relative bg-surface-card border-2 border-border-dark rounded-sm p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)] ${className}`}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-royal-blue to-transparent opacity-50" />
      {children}
    </div>
  )
}
