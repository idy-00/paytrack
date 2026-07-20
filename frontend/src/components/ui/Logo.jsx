export default function Logo({ size = 28, className = '' }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 28 28" fill="none"
      className={className}
      aria-label="PayTrack"
    >
      <rect width="28" height="28" rx="7" fill="#0F2744" />
      {/* QR finder top-left */}
      <rect x="5" y="5" width="8" height="8" rx="2" fill="white" />
      <rect x="7" y="7" width="4" height="4" rx="1" fill="#0F2744" />
      {/* QR finder top-right */}
      <rect x="15" y="5" width="8" height="8" rx="2" fill="white" />
      <rect x="17" y="7" width="4" height="4" rx="1" fill="#0F2744" />
      {/* QR finder bottom-left */}
      <rect x="5" y="15" width="8" height="8" rx="2" fill="white" />
      <rect x="7" y="17" width="4" height="4" rx="1" fill="#0F2744" />
      {/* Data dots */}
      <rect x="15" y="15" width="3" height="3" rx="0.8" fill="white" />
      <rect x="20" y="15" width="3" height="3" rx="0.8" fill="white" />
      <rect x="15" y="20" width="3" height="3" rx="0.8" fill="white" />
      {/* Accent dot */}
      <rect x="20" y="20" width="3" height="3" rx="0.8" fill="#1A56DB" />
    </svg>
  )
}
