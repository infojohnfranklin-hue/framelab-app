import Stripe from "stripe";
import { getAuth } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        error: "You must be logged in to upgrade",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      payment_method_types: ["card"],

      metadata: {
        clerkUserId: userId,
      },

      subscription_data: {
        metadata: {
          clerkUserId: userId,
        },
      },

      line_items: [
        {
          price_data: {
            currency: "chf",
            product_data: {
              name: "FrameLab Pro",
            },
            unit_amount: 1900,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}