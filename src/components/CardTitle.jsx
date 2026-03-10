export function CardTitle({ children }) {
  return (
    <h2
      className="font-pixel text-[10px] text-text-bright mb-4"
      style={{ textShadow: "0 0 6px rgba(255,255,255,0.2)" }}
    >
      {children}
    </h2>
  );
}
