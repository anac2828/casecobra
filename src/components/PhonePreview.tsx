/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useRef, useState } from 'react'
import { CaseColor } from '../generated/prisma/enums'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { cn } from '../lib/utils'

export default function PhonePreview({
  croppedImageUrl,
  color,
}: {
  croppedImageUrl: string
  color: CaseColor
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [renderDimensions, setRenderDimensions] = useState({
    height: 0,
    width: 0,
  })

  const handleResize = () => {
    if (!ref.current) return
    // Get dimensions of the AspectRation component
    const { width, height } = ref.current.getBoundingClientRect()
    // Update state
    console.log(width, height)
    setRenderDimensions({ width, height })
  }

  useEffect(() => {
    handleResize()
    //   When the user resizies the window handleResize() will run
    window.addEventListener('resize', handleResize)

    // Clean useEffect
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Set the background color of the iphone preview to the color the user picked
  let caseBackgroundColor = 'bg-zinc-950'
  if (color === 'blue') caseBackgroundColor = 'bg-blue-950'
  if (color === 'rose') caseBackgroundColor = 'bg-rose-950'

  return (
    <AspectRatio ref={ref} ratio={3000 / 2001} className='relative'>
      <div
        className='absolute z-20 scale-[1.01]'
        style={{
          left:
            renderDimensions.width / 2 - renderDimensions.width / (1216 / 123),
          top: renderDimensions.height / 6.9,
        }}
      >
        {/* USER CROPPED IMAGE */}
        <img
          width={renderDimensions.width / (3000 / 644)}
          className={cn(
            'phone-skew relative z-20 rounded-t-[15px] rounded-b-[10px] md:rounded-t-[30px] md:rounded-b-4xl',
            caseBackgroundColor,
          )}
          alt='phone'
          src={croppedImageUrl}
        />
      </div>
      <div className='relative h-full w-full z-40'>
        <img
          alt='phone'
          src='/clearphone.png'
          className='pointer-events-none h-full w-full antialiased rounded-md'
        />
      </div>
    </AspectRatio>
  )
}
