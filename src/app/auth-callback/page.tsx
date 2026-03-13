'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuthStatus } from './actions'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// This route (api/auth-callback) will be called by the modalWindow login button in the configure/preview route
export default function Page() {
  const [configId] = useState<string | null>(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('configurationId')
      : null
  })
  const router = useRouter()

  // Checks if user has logged in and if its on db.user
  const { data } = useQuery({
    queryKey: ['auth-callback'],
    queryFn: async () => await getAuthStatus(),
    retry: true, // Will call the getAuthStatus() function again until user is logged in
    retryDelay: 500,
  })

  // When getAuthStatus returns true than proceed to re-route the user
  if (data?.success) {
    //configId retrieved from localStorage
    if (configId) {
      localStorage.removeItem('configurationId')

      // Re-route user to continue the checkout process
      router.push(`/configure/preview?id=${configId}`)
    } else {
      // Re-route user to home page if no configuration was found
      router.push('/')
    }
  }

  return (
    <div className='w-full mt-24 flex justify-center'>
      <div className='flex flex-col items-center gap-2'>
        <Loader2 className='h-8 w-8 animate-spin text-zinc-500' />
        <h3 className='font-semibold text-xl'>Logging you in...</h3>
        <p>You will be redirected automatically.</p>
      </div>
    </div>
  )
}
