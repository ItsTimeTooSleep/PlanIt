import { cn } from '@/lib/utils'

interface AppIconProps {
  className?: string
  size?: number
  variant?: 'default' | 'inverted' | 'neutral'
}

/**
 * 应用图标组件
 * @param className - 额外的 CSS 类名
 * @param size - 图标尺寸，默认 24
 * @param variant - 图标变体：'default' 使用主题色背景，'inverted' 反转颜色，'neutral' 使用前景色/背景色
 */
export function AppIcon({ className, size = 24, variant = 'default' }: AppIconProps) {
  let bgClass: string
  let lineClass: string
  let fillClass: string

  if (variant === 'neutral') {
    bgClass = 'fill-foreground'
    lineClass = 'stroke-background'
    fillClass = 'fill-background'
  } else if (variant === 'inverted') {
    bgClass = 'fill-foreground'
    lineClass = 'stroke-background'
    fillClass = 'fill-background'
  } else {
    bgClass = 'fill-primary'
    lineClass = 'stroke-primary-foreground'
    fillClass = 'fill-primary-foreground'
  }

  const scale = size / 180

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <rect className={bgClass} width="180" height="180" rx="90" />
      <g transform="translate(90, 90)">
        <ellipse
          className={lineClass}
          cx="0"
          cy="0"
          rx="55"
          ry="14"
          strokeWidth={4 * scale > 1 ? 4 : 4}
          fill="none"
        />
        <ellipse
          className={lineClass}
          cx="0"
          cy="0"
          rx="55"
          ry="14"
          strokeWidth={4}
          fill="none"
          transform="rotate(60)"
        />
        <ellipse
          className={lineClass}
          cx="0"
          cy="0"
          rx="55"
          ry="14"
          strokeWidth={4}
          fill="none"
          transform="rotate(-60)"
        />
        <circle
          className={lineClass}
          cx="0"
          cy="0"
          r="14"
          strokeWidth={5}
          fill="none"
        />
        <circle className={fillClass} cx="0" cy="-55" r="4" />
        <circle className={fillClass} cx="48" cy="27" r="4" />
        <circle className={fillClass} cx="-48" cy="27" r="4" />
        <circle className={fillClass} cx="48" cy="-27" r="3" opacity="0.5" />
        <circle className={fillClass} cx="-48" cy="-27" r="3" opacity="0.5" />
        <circle className={fillClass} cx="0" cy="55" r="3" opacity="0.5" />
      </g>
    </svg>
  )
}
