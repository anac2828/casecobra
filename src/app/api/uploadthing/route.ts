import { createRouteHandler } from 'uploadthing/next'

import { ourFileRouter } from './core'
// Route is triggered when a file is uploaded by the client /configure/upload page
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
})
