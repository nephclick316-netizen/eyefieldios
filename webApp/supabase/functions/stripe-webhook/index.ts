import Stripe from "npm:stripe@14.16.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    switch (event.type) {
      case "product.created":
      case "product.updated": {
        const product = event.data.object as Stripe.Product;
        await supabase.from("products").upsert({
          id: product.id,
          active: product.active,
          name: product.name,
          description: product.description ?? null,
          image: product.images?.[0] ?? null,
          metadata: product.metadata,
        });
        break;
      }
      case "product.deleted": {
        const product = event.data.object as Stripe.Product;
        await supabase.from("products").update({ active: false }).eq("id", product.id);
        break;
      }

      case "price.created":
      case "price.updated": {
        const price = event.data.object as Stripe.Price;
        await supabase.from("prices").upsert({
          id: price.id,
          product_id: typeof price.product === "string" ? price.product : price.product?.id,
          active: price.active,
          description: price.nickname ?? null,
          unit_amount: price.unit_amount,
          currency: price.currency,
          type: price.type,
          interval: price.recurring?.interval ?? null,
          interval_count: price.recurring?.interval_count ?? null,
          trial_period_days: price.recurring?.trial_period_days ?? null,
          metadata: price.metadata,
        });
        break;
      }
      case "price.deleted": {
        const price = event.data.object as Stripe.Price;
        await supabase.from("prices").update({ active: false }).eq("id", price.id);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: customerRecord } = await supabase
          .from("customers")
          .select("id")
          .eq("stripe_customer_id", subscription.customer)
          .single();

        if (!customerRecord) {
          console.warn("No user found for stripe customer:", subscription.customer);
          break;
        }

        await supabase.from("subscriptions").upsert({
          id: subscription.id,
          user_id: customerRecord.id,
          status: subscription.status,
          metadata: subscription.metadata,
          price_id: subscription.items.data[0]?.price.id ?? null,
          quantity: subscription.items.data[0]?.quantity ?? 1,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          created: new Date(subscription.created * 1000).toISOString(),
          ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
          cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        });
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          const userId = session.metadata?.user_id;
          const customerId = session.customer as string;

          if (userId && customerId) {
            await supabase.from("customers").upsert({
              id: userId,
              stripe_customer_id: customerId,
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response(`Webhook processing error: ${err.message}`, { status: 500 });
  }
});
