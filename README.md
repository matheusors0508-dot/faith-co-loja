# Faith.Co v2 — plano de implementação da loja

Este pacote é a próxima etapa técnica sobre a vitrine HTML/CSS/JS já criada. Ele contém uma proposta inicial de banco de dados e funções server-side para checkout, notificações e cotação de frete. **Não é uma loja pronta para produção**: precisa de configuração, revisão de segurança, integração de frete e testes com credenciais reais de teste.

## Arquitetura escolhida
- Frontend: os arquivos `index.html`, `styles.css` e `script.js` da primeira versão.
- Banco, autenticação opcional, imagens e funções server-side: Supabase.
- Pagamento: Mercado Pago Checkout Pro (cliente é direcionado ao checkout hospedado pelo provedor).
- Frete: Melhor Envio como opção a configurar, sujeito a criar conta e configurar token.
- Domínio: domínio próprio conectado à hospedagem do frontend e HTTPS.

## O que fazer primeiro
1. Crie um projeto em https://supabase.com/ e guarde o Project URL e a publishable key.
2. No SQL Editor do Supabase, revise e execute `supabase/migrations/202610210001_faithco_store.sql`.
3. Cadastre variantes (tamanhos/cores/SKUs/estoque) em `product_variants`; o SQL inicial cria produtos, mas não inventa tamanhos ou estoque.
4. Crie uma aplicação no Mercado Pago Developers e use primeiro as credenciais de teste. Configure `MERCADOPAGO_ACCESS_TOKEN` como Secret no Supabase.
5. Configure `SUPABASE_SERVICE_ROLE_KEY` como secret server-side. **Nunca** use essa chave no browser, no GitHub ou em variáveis públicas.
6. Configure `STORE_URL` com a URL HTTPS real da loja.
7. Faça deploy das Edge Functions via Supabase CLI ou Dashboard.
8. Configure Webhook de pagamento no painel Mercado Pago para a URL `https://SEU_PROJECT_REF.supabase.co/functions/v1/mercadopago-webhook`. Habilite eventos de pagamento e configure/valide o segredo de assinatura.
9. Antes de produção, implementar e testar validação criptográfica do `x-signature` do webhook conforme a documentação atual do Mercado Pago. O arquivo de webhook consulta o pagamento diretamente na API e compara valor, mas **não deve ser liberado em produção até a verificação de assinatura estar implementada e testada**.
10. Completar a função `quote-shipping` com a API e o contrato da conta Melhor Envio. A função de checkout agora exige uma cotação válida salva no banco e verifica se ela corresponde ao CEP e não expirou. Até a função de frete gravar cotações reais, o checkout ficará bloqueado — comportamento intencional.
11. Conectar o frontend ao Supabase: buscar produtos/variantes, selecionar tamanho/cor, coletar dados de entrega, pedir cotação de frete e invocar `create-checkout`.
12. Criar páginas de retorno do pagamento e uma área administrativa protegida para atualizar produtos, estoque, pedidos e rastreios.
13. Conectar domínio e HTTPS na hospedagem. Faça testes completos antes de divulgar.

## Segurança e ressalvas importantes
- O checkout usa preços lidos do banco no servidor, não preços enviados pelo navegador.
- O cliente não pode inserir/alterar status de pedidos diretamente no banco.
- O exemplo de checkout precisa ser endurecido antes de produção: idempotência, validação de endereço e telefone, proteção contra abuso, reserva/baixa transacional de estoque, tratamento de notificações repetidas e cancelamentos/estornos.
- O webhook incluído ainda precisa validar assinatura `x-signature`; essa lacuna está marcada no código intencionalmente. Não use em produção antes de fechar essa etapa.
- A função de frete é um esqueleto e não cota valores reais; portanto, ainda não é possível concluir compras até a integração ser implementada.
- O site ainda precisa de políticas de privacidade, troca/devolução, entrega, identificação do vendedor e canais de atendimento.
- Valores e produtos são demonstrativos. Revise tudo antes de aceitar pedidos.

## Documentação oficial
- Mercado Pago Checkout Pro: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/overview
- Mercado Pago notificações: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/payment-notifications
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase secrets: https://supabase.com/docs/guides/functions/secrets

## Estrutura
- `supabase/migrations/...sql`: schema inicial.
- `supabase/functions/create-checkout/index.ts`: cria pedido e preferência de pagamento.
- `supabase/functions/mercadopago-webhook/index.ts`: consulta status do pagamento no Mercado Pago e atualiza pedido; assinatura ainda precisa ser validada.
- `supabase/functions/quote-shipping/index.ts`: placeholder para integração de frete.
- `supabase/config.toml`: configuração das funções.
- `.env.example`: nomes das variáveis; sem segredos reais.
