'use client'

import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Confetti from 'react-dom-confetti'
import { ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'
import { Configuration } from '@/src/generated/prisma/client'
import { Button } from '@/components/ui/button'
import Phone from '@/src/components/Phone'
import LoginModal from '@/src/components/LoginModal'
import { BASE_PRICE, PRODUCT_PRICES } from '@/src/config/products'
import { cn, formatPrice } from '@/src/lib/utils'
import { COLORS, MODELS } from '@/src/validators/option-validator'
import { createCheckoutSession } from './actions'

// ** COMPONENT **

export default function DesignPreview({
  configuration,
}: {
  configuration: Configuration
}) {
  const router = useRouter()
  const { user } = useKindeBrowserClient()
  // ** Confetti State
  const [showConfetti, setShowConfetti] = useState<boolean>(false)
  // ** Modal state
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false)

  //** */ useEffect will run once after the page is rendered
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setShowConfetti(true), [])

  // ** Phone case configuration
  const { color, model, finish, material } = configuration
  // Get user selected case color to display it in the preview.
  const tw = COLORS.find((supportedColor) => supportedColor.value === color)?.tw
  // Iphone Model label
  const { label: modelLabel } = MODELS.options.find(
    ({ value }) => value === model,
  )!

  // Total price
  let totalPrice = BASE_PRICE
  if (material === 'polycarbonate')
    totalPrice += PRODUCT_PRICES.material.polycarbonate
  if (finish === 'textured') totalPrice += PRODUCT_PRICES.finish.textured

  // ** Handle stripe checkout
  const { mutate: createPaymentSession, isPending } = useMutation({
    mutationKey: ['get-checkout-session'],
    mutationFn: createCheckoutSession,
    onSuccess: ({ url }) => {
      if (url) router.push(url)
      else throw new Error('Unable to retrive payment URL.')
    },
    onError: () =>
      toast.error('Something went wrong.', {
        description: 'There was an error on our end. Please try again.',
        position: 'top-center',
      }),
  })

  const handleCheckout = () => {
    if (user) {
      // If user is logged in continue checkout
      createPaymentSession({ configId: configuration.id })
    } else {
      // If use is not logged in save the configuration id to retrive it after user logs in.
      localStorage.setItem('configurationId', configuration.id)
      setShowLoginModal(true)
    }
  }

  return (
    <>
      {/* Confetti */}
      <div
        aria-hidden='true'
        className='pointer-events-none select-none absolute inset-0 overflow-hidden flex justify-center'
      >
        <Confetti
          active={showConfetti}
          config={{ elementCount: 200, spread: 100 }}
        />
      </div>

      {/* LOGIN MODAL */}
      <LoginModal isOpen={showLoginModal} setIsOpen={setShowLoginModal} />

      {/* IPHONE IMAGE AND CONFIG DETAILS */}
      <div className='mt-20 flex flex-col items-center md:grid text-sm sm:grid-cols-12 sm:grid-rows-1 sm:gap-x-6 md:gap-x-8 lg:gap-x-12'>
        <div className='md:col-span-4 lg:col-span-3 md:row-span-2 md:row-end-2'>
          {/* add exclamation mark to let typescript know croppedImageUrl is not null */}
          <Phone
            className={cn(`bg-${tw}`, 'max-w-37.5 md:max-w-full')}
            imgSrc={configuration.croppedImageUrl!}
          />
        </div>
        <div className='mt-6 sm:col-span-9 md:row-end-1'>
          <h3 className='text-3xl font-bold tracking-tight text-gray-900'>
            Your {modelLabel} Case
          </h3>
          <div className='mt-3 flex items-center gap-1.5 text-base'>
            <Check className='h-4 w-4 text-green-500' />
            In stock and ready to ship
          </div>
        </div>

        <div className='sm:col-span-12 md:col-span-9 text-base'>
          <div className='grid grid-cols-1 gap-y-8 border-b border-gray-200 py-8 sm:grid-cols-2 sm:gap-x-6 sm:py-6 md:py-10'>
            <div>
              <p className='font-medium text-zinc-950'>Highlights</p>
              <ol className='mt-3 text-zinc-700 list-disc list-inside'>
                <li>Wireless charging compatible</li>
                <li>TPU shock absorption</li>
                <li>Packaging made from recycled materials</li>
                <li>5 year print warranty</li>
              </ol>
            </div>
            <div>
              <p className='font-medium text-zinc-950'>Materials</p>
              <ol className='mt-3 text-zinc-700 list-disc list-inside'>
                <li>High-quality, durable material</li>
                <li>Scratch- and figerprint resistent coating</li>
              </ol>
            </div>
          </div>

          <div className='mt-8'>
            <div className='bg-gray-50 p-6 sm:rounded-lg sm:p-8'>
              <div className='flow-root text-sm'>
                <div className='flex items-center justify-between py-1 mt-2'>
                  <p className='text-gray-600'>Base price</p>
                  <p className='font-medium text-gray-900'>
                    {formatPrice(BASE_PRICE / 100)}
                  </p>
                </div>
                {finish === 'textured' ? (
                  <div className='flex items-center justify-between py-1 mt-2'>
                    <p className='text-gray-600'>Textured finish</p>
                    <p className='font-medium text-gray-900'>
                      {formatPrice(PRODUCT_PRICES.finish.textured / 100)}
                    </p>
                  </div>
                ) : null}

                {material === 'polycarbonate' ? (
                  <div className='flex items-center justify-between py-1 mt-2'>
                    <p className='text-gray-600'>Soft polycarbonate material</p>
                    <p className='font-medium text-gray-900'>
                      {formatPrice(PRODUCT_PRICES.material.polycarbonate / 100)}
                    </p>
                  </div>
                ) : null}

                <div className='my-2 h-px bg-gray-200' />

                <div className='flex items-center justify-between py-2'>
                  <p className='font-semibold text-gray-900'>Order total</p>
                  <p className='font-semibold text-gray-900'>
                    {formatPrice(totalPrice / 100)}
                  </p>
                </div>
              </div>
            </div>
            <div className='mt-8 flex justify-end pb-12'>
              <Button
                className='px-4 sm:px-6 lg:px-8'
                onClick={() => handleCheckout()}
                isLoading={isPending}
                loadingText='Processing'
              >
                Checkout <ArrowRight className='h-4 w-4 ml-1.5 inline' />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
