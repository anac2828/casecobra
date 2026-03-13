'use server'

import { db } from '@/src/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

// ** GET ORDER FUNCTION`
export default async function getPaymentStatus({
  orderId,
}: {
  orderId: string
}) {
  // 1 Get user
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  // Error handler
  if (!user?.id || !user.email)
    throw new Error('You need to be logged in to view this page.')

  // 2 Get order based on user and orderId
  const order = await db.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: {
      billingAddress: true,
      shippingAddress: true,
      configuration: true,
      user: true,
    },
  })

  // Error handler
  if (!order) throw new Error('This order does not exist.')

  //3 Return data if order has been paid - the webhook will show if order has been paid
  if (order.isPaid) {
    return order
  } else {
    return false
  }
}
