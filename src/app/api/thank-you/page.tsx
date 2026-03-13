import { Suspense } from 'react'
import ThankYou from './ThankYou'

export default function Page() {
  // Suspense lets you display a fallback until its children have finished loading
  return (
    <Suspense>
      <ThankYou />
    </Suspense>
  )
}
