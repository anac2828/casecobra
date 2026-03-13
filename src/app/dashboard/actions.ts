'use server'
import { db } from '@/src/db'
import { OrderStatus } from '@/src/generated/prisma/enums'

export default async function changeOrderStatus({
  id,
  newStatus,
}: {
  id: string
  newStatus: OrderStatus
}) {
  await db.order.update({ where: { id }, data: { status: newStatus } })
}
