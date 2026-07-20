export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-fog flex items-center justify-center mb-4">
          <Icon size={22} className="text-muted" />
        </div>
      )}
      <h3 className="text-base font-semibold text-ink mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted max-w-xs leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm mt-5">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
