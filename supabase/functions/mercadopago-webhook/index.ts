// Supabase Edge Function: mercadopago-webhook
// Env secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MERCADOPAGO_ACCESS_TOKEN
// IMPORTANT: validate x-signature using the current Mercado Pago webhook signature
// specification before using this endpoint in production.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed",{status:405});
  const supabaseUrl=Deno.env.get("SUPABASE_URL");
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const mpToken=Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!supabaseUrl||!serviceKey||!mpToken) return new Response("Missing server configuration",{status:500});
  try {
    const url=new URL(req.url);
    const body=await req.json();
    const paymentId=String(body?.data?.id ?? url.searchParams.get("data.id") ?? "");
    const eventType=String(body?.type ?? url.searchParams.get("type") ?? "");
    if (eventType!=="payment" || !paymentId) return new Response("Ignored",{status:200});

    // Verify event against Mercado Pago API; do not trust status sent by browser.
    const response=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,{
      headers:{"Authorization":`Bearer ${mpToken}`}
    });
    if (!response.ok) return new Response("Payment lookup failed",{status:502});
    const payment=await response.json();
    const orderId=payment.external_reference;
    if (!orderId) return new Response("Missing order reference",{status:200});

    const supabase=createClient(supabaseUrl,serviceKey);
    const {data:order,error}=await supabase.from("orders").select("id,total_cents,status").eq("id",orderId).maybeSingle();
    if (error || !order) return new Response("Order not found",{status:404});

    // Check amount matches the saved order before updating.
    const paidAmount=Math.round(Number(payment.transaction_amount)*100);
    if (paidAmount !== order.total_cents) {
      console.error("Amount mismatch", {orderId,paidAmount,expected:order.total_cents});
      return new Response("Amount mismatch",{status:400});
    }
    let status=order.status;
    if (payment.status==="approved") status="paid";
    else if (payment.status==="rejected" || payment.status==="cancelled") status="payment_failed";
    // Never downgrade a paid order due to an out-of-order notification.
    if (order.status!=="paid" || status==="paid") {
      await supabase.from("orders").update({status,payment_id:String(payment.id),updated_at:new Date().toISOString()}).eq("id",orderId);
    }
    return new Response("ok",{status:200});
  } catch (e) {
    console.error("webhook error",e);
    return new Response("Webhook error",{status:500});
  }
});
