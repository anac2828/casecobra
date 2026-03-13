import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { stripe } from '@/src/lib/stripe'
import { db } from '@/src/db'
import OrderReceivedEmail from '@/src/components/email/OrderReceivedEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

interface CustomSession extends Stripe.Checkout.Session {
  shipping?: {
    address: Stripe.Address
  }
}

export async function POST(req: Request) {
  try {
    //* 1 Get request body from stripe when user pays in the stripe portal

    const body = await req.text()
    const signature = (await headers()).get('stripe-signature')

    //  Signature error handler
    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 })
    }

    //* 2 Create webhook event
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )

    //* 3 - Listen for event type
    if (event.type === 'checkout.session.completed') {
      // 1 CREATE STRIPE SESSION
      // as Stripe.Checkout.Session is for typescript type safety
      const session: CustomSession = event.data.object
      // const session = event.data.object as Stripe.Checkout.Session

      // Error handler
      if (!session.customer_details?.email) {
        throw new Error('Missing user email')
      }

      // metadata saved during the checkout process in the configure/preview/actions.ts
      const { userId, orderId } = session.metadata ?? {}

      // Error handler
      if (!userId || !orderId)
        return new NextResponse('Invalid request metadata')

      //2 - GET SHIPPING DETAILS - collected_information.shipping_details.address or .name
      const billingAddress = session.customer_details!.address
      const shippingAddress = session.shipping!.address

      const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          shippingAddress: {
            create: {
              name: session.customer_details!.name!,
              city: shippingAddress.city!,
              country: shippingAddress.country!,
              postalCode: shippingAddress.postal_code!,
              state: shippingAddress.state,
              street: shippingAddress.line1!,
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

      // To render the email component as HTML make sure route has extension .tsx
      await resend.emails.send({
        from: 'Support <onboarding@resend.dev>',
        // to: [session.customer_details?.email],
        to: 'anac2828@yahoo.com',
        subject: 'Thanks for your order!',
        react: (
          <OrderReceivedEmail
            orderId={orderId}
            orderDate={updatedOrder.createdAt.toLocaleDateString()}
            shippingAddress={{
              id: userId,
              name: session.customer_details!.name!,
              city: shippingAddress.city!,
              country: shippingAddress.country!,
              postalCode: shippingAddress.postal_code!,
              state: shippingAddress.state,
              street: shippingAddress.line1!,
              phoneNumber: '',
            }}
          />
        ),
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
