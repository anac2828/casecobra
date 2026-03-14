// app/api/webhook/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/src/lib/stripe' // your initialized stripe instance
import { db } from '@/src/db'
import { Resend } from 'resend'
import OrderReceivedEmail from '@/src/components/email/OrderReceivedEmail'

const resend = new Resend(process.env.RESEND_API_KEY!)

interface CustomSession extends Stripe.Checkout.Session {
  shipping?: {
    address: Stripe.Address
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Get raw body and signature
    const body = await req.text() // ← Raw string is critical!
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new NextResponse('Missing stripe-signature', { status: 400 })
    }

    // 2. Verify event
    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      )
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Webhook signature verification failed:', errorMessage)
      return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 })
    }

    // 3. Handle specific event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as CustomSession

      if (!session.customer_details?.email) {
        throw new Error('Missing customer email')
      }

      const { userId, orderId } = session.metadata ?? {}
      if (!userId || !orderId) {
        return new NextResponse('Missing metadata', { status: 400 })
      }

      // Shipping & billing addresses
      const shipping = session.shipping?.address
      const billing = session.customer_details.address

      if (!shipping || !billing) {
        throw new Error('Missing address details')
      }

      // Update order in DB
      const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          shippingAddress: {
            create: {
              name: session.customer_details.name!,
              city: shipping.city!,
              country: shipping.country!,
              postalCode: shipping.postal_code!,
              state: shipping.state ?? '',
              street: shipping.line1!,
            },
          },
          billingAddress: {
            create: {
              name: session.customer_details.name!,
              city: billing.city!,
              country: billing.country!,
              postalCode: billing.postal_code!,
              state: billing.state ?? '',
              street: billing.line1!,
            },
          },
        },
      })

      // Send email
      await resend.emails.send({
        from: 'Support <onboarding@resend.dev>',
        to: session.customer_details.email, // ← Use real email!
        // to: 'anac2828@yahoo.com', // testing only
        subject: 'Thanks for your order!',
        react: (
          <OrderReceivedEmail
            orderId={orderId}
            orderDate={updatedOrder.createdAt.toLocaleDateString()}
            shippingAddress={{
              id: userId,
              name: session.customer_details.name!,
              city: shipping.city!,
              country: shipping.country!,
              postalCode: shipping.postal_code!,
              state: shipping.state ?? '',
              street: shipping.line1!,
              phoneNumber: '',
            }}
          />
        ),
      })
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err: unknown) {
    console.error('Webhook error:', err)
    return NextResponse.json(
      { message: 'Internal error', ok: false },
      { status: 500 },
    )
  }
}

// Critical for Stripe: disable Next.js body parsing!
export const config = {
  api: {
    bodyParser: false,
  },
}
