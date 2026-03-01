'use server'
import { BASE_PRICE, PRODUCT_PRICES } from '@/src/config/products'
import { db } from '@/src/db'
import { Order } from '@/src/generated/prisma/client'
import { stripe } from '@/src/lib/stripe'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

// This function will be used in the /configure/preview page.tsx
export async function createCheckoutSession({
  configId,
}: {
  configId: string
}) {
  //* 1 - Get user case configuration from database to pass it to stripe
  const configuration = await db.configuration.findUnique({
    where: { id: configId },
  })

  //   Error handling
  if (!configuration) throw new Error('No such configuration found')

  const { finish, material } = configuration

  //* 2 - Get logged in user to get info for stripe
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  // Error handling
  if (!user) throw new Error('You need to be logged in')

  //* 3 - Save total price based on configuration
  let price = BASE_PRICE
  if (finish === 'textured') price += PRODUCT_PRICES.finish.textured
  if (material === 'polycarbonate')
    price += PRODUCT_PRICES.material.polycarbonate

  //* 4 - Check if there is an existing order in the database. If not, save the order in the database
  // order: Order to assign typescript types | undefined = undefined is the default value
  let order: Order | undefined = undefined

  const existingOrder = await db.order.findFirst({
    where: {
      userId: user.id,
      configurationId: configId,
    },
  })

  if (existingOrder) order = existingOrder
  else
    order = await db.order.create({
      data: {
        amount: price / 100,
        userId: user.id,
        configurationId: configuration.id,
      },
    })

  //* 5 - Create product in stripe
  const product = await stripe.products.create({
    name: 'Custom Iphone Case',
    images: [configuration.imageUrl],
    default_price_data: { currency: 'USD', unit_amount: price },
  })

  //* 6 - Create stripe session
  const stripeSession = await stripe.checkout.sessions.create({
    success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/configure/preview?id=${configuration.id}`,
    payment_method_types: ['card'],
    mode: 'payment',
    shipping_address_collection: { allowed_countries: ['DE', 'US'] },
    metadata: { userId: user.id, orderId: order.id },
    line_items: [{ price: product.default_price as string, quantity: 1 }],
  })

  //Stripe url where user will make the payment
  return { url: stripeSession.url }
}
