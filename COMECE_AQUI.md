# Faith.Co — começo da implantação

Você informou que ainda não tem GitHub, Supabase, conta de vendedor do Mercado Pago ou domínio. Não precisa comprar domínio agora. Siga a ordem abaixo; as contas podem ser criadas sem compartilhar senhas aqui.

## Passo 1 — Criar o GitHub (agora)
1. Abra https://github.com/signup no navegador.
2. Crie sua conta e confirme o e-mail.
3. Depois entre em https://github.com/new.
4. Nome do repositório: `faith-co-loja`
5. Marque **Public** apenas se estiver confortável com o código do site visível; não há segredos reais neste pacote. Pode usar Private também.
6. Não marque README, `.gitignore` ou licença se for enviar este pacote completo.
7. Crie o repositório.
8. Baixe e extraia `Faith.Co_loja_completa_inicio.zip` no seu computador. No celular, talvez seja mais fácil fazer esta etapa em um computador; se usar Android, extraia o ZIP em um gerenciador de arquivos e use o upload de arquivos do GitHub, observando que enviar uma pasta inteira pelo navegador móvel pode ser trabalhoso.
9. No repositório recém-criado, use **Add file → Upload files** e envie os arquivos e pastas extraídos. Faça commit com a mensagem `Primeira versão da loja Faith.Co`.
10. Não envie tokens, senhas ou chaves privadas para o GitHub.

## Passo 2 — Criar o projeto Supabase
1. Abra https://supabase.com/ e crie uma conta.
2. Crie um projeto chamado `faith-co-store`.
3. Anote o Project URL e a chave pública (publishable/anon) em local privado.
4. Abra **SQL Editor** no painel Supabase.
5. Abra `supabase/migrations/202610210001_faithco_store.sql` deste pacote, copie o conteúdo e execute no SQL Editor.
6. O script cria tabelas de produtos, variantes, pedidos e itens. Ele não cadastra tamanhos/estoque fictícios: você precisará definir os SKUs, cores, tamanhos e quantidades reais.

## Passo 3 — Criar conta de vendedor Mercado Pago
1. Abra https://www.mercadopago.com.br/ e crie/regularize a conta de vendedor.
2. Entre em https://www.mercadopago.com.br/developers/ e crie uma aplicação.
3. Comece com credenciais de teste. Não use credenciais de produção antes de concluir os testes.
4. Não cole tokens no frontend nem nesta conversa. O token privado será configurado nos Secrets das Edge Functions do Supabase.

## Passo 4 — Frete
1. Crie conta no serviço de frete escolhido (por exemplo, Melhor Envio) e confirme como enviará os pedidos.
2. Precisaremos do CEP de origem da postagem, dimensões e peso embalado de cada produto/embalagem. Não adivinhe esses valores: eles alteram o preço do frete.
3. A integração de cotação ainda é um esqueleto. Não habilite checkout real até o frete devolver cotações reais validadas pelo servidor.

## Passo 5 — Publicar e domínio
1. Só depois de testar a vitrine, publique a loja com GitHub Pages, Netlify ou Vercel.
2. GitHub Pages pode servir o site estático, mas não executa funções de backend; as funções ficam no Supabase.
3. Conecte um domínio próprio quando estiver pronto. Configure HTTPS.
4. Antes de vender, complete política de privacidade, troca/devolução, envio, identificação do vendedor e atendimento.

## Estado atual do código
- `index.html`, `styles.css`, `script.js`: vitrine responsiva com produtos de demonstração, filtros, sacola local e pedido por WhatsApp (ainda precisa configurar o número).
- `supabase/migrations/...sql`: esquema inicial do banco.
- `supabase/functions/create-checkout`: função inicial para criar pedido e preferência Mercado Pago; exige cotação de frete válida.
- `supabase/functions/mercadopago-webhook`: consulta o pagamento na API, mas a validação criptográfica da assinatura ainda precisa ser implementada antes da produção.
- `supabase/functions/quote-shipping`: placeholder; ainda não consulta transportadoras.
- `config.example.js`: modelo de configuração pública do frontend; não possui credenciais reais.

## Importante: não lançar antes de concluir
Este pacote é um ponto de partida técnico, não uma loja pronta para receber pagamentos reais. Antes da produção, conectar o frontend ao banco, implementar cálculo de frete, validar assinatura de webhooks, garantir reserva/baixa transacional de estoque, testar idempotência, criar área administrativa segura e testar compra ponta a ponta.
