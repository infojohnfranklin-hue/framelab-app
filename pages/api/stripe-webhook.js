import Stripe from "stripe";
import { activatePlan } from "../../lib/pro";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function readRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk)
    );
  }

  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    const buf = await readRawBody(req);

    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("Webhook Error:", err.message);

    return res.status(400).send(
      `Webhook Error: ${err.message}`
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const userId =
      session.metadata?.clerkUserId;

    const stripeCustomerId =
      session.customer;

    if (userId) {
      await activatePlan(
        userId,
        "pro",
        stripeCustomerId
      );

      console.log(
        "User upgraded to PRO:",
        userId
      );
    }
  }

  return res.status(200).json({
    received: true,
  });
}
