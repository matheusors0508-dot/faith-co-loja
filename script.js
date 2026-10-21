// Faith.Co — JavaScript da loja (versão mais robusta para teste no Spck Editor)
// IMPORTANTE: troque WHATSAPP_NUMBER pelo número real, apenas dígitos, antes de usar o atendimento.
const WHATSAPP_NUMBER = "5521999999999";
const PRODUCTS = [
  {id:1,name:"Camiseta Fé Sobre o Medo",category:"blusas",price:79.90,tag:"MAIS VENDIDO",description:"Modelagem confortável • tons naturais",type:"shirt",art:"FAITH<br><small>OVER FEAR</small>",color:"#ead8c4"},
  {id:2,name:"Camiseta Graça Sobre Graça",category:"blusas",price:79.90,tag:"NOVA",description:"Uma mensagem para todos os dias",type:"shirt",art:"GRAÇA<br><small>SOBRE GRAÇA</small>",color:"#c68c70"},
  {id:3,name:"Camiseta Tudo é Teu",category:"blusas",price:84.90,tag:"",description:"Minimalista, essencial e cheia de sentido",type:"shirt",art:"TUDO<br><small>É TEU, SENHOR</small>",color:"#604638"},
  {id:4,name:"Ecobag Caminho",category:"acessorios",price:39.90,tag:"",description:"Sua mensagem acompanha sua rotina",type:"tote",art:"O CAMINHO<br><small>JOÃO 14:6</small>",color:"#c49a76"},
  {id:5,name:"Caneca Bom e Fiel",category:"acessorios",price:34.90,tag:"PRESENTE",description:"Para começar o dia com gratidão",type:"mug",art:"BOM<br><small>E FIEL</small>",color:"#e7d8c4"},
  {id:6,name:"Caderno de Reflexões",category:"acessorios",price:29.90,tag:"",description:"Espaço para orações, estudos e ideias",type:"book",art:"TEMPO<br><small>COM DEUS</small>",color:"#7d4a37"},
  {id:7,name:"Camiseta Caminhando pela Fé",category:"blusas",price:79.90,tag:"",description:"Inspirada em 2 Coríntios 5:7",type:"shirt",art:"VIVEMOS<br><small>POR FÉ</small>",color:"#d6c2a9"},
  {id:8,name:"Ecobag Graça e Paz",category:"acessorios",price:39.90,tag:"",description:"Um presente delicado e significativo",type:"tote",art:"GRAÇA<br><small>+ PAZ</small>",color:"#a85e43"}
];
const $ = id => document.getElementById(id);
const money = value => Number(value).toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
let activeFilter = "todos";
let searchTerm = "";
let cart = loadCart();

