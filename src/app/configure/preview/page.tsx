import { db } from '@/src/db'
import { notFound } from 'next/navigation'
import DesignPreview from './DesignPreview'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page({ searchParams }: PageProps) {
  const { id } = await searchParams

  // Error handling
  if (!id || typeof id !== 'string') return notFound()

  // Get configurations from database saved in the /configure/design page
  const configuration = await db.configuration.findUnique({ where: { id } })

  // Error handling
  if (!configuration) return notFound()

  return <DesignPreview configuration={configuration} />
}
