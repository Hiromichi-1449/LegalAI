interface AvatarProps {
  initials: string
  className?: string
}

export function Avatar({ initials, className = '' }: AvatarProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-full shrink-0 ${className}`}
    >
      <span>{initials}</span>
    </div>
  )
}
