import { db } from '@/src/db'
import { notFound } from 'next/navigation'
import DesignConfigurator from './DesignConfigurator'

interface PageProps {
  searchParams: {
    [key: string]: string | string[] | undefined
  }
}

// ** COMPONENT **
// searchParams are passed in automatically by Next.js
async function Page({ searchParams }: PageProps) {
  //1 - id is assigned in the upload page after a successful upload
  const { id } = await searchParams

  //notFound() is a Next.js function that renders the 404 page
  if (!id || typeof id !== 'string') return notFound()

  //2 - fetch image configuration from the database saved during upload in core.ts file
  const configuration = await db.configuration.findUnique({ where: { id } })
  if (!configuration) return notFound()

  const { width, height, imageUrl } = configuration

  return (
    <DesignConfigurator
      configId={configuration.id}
      imageDimensions={{ width, height }}
      imageUrl={imageUrl}
    />
  )
}

export default Page
