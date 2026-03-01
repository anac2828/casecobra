import { headers } from 'next/headers'
import { stripe } from '@/src/lib/stripe'
import Stripe from 'stripe'
import { db } from '@/src/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    //* 1 Get request body from stripe when user pays in the stripe portal
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature')

    //  Signature error handler
    if (!signature) return new Response('Invalid signature', { status: 400 })

    //* 2 Create webhook event
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
    console.log('EVENT', event.type)
    //* 3 - Listen for event type
    if (event.type === 'checkout.session.completed') {
      // Error handler
      if (!event.data.object.customer_details?.email)
        throw new Error('Missing user email')

      // 1 CREATE STRIPE SESSION
      // as Stripe.Checkout.Session is for typescript type safety
      const session = event.data.object as Stripe.Checkout.Session

      // metadata saved during the checkout process in the configure/preview/actions.ts
      const { userId, orderId } = session.metadata || {
        userId: null,
        orderId: null,
      }

      // Error handler
      if (!userId || !orderId) return new Error('Invalid request metadata')

      //2 - GET SHIPPING DETAILS - collected_information.shipping_details.address or .name
      const billingAddress = session.customer_details!.address
      const shippingAddress = session.shipping!.address

      //  "city": "Test City",
      // "country":  "US",
      // "line1": "11234 Street",
      // "postal_code":  "12345",
      // "state":  "NY",

      await db.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          shippingAddress: {
            create: {
              name: session.customer_details!.name!,
              city: shippingAddress.city,
              country: shippingAddress.country,
              postalCode: shippingAddress.postal_code,
              state: shippingAddress.state,
              street: shippingAddress.line1,
            },
          },
          billingAddress: {
            create: {
              name: session.customer_details!.name!,
              city: billingAddress!.city!,
              country: billingAddress!.country!,
              postalCode: billingAddress!.postal_code!,
              state: billingAddress!.state,
              street: billingAddress!.line1!,
            },
          },
        },
      })
    }

    return NextResponse.json({ result: event, ok: true })
  } catch (err) {
    console.error(err)

    return NextResponse.json(
      { message: 'Something went wrong', ok: false },
      { status: 500 },
    )
  }
}
