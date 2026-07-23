export function Logo({ light = false }: { light?: boolean }) {
  const stroke = light ? "#f7f8f2" : "#0d1615";
  return <svg className="brand-mark" viewBox="0 0 40 40" fill="none" aria-label="Vowrail logo"><path d="M8 5h24l4 6v18l-4 6H8l-4-6V11l4-6Z" stroke={stroke} strokeWidth="2.4"/><path d="M11 13.5 20 29l9-15.5" stroke="#c7ff4a" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.7 20h10.6" stroke={light ? "#9d8dff" : "#6b55ff"} strokeWidth="3" strokeLinecap="round"/></svg>;
}
