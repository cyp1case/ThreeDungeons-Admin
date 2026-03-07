const styles = {
  correct: 'bg-[rgba(92,161,54,0.15)] text-fantasy-green border-[rgba(92,161,54,0.3)]',
  incorrect: 'bg-[rgba(211,47,35,0.15)] text-roof-red border-[rgba(211,47,35,0.3)]',
}

export function StatusBadge({ outcome, children }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-sm border-2 ${styles[outcome]}`}
    >
      {children}
    </span>
  )
}
