/* eslint-disable @next/next/no-img-element */
import { cn } from '@/src/lib/utils'
import { HTMLAttributes } from 'react'

// Phone component will inharate the attributes of the HTML div element
interface PhoneProps extends HTMLAttributes<HTMLDivElement> {
  imgSrc: string
  dark?: boolean
}

export default function Phone({
  imgSrc,
  className,
  dark = false,
  ...props
}: PhoneProps) {
  return (
    // IMAGE CONTAINER
    <div
      className={cn(
        'relative pointer-events-none z-50 overflow-hidden',
        className,
      )}
      {...props}
    >
      {/* Phone template */}
      <img
        src={
          dark
            ? '/phone-template-dark-edges.png'
            : '/phone-template-white-edges.png'
        }
        className='pointer-events-none z-50 select-none'
        alt='phone image'
      />
      {/* User uploaded image */}
      <div className='absolute -z-10 inset-0'>
        <img
          className='object-cover min-w-full min-h-full'
          src={imgSrc}
          alt='overlaying phone image'
        />
      </div>
    </div>
  )
}
