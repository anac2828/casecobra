import { createUploadthing, type FileRouter } from 'uploadthing/next'
import sharp from 'sharp'
import { z } from 'zod'
import { db } from '@/src/db'

const f = createUploadthing({
  errorFormatter: (err) => {
    console.error('UploadThing Error:', err)
    return {
      message: err.message,
      zodError:
        err.cause instanceof z.ZodError ? z.treeifyError(err.cause) : null,
    }
  },
})

export const ourFileRouter = {
  // imageUploader will be the name of the endpoint and will run when the image is uploaded /configure/upload
  // Data from the input will run through the middleware function and be available in onUploadComplete function
  imageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .input(z.object({ configId: z.string().optional() }))
    .middleware(async ({ input }) => {
      return { input }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // configId is available because we defined it in the input schema above and file is the uploaded file
      const { configId } = metadata.input

      // Fetch the uploaded file from the UFS URL
      const res = await fetch(file.ufsUrl)
      // Get the file as a buffer to pass to sharp
      const buffer = await res.arrayBuffer()

      // Use sharp to get image dimensions
      const imgMetadata = await sharp(buffer).metadata()
      const { width, height } = imgMetadata

      // Store the image URL and dimensions in the database
      if (!configId) {
        const configuration = await db.configuration.create({
          data: {
            imageUrl: file.ufsUrl,
            height: height || 500,
            width: width || 500,
          },
        })
        return { configId: configuration.id }
      } else {
        const updateConfiguration = await db.configuration.update({
          where: { id: configId },
          data: {
            croppedImageUrl: file.ufsUrl,
          },
        })
        return { configId: updateConfiguration.id }
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
