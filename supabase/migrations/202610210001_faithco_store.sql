-- Faith.Co: schema inicial de e-commerce para Supabase/Postgres.
-- Execute no SQL Editor do Supabase depois de revisar este arquivo.

create extension if not exists pgcrypto;

create type public.order_status as enum (
  'pending_payment', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'payment_failed'
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  category text not null check (category in ('blusas','acessorios')),
  price_cents integer not null check (price_cents >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique not null,
  size text not null default 'Único',
  color text not null default 'Bege',
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  unique(product_id, size, color)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address jsonb not null,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  status public.order_status not null default 'pending_payment',
  payment_provider text not null default 'mercadopago',
  payment_id text,
  checkout_url text,
  shipping_service text,
  tracking_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipping_quotes (
  id uuid primary key default gen_random_uuid(),
  postal_code text not null,
  service_code text not null,
  service_name text not null,
  price_cents integer not null check (price_cents >= 0),
  delivery_days integer not null check (delivery_days >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  product_name text not null,
  sku text not null,
  size text not null,
  color text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null check (line_total_cents >= 0)
);

create index orders_created_at_idx on public.orders(created_at desc);
create index order_items_order_id_idx on public.order_items(order_id);
create index variants_product_id_idx on public.product_variants(product_id);

-- O público só pode ler produtos ativos e variantes desses produtos.
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.shipping_quotes enable row level security;

create policy "Public can read active products"
on public.products for select
using (active = true);

create policy "Public can read variants for active products"
on public.product_variants for select
using (exists (
  select 1 from public.products p
  where p.id = product_variants.product_id and p.active = true
));

-- Não criar políticas públicas para orders/order_items.
-- A criação de pedidos e a alteração de status devem ocorrer exclusivamente
-- em Edge Functions seguras, usando credenciais server-side.

insert into public.products (slug,name,description,category,price_cents,active) values
('camiseta-fe-sobre-medo','Camiseta Fé Sobre o Medo','Modelagem confortável • tons naturais','blusas',7990,true),
('camiseta-graca-sobre-graca','Camiseta Graça Sobre Graça','Uma mensagem para todos os dias','blusas',7990,true),
('camiseta-tudo-e-teu','Camiseta Tudo é Teu','Minimalista, essencial e cheia de sentido','blusas',8490,true),
('ecobag-caminho','Ecobag Caminho','Sua mensagem acompanha sua rotina','acessorios',3990,true),
('caneca-bom-e-fiel','Caneca Bom e Fiel','Para começar o dia com gratidão','acessorios',3490,true),
('caderno-reflexoes','Caderno de Reflexões','Espaço para orações, estudos e ideias','acessorios',2990,true)
on conflict (slug) do nothing;
