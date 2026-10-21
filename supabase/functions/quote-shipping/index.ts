// Supabase Edge Function: quote-shipping
// Configure MELHORENVIO_TOKEN and account settings before implementing live quotations.
// Never trust shipping prices submitted by the browser: quote and validate server-side.
const cors={"Access-Control-Allow-Origin":Deno.env.get("STORE_URL")??"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(req.method!=="POST") return new Response(JSON.stringify({error:"Método não permitido"}),{status:405,headers:cors});
 const token=Deno.env.get("MELHORENVIO_TOKEN");
 if(!token) return new Response(JSON.stringify({error:"A cotação de frete ainda não foi configurada. Não é possível calcular um valor real agora."}),{status:501,headers:cors});
 // Próximo passo: implementar o endpoint e o formato de pacote conforme a conta e a documentação atual
 // do Melhor Envio. Retornar apenas opções cotadas pelo provedor, com preço e prazo.
 return new Response(JSON.stringify({error:"Integração de frete precisa ser configurada para sua conta antes de liberar checkout."}),{status:501,headers:cors});
});
