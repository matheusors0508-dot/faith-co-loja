// Supabase Edge Function: create-checkout
// Env secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MERCADOPAGO_ACCESS_TOKEN, STORE_URL
// The browser sends variant IDs and quantities, never trusted prices.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("STORE_URL") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const json = (data: unknown, status=200) => new Response(JSON.stringify(data), {status, headers:cors});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", {headers:cors});
  if (req.method !== "POST") return json({error:"Método não permitido."},405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  const storeUrl = Deno.env.get("STORE_URL");
  if (!supabaseUrl || !serviceKey || !mpToken || !storeUrl) return json({error:"Configuração do servidor incompleta."},500);

  try {
    const body = await req.json();
    const {customer, address, items, shippingQuoteId} = body;
    if (!customer?.name || !customer?.email || !customer?.phone || !address?.postalCode || !Array.isArray(items) || items.length < 1 || items.length > 30) {
      return json({error:"Confira os dados do cliente, endereço e itens."},400);
    }
    if (!shippingQuoteId) return json({error:"Selecione uma opção de frete válida antes de pagar."},400);

    const supabase = createClient(supabaseUrl, serviceKey);
    const ids = [...new Set(items.map((i: any) => i.variantId))];
    if (ids.length !== items.length || items.some((i: any) => !i.variantId || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 10)) {
      return json({error:"Itens ou quantidades inválidos."},400);
    }

    const {data: variants, error: variantError} = await supabase
      .from("product_variants")
      .select("id,sku,size,color,stock,product_id,products!inner(id,name,price_cents,active)")
      .in("id", ids);
    if (variantError || !variants || variants.length !== ids.length) return json({error:"Não foi possível validar os produtos."},400);

    const rows:any[]=[];
    let subtotal=0;
    for (const item of items) {
      const v:any=variants.find((x:any)=>x.id===item.variantId);
      if (!v || !v.products?.active) return json({error:"Um produto não está disponível."},400);
      if (v.stock < item.quantity) return json({error:`Estoque insuficiente para ${v.products.name} (${v.size}).`},409);
      const unit=Number(v.products.price_cents);
      subtotal += unit * item.quantity;
      rows.push({variant_id:v.id,product_name:v.products.name,sku:v.sku,size:v.size,color:v.color,unit_price_cents:unit,quantity:item.quantity,line_total_cents:unit*item.quantity});
    }
    const total=subtotal+shippingCents;
    const {data: order, error: orderError}=await supabase.from("orders").insert({
      customer_name:String(customer.name).slice(0,120),
      customer_email:String(customer.email).slice(0,200),
      customer_phone:String(customer.phone).slice(0,30),
      shipping_address:address,
      subtotal_cents:subtotal, shipping_cents:shippingCents,total_cents:total,
      status:"pending_payment",shipping_service:shippingService
    }).select("id,order_number").single();
    if (orderError || !order) return json({error:"Não foi possível registrar o pedido."},500);

    const itemsToInsert=rows.map(r=>({...r,order_id:order.id}));
    const {error: itemsError}=await supabase.from("order_items").insert(itemsToInsert);
    if (itemsError) {
      await supabase.from("orders").delete().eq("id",order.id);
      return json({error:"Não foi possível registrar os itens do pedido."},500);
    }

    const preference={
      items: rows.map((r:any)=>({
        id:r.sku,title:`${r.product_name} — ${r.size} / ${r.color}`,
        quantity:r.quantity,currency_id:"BRL",unit_price:r.unit_price_cents/100
      })).concat(shippingCents>0?[{id:"shipping",title:"Frete",quantity:1,currency_id:"BRL",unit_price:shippingCents/100}]:[]),
      external_reference:order.id,
      statement_descriptor:"FAITHCO",
      back_urls:{
        success:`${storeUrl}/pedido-confirmado.html?order=${order.id}`,
        pending:`${storeUrl}/pedido-pendente.html?order=${order.id}`,
        failure:`${storeUrl}/pedido-nao-aprovado.html?order=${order.id}`
      },
      auto_return:"approved",
      notification_url:`${supabaseUrl}/functions/v1/mercadopago-webhook`,
      payer:{name:customer.name,email:customer.email},
      metadata:{order_id:order.id,order_number:order.order_number}
    };
    const mpRes=await fetch("https://api.mercadopago.com/checkout/preferences",{
      method:"POST",headers:{"Authorization":`Bearer ${mpToken}`,"Content-Type":"application/json"},body:JSON.stringify(preference)
    });
    const mpData=await mpRes.json();
    if (!mpRes.ok || !mpData.init_point) {
      await supabase.from("orders").update({status:"payment_failed"}).eq("id",order.id);
      return json({error:"O provedor de pagamento não conseguiu criar o checkout.",detail:mpData.message??null},502);
    }
    await supabase.from("orders").update({checkout_url:mpData.init_point}).eq("id",order.id);
    return json({orderId:order.id,orderNumber:order.order_number,checkoutUrl:mpData.init_point});
  } catch (err) {
    console.error("create-checkout error",err);
    return json({error:"Erro inesperado ao preparar o pagamento."},500);
  }
});
