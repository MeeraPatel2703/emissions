'use client'

interface MiniSparklineProps {
  values: number[]
  height?: number
}

export function MiniSparkline({ values, height = 20 }: MiniSparklineProps) {
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {values.map((v, i) => (
        <div
          key={i}
          className={i === values.length - 1 ? 'bg-primary' : 'bg-primary/25'}
          style={{
            width: 4,
            height: `${Math.max((v / max) * 100, 4)}%`,
            minHeight: 1,
          }}
        />
      ))}
    </div>
  )
}
