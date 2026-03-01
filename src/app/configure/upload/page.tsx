/* eslint-disable jsx-a11y/alt-text */
'use client'

import { Image, Loader2, MousePointerSquareDashed } from 'lucide-react'
import { useState, useTransition } from 'react'
import Dropzone, { FileRejection } from 'react-dropzone'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { useUploadThing } from '@/src/lib/uploadthing'
import { cn } from '@/src/lib/utils'

export default function Page() {
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // UploadThing hook for imageUploader endpoint (defined in core.ts)
  const { startUpload, isUploading } = useUploadThing('imageUploader', {
    onClientUploadComplete: ([data]) => {
      // 1 Data from the server after upload is complete (core.ts file).
      const configId = data.serverData.configId

      // 2 Redirect user to design page with the configId after upload
      startTransition(() => router.push(`/configure/design?id=${configId}`))
    },
    onUploadProgress: (progress) => {
      // 3 Update upload progress state
      setUploadProgress(progress)
    },
  })

  const handleOnDropRejected = (rejectedFiles: FileRejection[]) => {
    const [file] = rejectedFiles

    setIsDragOver(false)

    // Error message for unsupported file types
    toast.error(`${file.file.type} type is not supported.`, {
      position: 'top-center',
      description: 'Please choose a PNG, JPG, or JPEG image instead.',
    })
  }

  // Handle accepted files returned from dropzone
  const handleOnDropAccepted = (acceptedFiles: File[]) => {
    // Start the upload with the accepted files to the server endpoint /api/uploadthing
    startUpload(acceptedFiles, { configId: undefined })

    setIsDragOver(false)
  }

  return (
    <div
      className={cn(
        'relative h-full flex-1 my-16 w-full rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl flex justify-center flex-col items-center',
        { 'ring-blue-900/25 bg-blue-900/10': isDragOver }
      )}
    >
      <div className='relative flex flex-1 flex-col items-center justify-center w-full'>
        <Dropzone
          onDropRejected={handleOnDropRejected}
          onDropAccepted={handleOnDropAccepted}
          accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpeg', '.jpg'] }}
          onDragEnter={() => setIsDragOver(true)}
          onDragLeave={() => setIsDragOver(false)}
        >
          {/* getProps and getInputProps are from react-dropzone */}
          {({ getRootProps, getInputProps }) => (
            <div
              className='h-full w-full flex-1 flex flex-col items-center justify-center'
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              {isDragOver ? (
                //   Dragging files over icon
                <MousePointerSquareDashed className='h-6 w-6 text-zinc-500 mb-2' />
              ) : isUploading ? (
                //   Uploading icon
                <Loader2 className='animate-spin h-6 w-6 text-zinc-500 mb-2' />
              ) : (
                // Generic image icon
                <Image className='h-6 w-6 text-zinc-500 mb-2' />
              )}
              <div className='flex flex-col justify-center mb-2 text-sm text-zinc-700'>
                {isUploading ? (
                  // Uploading progress bar
                  <div className='flex flex-col items-center'>
                    <p>Uploading...</p>
                    <Progress
                      value={uploadProgress}
                      className='mt-2 w-40 h-2 bg-gray-300'
                    />
                  </div>
                ) : isPending ? (
                  <div className='flex flex-col items-center'>
                    <p>Redirecting, please wait...</p>
                  </div>
                ) : isDragOver ? (
                  <p>
                    <span className='font-semibold'>Drop file</span> to upload
                  </p>
                ) : (
                  <p>
                    <span className='font-semibold'>Click to upload</span> or
                    drag and drop
                  </p>
                )}
              </div>
              {isPending ? null : (
                <p className='text-xs text-zinc-500'>PNG, JPG, JPEG</p>
              )}
            </div>
          )}
        </Dropzone>
      </div>
    </div>
  )
}
