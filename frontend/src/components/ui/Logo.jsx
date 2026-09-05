export default function Logo({ size = 28, variant = 'color' }) {
  const isLight = variant === 'light'
  const green = isLight ? '#FFFFFF' : '#44AC45'
  const blue = isLight ? 'rgba(255,255,255,0.8)' : '#3768AF'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PayTrack"
    >
      <rect x="8" y="58" width="18" height="35" rx="2" fill={green}/>
      <rect x="30" y="38" width="18" height="55" rx="2" fill={green}/>
      <rect x="52" y="18" width="26" height="75" rx="2" fill={green}/>
      <path
        d="M59 28 L59 63 M59 28 L71 28 C77 28 81 32 81 38 C81 44 77 48 71 48 L59 48"
        stroke={isLight ? green : 'white'}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M3 68 L17 68 L17 48 L39 48 L39 28 L65 28 L65 8 L87 8"
        stroke={blue}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M82 3 L92 8 L82 13"
        stroke={blue}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
