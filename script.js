
// Faith.Co — JavaScript da loja
// Supabase + catálogo + filtros + busca + carrinho + WhatsApp.

const WHATSAPP_NUMBER = "5521988510606";
const SUPABASE_URL = "https://xuqglrbihmhcrxabustz.supabase.co";
const SUPABASE_KEY = "sb_publishable_JhOdkztggQ9P-Fsqmyy1Pw_A1XWFiOE";

const DEMO_PRODUCTS = [
  {id:"1",name:"Camiseta Fé Sobre o Medo",category:"blusas",price:79.90,tag:"MAIS VENDIDO",description:"Modelagem confortável • tons naturais",type:"shirt",art:"FAITH<br><small>OVER FEAR</small>",color:"#ead8c4"},
  {id:"2",name:"Camiseta Graça Sobre Graça",category:"blusas",price:79.90,tag:"NOVA",description:"Uma mensagem para todos os dias",type:"shirt",art:"GRAÇA<br><small>SOBRE GRAÇA</small>",color:"#c68c70"},
  {id:"3",name:"Camiseta Tudo é Teu",category:"blusas",price:84.90,tag:"",description:"Minimalista, essencial e cheia de sentido",type:"shirt",art:"TUDO<br><small>É TEU, SENHOR</small>",color:"#604638"},
  {id:"4",name:"Ecobag Caminho",category:"acessorios",price:39.90,tag:"",description:"Sua mensagem acompanha sua rotina",type:"tote",art:"O CAMINHO<br><small>JOÃO 14:6</small>",color:"#c49a76"},
  {id:"5",name:"Caneca Bom e Fiel",category:"acessorios",price:34.90,tag:"PRESENTE",description:"Para começar o dia com gratidão",type:"mug",art:"BOM<br><small>E FIEL</small>",color:"#e7d8c4"},
  {id:"6",name:"Caderno de Reflexões",category:"acessorios",price:29.90,tag:"",description:"Espaço para orações, estudos e ideias",type:"book",art:"TEMPO<br><small>COM DEUS</small>",color:"#7d4a37"},
  {id:"7",name:"Camiseta Caminhando pela Fé",category:"blusas",price:79.90,tag:"",description:"Inspirada em 2 Coríntios 5:7",type:"shirt",art:"VIVEMOS<br><small>POR FÉ</small>",color:"#d6c2a9"},
  {id:"8",name:"Ecobag Graça e Paz",category:"acessorios",price:39.90,tag:"",description:"Um presente delicado e significativo",type:"tote",art:"GRAÇA<br><small>+ PAZ</small>",color:"#a85e43"}
];

let PRODUCTS = [...DEMO_PRODUCTS];
const $ = id => document.getElementById(id);
const money = value => Number(value || 0).toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL"
});

let activeFilter = "todos";
let searchTerm = "";
let cart = [];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function normalizarCategoria(category, name = "") {
  const value = `${category || ""} ${name || ""}`
    .trim()
    .toLocaleLowerCase("pt-BR");

  if (
    value.includes("acess") ||
    value.includes("ecobag") ||
    value.includes("caneca") ||
    value.includes("caderno") ||
    value.includes("bolsa") ||
    value.includes("acessório")
  ) {
    return "acessorios";
  }

  return "blusas";
}

async function carregarProdutosDoSupabase() {
  try {
    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );

    const db = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await db
      .from("products")
      .select("id,name,description,price,category,image_url,sizes,colors,stock,active,created_at")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!Array.isArray(data) || data.length === 0) {
      console.warn(
        "Supabase respondeu sem produtos ativos; mantendo catálogo de demonstração."
      );
      return false;
    }

    PRODUCTS = data.map(p => ({
      id: String(p.id),
      name: p.name || "Produto Faith.Co",
      description: p.description || "",
      price: Number(p.price || 0),
      category: normalizarCategoria(p.category, p.name),
      tag: "",
      image_url: p.image_url || "",
      art: escapeHTML(p.name || "FAITH.CO"),
      type: "shirt",
      color: "#ead8c4",
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      colors: Array.isArray(p.colors) ? p.colors : [],
      stock: p.stock == null ? null : Number(p.stock)
    }));

    console.info(
      `Faith.Co: ${PRODUCTS.length} produtos carregados do Supabase.`
    );

    return true;
  } catch (error) {
    console.error(
      "Não foi possível carregar produtos do Supabase. Catálogo de demonstração mantido.",
      error
    );
    return false;
  }
}

