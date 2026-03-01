'use client'
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { HTMLAttributes, useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { cn } from '@/src/lib/utils'
import MaxWidthWrapper from './MaxWidthWrapper'
import Phone from './Phone'

const PHONES = [
  '/testimonials/1.jpg',
  '/testimonials/2.jpg',
  '/testimonials/3.jpg',
  '/testimonials/4.jpg',
  '/testimonials/5.jpg',
  '/testimonials/6.jpg',
]
//Makes an array with two nested arrays of length 3.
function splitArray<T>(array: Array<T>, numParts: number) {
  const result: Array<Array<T>> = []

  for (let i = 0; i < array.length; i++) {
    const index = i % numParts
    if (!result[index]) {
      result[index] = []
    }
    result[index].push(array[i])
  }
  return result
}

// COMPONENTS

function ReviewColumn({
  reviews,
  className,
  reviewClassName,
  msPerPixel,
}: {
  reviews: string[]
  className?: string
  reviewClassName?: (reviewIndex: number) => string
  msPerPixel: number
}) {
  const columnRef = useRef<HTMLDivElement | null>(null)
  const [columnHeight, setColumnHeight] = useState(0)
  const duration = `${columnHeight * msPerPixel}ms`

  // will run only once. Sets columnHeight to the size of the columnRef
  useEffect(() => {
    if (!columnRef.current) return
    const resizeObserver = new window.ResizeObserver(() => {
      // If current is null or undefined height will be 0
      setColumnHeight(columnRef.current?.offsetHeight ?? 0)
    })

    resizeObserver.observe(columnRef.current)
    //   useEffect clean up fuction
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div
      ref={columnRef}
      className={cn('animate-marquee space-y-8 py-4', className)}
      style={{ '--marquee-duration': duration } as React.CSSProperties}
    >
      {/* Reviews.concat is to duplicate the same reviews to have enough content to show. */}
      {/* reviews - array of image names */}
      {reviews.concat(reviews).map((imgSrc, reviewIndex) => (
        <Review
          key={reviewIndex}
          className={reviewClassName?.(reviewIndex % reviews.length)}
          imgSrc={imgSrc}
        />
      ))}
    </div>
  )
}

interface ReviewProps extends HTMLAttributes<HTMLDivElement> {
  imgSrc: string
}

function Review({ imgSrc, className, ...props }: ReviewProps) {
  const POSSIBLE_ANIMATION_DELAYS = [
    '0s',
    '0.1s',
    '0.2s',
    '0.3s',
    '0.4s',
    '0.5s',
    '0.6s',
  ]

  const animationDelay =
    POSSIBLE_ANIMATION_DELAYS[
      // eslint-disable-next-line react-hooks/purity
      Math.floor(Math.random() * POSSIBLE_ANIMATION_DELAYS.length)
    ]

  return (
    <div
      className={cn(
        'animate-fade-in rounded-[2.25rem] bg-white p-6 opacity-0 shadow-xl shadow-slate-900/5',
        className
      )}
      style={{ animationDelay }}
      {...props}
    >
      <Phone imgSrc={imgSrc} />
    </div>
  )
}

function ReviewGrid() {
  // useRef to help animate the phones when the show in the browser window
  const containerRef = useRef<HTMLDivElement | null>(null)
  // will animate the phone on the first time containerRef appears on the browser about 0.4 from bottom of window
  const isInView = useInView(containerRef, { once: true, amount: 0.4 })
  const columns = splitArray(PHONES, 3)
  const column1 = columns[0]
  const column2 = columns[1]
  const column3 = splitArray(columns[2], 2)

  return (
    <div
      ref={containerRef}
      className='relative -mx-4 mt-16 grid h-196 max-h-[150vh] grids-col-1 items-start gap-8 overflow-hidden px-4 sm:mt-20 md:grid-cols-2 lg:grid-cols-3'
    >
      {isInView ? (
        <>
          <ReviewColumn
            reviews={[...column1, ...column3.flat(), ...column2]}
            reviewClassName={(reviewIndex) =>
              cn({
                'md:hidden': reviewIndex >= column1.length + column3[0].length,
                'ld:hidden': reviewIndex >= column1.length,
              })
            }
            msPerPixel={10}
          />
          <ReviewColumn
            reviews={[...column2, ...column3[1]]}
            className='hidden md:block'
            reviewClassName={(reviewIndex) =>
              reviewIndex >= column2.length ? 'lg:hidden' : ''
            }
            msPerPixel={15}
          />
          <ReviewColumn
            reviews={column3.flat()}
            className='hidden md:block'
            reviewClassName={(reviewIndex) =>
              reviewIndex >= column2.length ? 'lg:hidden' : ''
            }
            msPerPixel={10}
          />
        </>
      ) : null}
      <div className='pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-slate-100' />
      <div className='pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-slate-100' />
    </div>
  )
}

export default function Reviews() {
  return (
    <MaxWidthWrapper className='relative max-w-5xl'>
      <img
        aria-hidden='true'
        src='/what-people-are-buying.png'
        className='absolute select-none hidden xl:block -left-32 top-1/3'
      />
      <ReviewGrid />
    </MaxWidthWrapper>
  )
}
