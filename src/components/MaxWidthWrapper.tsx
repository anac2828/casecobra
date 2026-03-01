import { cn } from '@/src/lib/utils' // cn utility function that combines class names

export default function MaxWidthWrapper({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'h-full mx-auto w-full max-w-7xl px-2.5 md:px-20',
        className
      )}
    >
      {children}
    </div>
  )
}
