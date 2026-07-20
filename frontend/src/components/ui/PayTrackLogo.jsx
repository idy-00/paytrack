/**
 * PayTrack Logo — QR code stylisé intégré dans un hexagone
 * Représente la traçabilité (QR) et la structure (hexagone = force, réseau)
 */
export default function PayTrackLogo({ size = 32, variant = 'color' }) {
  const isLight = variant === 'light'
  const primary = isLight ? '#FFFFFF' : '#00B4D8'
  const secondary = isLight ? 'rgba(255,255,255,0.5)' : '#0077B6'
  const bg = isLight ? 'rgba(255,255,255,0.12)' : '#0A1628'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PayTrack"
    >
      {/* Hexagone background */}
      <path
        d="M20 2 L35.5 11 L35.5 29 L20 38 L4.5 29 L4.5 11 Z"
        fill={bg}
        stroke={primary}
        strokeWidth="1.2"
        strokeOpacity="0.6"
      />
      {/* QR code — finder top-left */}
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill={primary} opacity="0.9"/>
      <rect x="12.5" y="12.5" width="4" height="4" rx="0.8" fill={bg}/>
      <rect x="14" y="14" width="3" height="3" rx="0.5" fill={primary}/>
      {/* QR code — finder top-right */}
      <rect x="22" y="11" width="7" height="7" rx="1.5" fill={primary} opacity="0.9"/>
      <rect x="23.5" y="12.5" width="4" height="4" rx="0.8" fill={bg}/>
      <rect x="25" y="14" width="3" height="3" rx="0.5" fill={primary}/>
      {/* QR code — finder bottom-left */}
      <rect x="11" y="22" width="7" height="7" rx="1.5" fill={primary} opacity="0.9"/>
      <rect x="12.5" y="23.5" width="4" height="4" rx="0.8" fill={bg}/>
      <rect x="14" y="25" width="3" height="3" rx="0.5" fill={primary}/>
      {/* QR data dots */}
      <rect x="22" y="22" width="2.5" height="2.5" rx="0.5" fill={primary} opacity="0.8"/>
      <rect x="25.5" y="22" width="2.5" height="2.5" rx="0.5" fill={secondary} opacity="0.6"/>
      <rect x="22" y="25.5" width="2.5" height="2.5" rx="0.5" fill={secondary} opacity="0.5"/>
      <rect x="25.5" y="25.5" width="2.5" height="2.5" rx="0.5" fill={primary} opacity="0.8"/>
      {/* Cyan accent dot */}
      <circle cx="29" cy="29" r="2.5" fill={primary} opacity="0.9"/>
    </svg>
  )
}
