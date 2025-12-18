import { createServerSupabaseClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// 🚫 Impede execução no build
export const dynamic = "force-dynamic"

const PLANS = {
  basic: { priceId: "price_basic", amount: 14990, name: "Básico" },
  premium: { priceId: "price_premium", amount: 24990, name: "Premium" },
  master: { priceId: "price_master", amount: 34990, name: "Master" },
} as const

export async function POST(request: NextRequest) {
  try {
    // ✅ Stripe SÓ é criado em runtime
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { plan_type } = await request.json()

    if (!plan_type || !(plan_type in PLANS)) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 })
    }

    const plan = PLANS[plan_type as keyof typeof PLANS]
    const origin =
      request.headers.get("origin") || "https://gds.viraweb.online"

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `ViraWeb - Plano ${plan.name}`,
              description: `Assinatura ${plan.name} do ViraWeb`,
            },
            unit_amount: plan.amount,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        user_id: user.id,
        plan_type,
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
