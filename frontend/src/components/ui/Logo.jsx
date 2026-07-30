export default function Logo({ size = 28, className = '' }) {
  return (
    <img
      src="/logo.jpeg"
      alt="PayTrack"
      width={size}
      height={size}
      className={`rounded-md object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