function loadCart() {
  try {
    const saved = window.localStorage.getItem("faithco-cart");
    const parsed = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => PRODUCTS.some(p => p.id === Number(item.id)) && Number(item.qty) > 0)
      .map(item => ({id:Number(item.id), qty:Math.floor(Number(item.qty))}));
  } catch (error) {
    console.warn("Faith.Co: armazenamento local indisponível; o carrinho ficará apenas nesta sessão.", error);
    return [];
  }
}
function persistCart() {
  try { window.localStorage.setItem("faithco-cart", JSON.stringify(cart)); }
  catch (error) { console.warn("Não foi possível salvar o carrinho neste navegador.", error); }
  renderCart();
}
function showToast(message) {
  const toast = $("toast");
  if (!toast) { window.alert(message); return; }
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}
function renderProducts() {
  const grid = $("productGrid");
  if (!grid) return;
  const filtered = PRODUCTS.filter(product => {
    const matchesCategory = activeFilter === "todos" || product.category === activeFilter;
    const text = `${product.name} ${product.description} ${product.tag}`.toLocaleLowerCase("pt-BR");
    return matchesCategory && text.includes(searchTerm);
  });
  if (!filtered.length) {
    grid.innerHTML = '<p class="empty-results">Não encontramos produtos com essa busca.</p>';
    return;
  }
  grid.innerHTML = filtered.map(p => `
    <article class="product-card">
      <div class="product-image" style="background:${p.color}22">
        <span class="product-label">${p.tag || (p.category === "blusas" ? "FAITH.CO" : "COM PROPÓSITO")}</span>
        <div class="product-art ${p.type}" style="${p.type === "shirt" ? `background:${p.color};color:${p.color === "#604638" ? "#f3eadb" : "#382820"}` : ""}"><span>${p.art}</span></div>
      </div>
      <div class="product-info"><h3>${p.name}</h3><p class="description">${p.description}</p>
        <div class="price-row"><span class="price">${money(p.price)}</span><button class="add-button" type="button" data-add="${p.id}" aria-label="Adicionar ${p.name} à sacola">+</button></div>
      </div>
    </article>`).join("");
}
function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === Number(id));
  if (!product) return showToast("Não encontramos esse produto.");
  const existing = cart.find(item => item.id === product.id);
  if (existing) existing.qty += 1;
  else cart.push({id:product.id, qty:1});
  persistCart();
  showToast(`${product.name} adicionado à sacola!`);
}
function renderCart() {
  const itemsContainer = $("cartItems");
  if (!itemsContainer) return;
  cart = cart.filter(item => PRODUCTS.some(p => p.id === item.id) && item.qty > 0);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  if ($("cartCount")) $("cartCount").textContent = count;
  if ($("cartCountPanel")) $("cartCountPanel").textContent = `(${count})`;
  const subtotal = cart.reduce((sum, item) => {
    const product = PRODUCTS.find(p => p.id === item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
  if ($("cartSubtotal")) $("cartSubtotal").textContent = money(subtotal);
  itemsContainer.innerHTML = cart.length ? cart.map(item => {
    const p = PRODUCTS.find(product => product.id === item.id);
    return `<div class="cart-item"><div class="cart-thumb">${p.art.replace(/<[^>]*>/g," ")}</div><div><h4>${p.name}</h4><p>${money(p.price)}</p><div class="qty-controls"><button type="button" data-qty="${p.id}" data-delta="-1" aria-label="Diminuir quantidade">−</button><span>${item.qty}</span><button type="button" data-qty="${p.id}" data-delta="1" aria-label="Aumentar quantidade">+</button></div></div><button type="button" class="remove-item" data-remove="${p.id}">Remover</button></div>`;
  }).join("") : '<div class="empty-results">Sua sacola está vazia.<br><br>Encontre uma peça que fale ao seu coração.</div>';
}
function toggleCart(open) {
  const panel = $("cartPanel"), overlay = $("cartOverlay");
  if (!panel || !overlay) return;
  panel.classList.toggle("open", open);
  panel.setAttribute("aria-hidden", String(!open));
  overlay.hidden = !open;
  document.body.style.overflow = open ? "hidden" : "";
}
function checkout() {
  if (!cart.length) return showToast("Adicione um produto antes de finalizar.");
  if (!/^\d{10,15}$/.test(WHATSAPP_NUMBER) || WHATSAPP_NUMBER === "5521999999999") {
    return showToast("Para testar o checkout, configure seu número de WhatsApp no início do script.js.");
  }
  const lines = cart.map(item => {
    const p = PRODUCTS.find(product => product.id === item.id);
    return `• ${p.name} — ${item.qty}x ${money(p.price)} = ${money(p.price * item.qty)}`;
  });
  const total = cart.reduce((sum,item) => sum + PRODUCTS.find(p => p.id === item.id).price * item.qty, 0);
  const message = `Olá, Faith.Co! Quero fazer este pedido:\n\n${lines.join("\n")}\n\nSubtotal: ${money(total)}\n\nPoderiam me informar tamanhos disponíveis, frete e prazo?`;
  window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
function initStore() {
  // Filtros e busca
  document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "todos";
    document.querySelectorAll(".filter").forEach(other => other.classList.toggle("active", other === button));
    renderProducts();
  }));
  const search = $("searchInput");
  if (search) search.addEventListener("input", event => {
    searchTerm = event.target.value.trim().toLocaleLowerCase("pt-BR");
    renderProducts();
  });
  // Delegação: continua funcionando quando os cards são redesenhados pela busca/filtro.
  document.addEventListener("click", event => {
    const add = event.target.closest("[data-add]");
    if (add) return addToCart(add.dataset.add);
    const qty = event.target.closest("[data-qty]");
    if (qty) {
      const id = Number(qty.dataset.qty), delta = Number(qty.dataset.delta);
      const item = cart.find(entry => entry.id === id);
      if (item) item.qty += delta;
      cart = cart.filter(entry => entry.qty > 0);
      return persistCart();
    }
    const remove = event.target.closest("[data-remove]");
    if (remove) { cart = cart.filter(entry => entry.id !== Number(remove.dataset.remove)); return persistCart(); }
  });
  if ($("openCart")) $("openCart").addEventListener("click", () => toggleCart(true));
  if ($("closeCart")) $("closeCart").addEventListener("click", () => toggleCart(false));
  if ($("cartOverlay")) $("cartOverlay").addEventListener("click", () => toggleCart(false));
  if ($("checkoutButton")) $("checkoutButton").addEventListener("click", checkout);
  if ($("newsletterForm")) $("newsletterForm").addEventListener("submit", event => {
    event.preventDefault();
    const email = $("newsletterEmail");
    if (email && email.checkValidity()) {
      $("newsletterMessage").textContent = "Obrigado pelo interesse! O cadastro ainda precisa ser conectado a uma ferramenta de e-mail.";
      showToast("Formulário demonstrativo enviado.");
      email.value = "";
    } else if (email) email.reportValidity();
  });
  if ($("menuToggle")) $("menuToggle").addEventListener("click", () => $("mainNav")?.classList.toggle("open"));
  document.querySelectorAll("#mainNav a").forEach(link => link.addEventListener("click", () => $("mainNav")?.classList.remove("open")));
  if ($("year")) $("year").textContent = new Date().getFullYear();
  if ($("whatsFooter")) $("whatsFooter").addEventListener("click", event => {
    event.preventDefault();
    if (WHATSAPP_NUMBER === "5521999999999") return showToast("Configure seu WhatsApp no arquivo script.js.");
    window.location.href = `https://wa.me/${WHATSAPP_NUMBER}`;
  });
  renderProducts();
  renderCart();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initStore);
else initStore();
