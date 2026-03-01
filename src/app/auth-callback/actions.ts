'use server'
import { db } from '@/src/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

export async function getAuthStatus() {
  const { getUser } = getKindeServerSession()
  // Get logined user
  const user = await getUser()

  // Error handler
  if (!user?.id || !user.email) throw new Error('Invalid user data')

  const existingUser = await db.user.findFirst({ where: { id: user.id } })

  // Create new user
  if (!existingUser) {
    await db.user.create({
      data: { id: user.id, email: user.email },
    })
  }

  return { success: true }
}