function showToast(message) {
  const toast = $("toast");

  if (!toast) {
    console.info(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function renderProducts() {
  const grid = $("productGrid");
  if (!grid) return;

  const filtered = PRODUCTS.filter(product => {
    const matchesCategory =
      activeFilter === "todos" || product.category === activeFilter;

    const searchable = `${product.name} ${product.description || ""}`.toLowerCase();
    const matchesSearch = searchable.includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-results">
        Nenhum produto encontrado. Tente outra busca.
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(product => {
    const imageContent = product.image_url
      ? `<img
          src="${escapeHTML(product.image_url)}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
          style="width:100%;height:100%;object-fit:cover"
          onerror="this.style.display='none'"
        >`
      : `<div
          class="product-art ${escapeHTML(product.type || "shirt")}"
          style="background-color:${escapeHTML(product.color || "#ead8c4")}"
        ><span>${product.art || escapeHTML(product.name)}</span></div>`;

    return `
      <article class="product-card">
        <div class="product-image">
          ${imageContent}
          ${product.tag ? `<span class="product-label">${escapeHTML(product.tag)}</span>` : ""}
        </div>
        <div class="product-info">
          <h3>${escapeHTML(product.name)}</h3>
          <p class="description">${escapeHTML(product.description || "")}</p>
          <div class="price-row">
            <span class="price">${money(product.price)}</span>
            <button
              class="add-button"
              type="button"
              data-add="${escapeHTML(product.id)}"
              aria-label="Adicionar ${escapeHTML(product.name)} à sacola"
              title="Adicionar à sacola"
            >+</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll("[data-add]").forEach(button => {
    button.addEventListener("click", () => addToCart(button.dataset.add));
  });
}

function setupFilters() {
  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "todos";

      document.querySelectorAll("[data-filter]").forEach(filterButton => {
        filterButton.classList.toggle("active", filterButton === button);
      });

      renderProducts();
    });
  });
}

function setupSearch() {
  const search = $("searchInput");
  if (!search) return;

  search.addEventListener("input", () => {
    searchTerm = search.value.trim();
    renderProducts();
  });
}

function loadCart() {
  try {
    const saved = localStorage.getItem("faithco-cart");
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(item =>
        item &&
        item.id !== undefined &&
        item.id !== null &&
        Number.isFinite(Number(item.qty)) &&
        Number(item.qty) > 0
      )
      .map(item => ({
        id: String(item.id),
        qty: Math.floor(Number(item.qty))
      }))
      .filter(item =>
        PRODUCTS.some(product => String(product.id) === item.id)
      );
  } catch (error) {
    console.warn("Não foi possível recuperar a sacola.", error);
    return [];
  }
}

function persistCart() {
  try {
    localStorage.setItem("faithco-cart", JSON.stringify(cart));
  } catch (error) {
    console.warn("Não foi possível salvar a sacola.", error);
  }

  renderCart();
}

function addToCart(productId) {
  const id = String(productId);
  const product = PRODUCTS.find(p => String(p.id) === id);

  if (!product) {
    showToast("Produto não encontrado.");
    return;
  }

  const existing = cart.find(item => String(item.id) === id);
  const currentQty = existing ? existing.qty : 0;

  if (product.stock !== null && product.stock !== undefined) {
    if (currentQty >= Number(product.stock)) {
      showToast("Quantidade indisponível em estoque.");
      return;
    }
  }

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, qty: 1 });
  }

  persistCart();
  showToast("Produto adicionado à sacola!");
}

function changeQty(productId, delta) {
  const id = String(productId);
  const item = cart.find(entry => String(entry.id) === id);
  const product = PRODUCTS.find(p => String(p.id) === id);

  if (!item || !product) return;

  const nextQty = item.qty + delta;

  if (nextQty <= 0) {
    cart = cart.filter(entry => String(entry.id) !== id);
  } else {
    if (product.stock !== null && product.stock !== undefined) {
      if (nextQty > Number(product.stock)) {
        showToast("Quantidade indisponível em estoque.");
        return;
      }
    }

    item.qty = nextQty;
  }

  persistCart();
}

function removeFromCart(productId) {
  const id = String(productId);
  cart = cart.filter(item => String(item.id) !== id);
  persistCart();
  showToast("Produto removido da sacola.");
}

function renderCart() {
  const container = $("cartItems");
  const count = $("cartCount");
  const panelCount = $("cartCountPanel");
  const subtotalElement = $("cartSubtotal");

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  if (count) count.textContent = String(totalItems);
  if (panelCount) panelCount.textContent = `(${totalItems})`;

  const subtotal = cart.reduce((sum, item) => {
    const product = PRODUCTS.find(p => String(p.id) === String(item.id));
    return sum + (product ? product.price * item.qty : 0);
  }, 0);

  if (subtotalElement) subtotalElement.textContent = money(subtotal);
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-results">
        Sua sacola está vazia.<br>
        <small>Adicione seus produtos favoritos.</small>
      </div>
    `;
    return;
  }

  container.innerHTML = cart.map(item => {
    const product = PRODUCTS.find(p => String(p.id) === String(item.id));
    if (!product) return "";

    const thumb = product.image_url
      ? `<img src="${escapeHTML(product.image_url)}"
              alt="${escapeHTML(product.name)}"
              style="width:100%;height:70px;object-fit:cover">`
      : `<div class="cart-thumb">${product.art || escapeHTML(product.name)}</div>`;

    return `
      <div class="cart-item">
        ${thumb}
        <div>
          <h4>${escapeHTML(product.name)}</h4>
          <p>${money(product.price)}</p>
          <div class="qty-controls">
            <button type="button" data-minus="${escapeHTML(product.id)}" aria-label="Diminuir">−</button>
            <span>${item.qty}</span>
            <button type="button" data-plus="${escapeHTML(product.id)}" aria-label="Aumentar">+</button>
          </div>
        </div>
        <button class="remove-item" type="button"
          data-remove="${escapeHTML(product.id)}" aria-label="Remover">Remover</button>
      </div>
    `;
  }).join("");

  container.querySelectorAll("[data-minus]").forEach(button => {
    button.addEventListener("click", () => changeQty(button.dataset.minus, -1));
  });

  container.querySelectorAll("[data-plus]").forEach(button => {
    button.addEventListener("click", () => changeQty(button.dataset.plus, 1));
  });

  container.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => removeFromCart(button.dataset.remove));
  });
}

function openCart() {
  const panel = $("cartPanel");
  const overlay = $("cartOverlay");

  if (panel) {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
  }

  if (overlay) overlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeCart() {
  const panel = $("cartPanel");
  const overlay = $("cartOverlay");

  if (panel) {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  if (overlay) overlay.hidden = true;
  document.body.style.overflow = "";
}

function checkoutWhatsApp() {
  if (cart.length === 0) {
    showToast("Sua sacola está vazia.");
    return;
  }

  const lines = cart.map(item => {
    const product = PRODUCTS.find(p => String(p.id) === String(item.id));
    if (!product) return null;

    return `${item.qty}x ${product.name} — ${money(product.price * item.qty)}`;
  }).filter(Boolean);

  const subtotal = cart.reduce((sum, item) => {
    const product = PRODUCTS.find(p => String(p.id) === String(item.id));
    return sum + (product ? product.price * item.qty : 0);
  }, 0);

  const message = [
    "Olá! Quero fazer um pedido na Faith.Co:",
    "",
    ...lines,
    "",
    `Subtotal: ${money(subtotal)}`,
    "",
    "Poderiam me informar sobre pagamento e entrega?"
  ].join("\n");

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function setupCartButtons() {
  const openButton = $("openCart");
  const closeButton = $("closeCart");
  const overlay = $("cartOverlay");
  const checkoutButton = $("checkoutButton");

  if (openButton) openButton.addEventListener("click", openCart);
  if (closeButton) closeButton.addEventListener("click", closeCart);
  if (overlay) overlay.addEventListener("click", closeCart);

  if (checkoutButton) {
    checkoutButton.addEventListener("click", checkoutWhatsApp);
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeCart();
  });
}

function setupMobileMenu() {
  const toggle = $("menuToggle");
  const nav = $("mainNav");

  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Fechar menu" : "Abrir menu"
    );
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
    });
  });
}

function setupNewsletter() {
  const form = $("newsletterForm");
  const emailInput = $("newsletterEmail");
  const message = $("newsletterMessage");

  if (!form || !emailInput) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const email = emailInput.value.trim();

    if (!email) {
      emailInput.focus();
      return;
    }

    if (message) {
      message.textContent =
        "Obrigado pelo interesse! A inscrição ainda precisa ser conectada a um serviço de e-mail.";
    }

    form.reset();
  });
}

function setupWhatsAppFooter() {
  const link = $("whatsFooter");
  if (!link) return;

  link.href = `https://wa.me/${WHATSAPP_NUMBER}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
}

async function initStore() {
  const year = $("year");
  if (year) year.textContent = String(new Date().getFullYear());

  setupFilters();
  setupSearch();
  setupCartButtons();
  setupMobileMenu();
  setupNewsletter();
  setupWhatsAppFooter();

  // Carrega produtos antes de restaurar a sacola,
  // para reconhecer também os IDs UUID do Supabase.
  await carregarProdutosDoSupabase();

  cart = loadCart();
  renderProducts();
  renderCart();
}

// Recupera o carrinho salvo no navegador.


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initStore);
} else {
  initStore();
}
