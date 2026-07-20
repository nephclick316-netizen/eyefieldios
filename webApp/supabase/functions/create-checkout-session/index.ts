import Stripe from "npm:stripe@14.16.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set in Supabase secrets.");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { priceId, successUrl, cancelUrl } = await req.json();

    if (!priceId) {
      return new Response(JSON.stringify({ error: "priceId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use maybeSingle() instead of single() to avoid erroring on "no rows found"
    const { data: customerRecord, error: customerError } = await supabase
      .from("customers")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (customerError) {
      console.error("Database error fetching customer:", customerError);
      // If the table doesn't exist, this will fail. 
      // We should probably tell the user to run the SQL setup.
      if (customerError.code === 'PGRST116' || customerError.message.includes('relation "public.customers" does not exist')) {
         return new Response(JSON.stringify({ 
           error: "Database setup incomplete", 
           details: "The 'customers' table is missing. Please run the SQL in 'supabase/stripe_setup.sql' in your Supabase SQL Editor." 
         }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let customerId = customerRecord?.stripe_customer_id;

    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id },
        });
        customerId = customer.id;

        const serviceClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        
        const { error: upsertError } = await serviceClient
          .from("customers")
          .upsert({ id: user.id, stripe_customer_id: customerId });
          
        if (upsertError) {
          console.error("Error saving customer ID:", upsertError);
          throw new Error(`Failed to save Stripe customer ID to database: ${upsertError.message}`);
        }
      } catch (stripeErr) {
        console.error("Stripe customer creation error:", stripeErr);
        throw new Error(`Stripe error: ${stripeErr.message}`);
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl ?? `${req.headers.get("origin")}/pricing?success=true`,
      cancel_url: cancelUrl ?? `${req.headers.get("origin")}/pricing?canceled=true`,
      metadata: { user_id: user.id },
      subscription_data: {
        metadata: { user_id: user.id },
      },
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Checkout session error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
