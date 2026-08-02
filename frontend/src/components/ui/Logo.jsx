import logoImg from '@/assets/logo.jpeg'

export default function Logo({ size = 28, className = '' }) {
  return (
    <img
      src={logoImg}
      alt="PayTrack"
      width={size}
      height={size}
      className={`rounded-md object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
