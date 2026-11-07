export default function LumiEmblem({ size = 22, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 2L14.2 8.3L20.5 10.5L14.2 12.7L12 19L9.8 12.7L3.5 10.5L9.8 8.3L12 2Z" fill="currentColor" />
      <circle cx="12" cy="10.5" r="2.5" fill="#FDE047" />
      <circle cx="18" cy="5" r="1.5" fill="#FDE047" />
      <circle cx="6" cy="16" r="1.2" fill="#FFFFFF" />
    </svg>
  );
}
