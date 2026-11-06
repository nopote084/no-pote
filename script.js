"use strict";

/* =========================================
   NO POTE - JAVASCRIPT COMPLETO
   Com Painel Admin, Cálculo de Frete e WhatsApp
========================================= */

const WHATSAPP = "5584981921744";
const PIX = "no.pote.084@gmail.com";
const EXTRA_PRICE = 2;
const PRICE_750 = 20;

const STORAGE_CART = "nopote_cart";
const STORAGE_CUSTOMER = "nopote_customer";
const STORAGE_PRODUCTS = "nopote_produtos";
const STORAGE_CONFIG = "nopote_config_enderecos";

// Coordenadas Fixas
const ENDERECO_1 = { lat: -5.7595841, lng: -35.2497778 }; // Potengi
const ENDERECO_2 = { lat: -5.7832433, lng: -35.3141405 }; // São Gonçalo

// Produtos Padrão (Caso o admin ainda não tenha cadastrado nada)
const DEFAULT_PRODUCTS = [
    { id: "mini-misto", name: "Mini Misto", size: "140ml", price: 5, description: "Molho vermelho, creme de frango, purê e pão.", image: "assets/mini-misto.jpeg", category: "mini" },
    { id: "mini-tradicional", name: "Mini Tradicional", size: "140ml", price: 5, description: "Molho vermelho, purê e pão.", image: "assets/mini-tradicional.jpeg", category: "mini" },
    { id: "mini-frango", name: "Mini Frango", size: "140ml", price: 5, description: "Creme de frango, purê e pão.", image: "assets/mini-frango.jpeg", category: "mini" },
    { id: "tradicional", name: "Tradicional", size: "350ml", price: 15, description: "Molho vermelho, purê e pão.", image: "assets/tradicional.jpeg", category: "regular" },
    { id: "frango-cremoso", name: "Frango Cremoso", size: "350ml", price: 15, description: "Creme de frango, purê e pão.", image: "assets/frango-cremoso.jpeg", category: "regular" },
    { id: "misto", name: "Misto", size: "350ml", price: 15, description: "Molho vermelho, creme de frango, purê e pão.", image: "assets/misto.jpeg", category: "regular" },
    { id: "calabresa", name: "Calabresa", size: "350ml", price: 16, description: "Molho de calabresa, purê e pão.", image: "assets/misto.jpeg", category: "regular" }
];

// Variáveis Globais
let cart = [];
let PRODUCTS = [];
let currentProduct = null;
let quantity = 1;
let selectedFlavors = [];
let is750 = false;
let deliveryFee = 0;
let isSaoGoncalo = false; // Controla qual endereço usar

const FLAVORS_750 = ["Tradicional", "Frango Cremoso", "Misto", "Calabresa"];

/* =========================================
   FUNÇÕES AUXILIARES
========================================= */

const $ = id => document.getElementById(id);

function money(value) {
    return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
}

function showToast(message) {
    const toast = $("toast");
    if (!toast) { alert(message); return; }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 3500);
}

function openModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.add("open");
    document.body.classList.add("modal-open");
}

function closeModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.remove("open");
    if (!document.querySelector(".modal-backdrop.open")) {
        document.body.classList.remove("modal-open");
    }
}

/* =========================================
   LÓGICA DO ADMIN (SALVAR/CARREGAR PRODUTOS)
========================================= */

function loadProducts() {
    const saved = localStorage.getItem(STORAGE_PRODUCTS);
    PRODUCTS = saved ? JSON.parse(saved) : [...DEFAULT_PRODUCTS];
}

function saveProducts() {
    localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(PRODUCTS));
}

function loadConfig() {
    const saved = localStorage.getItem(STORAGE_CONFIG);
    if (saved) {
        isSaoGoncalo = JSON.parse(saved).isSaoGoncalo;
    }
}

function saveConfig() {
    localStorage.setItem(STORAGE_CONFIG, JSON.stringify({ isSaoGoncalo }));
}

function renderAdminList() {
    const list = $("adminProductList");
    if (!list) return;
    
    list.innerHTML = PRODUCTS.map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #fff; border: 1px solid #ddd; padding: 10px; border-radius: 8px;">
            <div>
                <strong style="font-size: 0.9rem;">${p.name}</strong><br>
                <small style="color: var(--red);">R$ ${p.price.toFixed(2)} - ${p.category}</small>
            </div>
            <button onclick="window.deleteProduct('${p.id}')" style="background: #ff4d4d; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Excluir</button>
        </div>
    `).join("");
}

// Função global para o botão de excluir
window.deleteProduct = (id) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
        PRODUCTS = PRODUCTS.filter(p => p.id !== id);
        saveProducts();
        renderProducts();
        renderAdminList();
    }
};

/* =========================================
   CÁLCULO DE DISTÂNCIA E FRETE
========================================= */

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

function calcularFretePorDistancia(km) {
    // ALTERE AQUI OS PREÇOS BASEADOS NO UBER
    if (km <= 2) return 5.00;
    if (km <= 4) return 8.00;
    if (km <= 6) return 11.00;
    if (km <= 8) return 14.00;
    if (km <= 10) return 18.00;
    return 25.00;
}

async function calcularFretePeloCEP(cep) {
    try {
        showToast("Calculando frete...");
        const response = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${cep}&country=Brazil&format=json&limit=1`);
        const data = await response.json();

        if (data.length > 0) {
            const clienteLat = parseFloat(data[0].lat);
            const clienteLng = parseFloat(data[0].lon);

            // Verifica qual endereço usar baseado na configuração salva
            const origem = isSaoGoncalo ? ENDERECO_2 : ENDERECO_1;
            const nomeOrigem = isSaoGoncalo ? "São Gonçalo" : "Potengi";

            const distancia = calcularDistancia(origem.lat, origem.lng, clienteLat, clienteLng);
            deliveryFee = calcularFretePorDistancia(distancia);

            $("pixProducts").textContent = money(cartTotal());
            $("pixDelivery").textContent = money(deliveryFee);
            $("pixAmount").textContent = money(cartTotal() + deliveryFee);

            showToast(`Frete: R$ ${deliveryFee.toFixed(2)} (Saindo de ${nomeOrigem})`);
        } else {
            showToast("CEP não encontrado. Digite novamente.");
        }
    } catch (error) {
        console.error(error);
        showToast("Erro de conexão. Verifique sua internet.");
    }
}

/* =========================================
   RENDERIZAÇÃO E CARRINHO
========================================= */

function createProductCard(product) {
    return `
        <article class="product-card">
            <div class="product-image-wrap">
                ${product.image ? `<img src="${product.image}" alt="${escapeHTML(product.name)}" class="product-image" loading="lazy" onerror="this.style.display='none'">` : `<div class="product-image-placeholder">🌭</div>`}
                <span class="pill">${product.size}</span>
            </div>
            <div class="product-info">
                <h3>${escapeHTML(product.name)}</h3>
                <p>${escapeHTML(product.description)}</p>
                <div class="product-bottom">
                    <strong>${money(product.price)}</strong>
                    <button type="button" class="add-button" data-product="${product.id}" aria-label="Adicionar ${escapeHTML(product.name)}">+</button>
                </div>
            </div>
        </article>
    `;
}

function renderProducts() {
    const mini = $("miniProducts");
    const regular = $("regularProducts");
    if (!mini || !regular) return;
    mini.innerHTML = PRODUCTS.filter(p => p.category === "mini").map(createProductCard).join("");
    regular.innerHTML = PRODUCTS.filter(p => p.category === "regular").map(createProductCard).join("");
}

function openProduct(productId) {
    currentProduct = PRODUCTS.find(p => p.id === productId);
    if (!currentProduct) return;
    is750 = false;
    quantity = 1;
    $("modalTitle").textContent = currentProduct.name;
    $("modalDescription").textContent = currentProduct.description + " (" + currentProduct.size + ")";
    $("modalQty").textContent = quantity;
    $("flavorLimit").textContent = "Este tamanho possui um sabor.";
    $("flavorChoices").innerHTML = `
        <div class="choice-row">
            <span>${escapeHTML(currentProduct.name)}</span>
            <strong>${money(currentProduct.price)}</strong>
        </div>
    `;
    $("freePotato").checked = true;
    $("freeSauce").checked = true;
    $("extraPotato").checked = false;
    $("extraSauce").checked = false;
    $("itemNote").value = "";
    updateProductPrice();
    openModal("productModal");
}

function open750() {
    currentProduct = null;
    is750 = true;
    quantity = 1;
    $("modalTitle").textContent = "Monte seu No Pote";
    $("modalDescription").textContent = "Escolha até 3 sabores para seu pote de 750ml.";
    $("modalQty").textContent = quantity;
    $("flavorLimit").textContent = "Escolha de 1 a 3 sabores.";
    $("flavorChoices").innerHTML = FLAVORS_750.map(flavor => `
        <label class="choice-row">
            <span>${escapeHTML(flavor)}</span>
            <input type="checkbox" class="flavor-input" value="${escapeHTML(flavor)}">
        </label>
    `).join("");
    $("freePotato").checked = true;
    $("freeSauce").checked = true;
    $("extraPotato").checked = false;
    $("extraSauce").checked = false;
    $("itemNote").value = "";
    updateProductPrice();
    openModal("productModal");
}

function getModalExtras() {
    return ($("extraPotato").checked ? EXTRA_PRICE : 0) + ($("extraSauce").checked ? EXTRA_PRICE : 0);
}

function updateProductPrice() {
    const basePrice = is750 ? PRICE_750 : currentProduct.price;
    const total = (basePrice + getModalExtras()) * quantity;
    $("modalPrice").textContent = money(total);
    $("modalQty").textContent = quantity;
}

function changeQuantity(value) {
    quantity = Math.max(1, quantity + value);
    updateProductPrice();
}

function addCurrentProduct() {
    const flavors = is750 ? Array.from(document.querySelectorAll(".flavor-input:checked")).map(input => input.value) : [];
    if (is750 && (flavors.length < 1 || flavors.length > 3)) {
        showToast("Escolha de 1 a 3 sabores!");
        return;
    }
    const basePrice = is750 ? PRICE_750 : currentProduct.price;
    const price = basePrice + getModalExtras();
    const item = {
        id: is750 ? "pote-750" : currentProduct.id,
        name: is750 ? "Monte seu No Pote" : currentProduct.name,
        size: is750 ? "750ml" : currentProduct.size,
        price, quantity, flavors,
        freePotato: $("freePotato").checked,
        freeSauce: $("freeSauce").checked,
        extraPotato: $("extraPotato").checked,
        extraSauce: $("extraSauce").checked,
        note: $("itemNote").value.trim()
    };
    const key = [item.id, item.flavors.join("+"), item.freePotato, item.freeSauce, item.extraPotato, item.extraSauce, item.note].join("|");
    const existing = cart.find(product => product.key === key);
    if (existing) { existing.quantity += quantity; } 
    else { item.key = key; cart.push(item); }
    
    saveCart();
    closeModal("productModal");
    renderCart();
    showToast("Produto adicionado!");
}

function cartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function cartCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function renderCart() {
    $("cartCount").textContent = cartCount();
    $("cartTotal").textContent = money(cartTotal());
    $("cartSubtotal").textContent = money(cartTotal());
    $("cartGrandTotal").textContent = money(cartTotal());
    $("pixProducts").textContent = money(cartTotal());
    $("pixDelivery").textContent = money(deliveryFee);
    $("pixAmount").textContent = money(cartTotal() + deliveryFee);

    const container = $("cartItems");
    if (!cart.length) {
        container.innerHTML = `<div class="empty-cart"><h3>Seu carrinho está vazio!</h3><p>Escolha seu No Pote favorito.</p></div>`;
        return;
    }
    container.innerHTML = cart.map(item => `
        <article class="cart-item">
            <div class="cart-item-info">
                <h3>${escapeHTML(item.name)}</h3>
                <small>${escapeHTML(item.size)}</small>
                ${item.flavors.length ? `<p>Sabores: ${item.flavors.map(escapeHTML).join(", ")}</p>` : ""}
                <p>${item.freePotato ? "Batata palha grátis" : "Sem batata palha"} • ${item.freeSauce ? "Molho grátis" : "Sem molho"}</p>
                ${item.extraPotato ? "<p>Batata extra: +R$ 2,00</p>" : ""}
                ${item.extraSauce ? "<p>Molho extra: +R$ 2,00</p>" : ""}
                ${item.note ? `<p>Obs.: ${escapeHTML(item.note)}</p>` : ""}
                <strong>${money(item.price * item.quantity)}</strong>
            </div>
            <div class="cart-item-actions">
                <button type="button" data-cart-minus="${escapeHTML(item.key)}">−</button>
                <b>${item.quantity}</b>
                <button type="button" data-cart-plus="${escapeHTML(item.key)}">+</button>
                <button type="button" data-cart-remove="${escapeHTML(item.key)}" aria-label="Remover item">×</button>
            </div>
        </article>
    `).join("");
}

function changeCartItem(key, amount) {
    const item = cart.find(p => p.key === key);
    if (!item) return;
    item.quantity += amount;
    if (item.quantity <= 0) cart = cart.filter(p => p.key !== key);
    saveCart();
    renderCart();
}

function saveCart() { localStorage.setItem(STORAGE_CART, JSON.stringify(cart)); }
function loadCart() {
    const saved = localStorage.getItem(STORAGE_CART);
    if (saved) cart = JSON.parse(saved);
}
function saveCustomer(data) { localStorage.setItem(STORAGE_CUSTOMER, JSON.stringify(data)); }
function loadCustomer() {
    const saved = localStorage.getItem(STORAGE_CUSTOMER);
    return saved ? JSON.parse(saved) : null;
}

/* =========================================
   FINALIZAÇÃO E WHATSAPP
========================================= */

function openCheckout() {
    if (!cart.length) { showToast("Adicione algum produto primeiro!"); return; }
    
    const saved = loadCustomer();
    if (saved) {
        $("customerName").value = saved.name || "";
        $("customerPhone").value = saved.phone || "";
        $("customerCep").value = saved.cep || "";
        $("customerAddress").value = saved.address || "";
        $("deliveryType").value = saved.delivery || "Entrega";
        $("orderNote").value = saved.orderNote || "";
    }
    
    deliveryFee = 0;
    $("pixProducts").textContent = money(cartTotal());
    $("pixDelivery").textContent = money(deliveryFee);
    $("pixAmount").textContent = money(cartTotal() + deliveryFee);

    closeModal("cartModal");
    openModal("checkoutModal");
}

function copyPix() {
    navigator.clipboard.writeText(PIX).then(() => showToast("Chave Pix copiada!")).catch(() => prompt("Copie sua chave Pix:", PIX));
}

function sendWhatsApp() {
    if (!cart.length) { showToast("Seu carrinho está vazio!"); return; }
    
    const name = $("customerName").value.trim();
    const phone = $("customerPhone").value.trim();
    const cep = $("customerCep").value.trim();
    const address = $("customerAddress").value.trim();
    const delivery = $("deliveryType").value;
    const orderNote = $("orderNote").value.trim();
    
    if (!name) { showToast("Informe seu nome!"); $("customerName").focus(); return; }
    if (!phone) { showToast("Informe seu celular!"); $("customerPhone").focus(); return; }
    if (delivery === "Entrega" && !cep) { showToast("Informe seu CEP!"); $("customerCep").focus(); return; }
    if (delivery === "Entrega" && !address) { showToast("Informe seu endereço!"); $("customerAddress").focus(); return; }
    if (delivery === "Entrega" && deliveryFee === 0) { showToast("Aguarde o cálculo do frete."); $("customerCep").focus(); return; }

    saveCustomer({ name, phone, cep, address, delivery, orderNote });
    const totalComEntrega = cartTotal() + deliveryFee;

    let message = "*NOVO PEDIDO - NO POTE*\n\n";
    message += `Cliente: ${name}\n`;
    message += `Celular: ${phone}\n`;
    message += `Recebimento: ${delivery}\n`;
    if (delivery === "Entrega") {
        message += `CEP: ${cep}\n`;
        message += `Endereço: ${address}\n`;
    }
    message += "\n*ITENS DO PEDIDO*\n\n";
    
    cart.forEach((item, index) => {
        message += `${index + 1}. *${item.name}*\n`;
        message += `Tamanho: ${item.size}\n`;
        message += `Qtd: ${item.quantity}\n`;
        if (item.flavors.length) message += `Sabores: ${item.flavors.join(", ")}\n`;
        message += item.freePotato ? "Batata palha grátis\n" : "Sem batata palha\n";
        message += item.freeSauce ? "Molho especial grátis\n" : "Sem molho especial\n";
        if (item.extraPotato) message += "Batata extra: R$ 2,00\n";
        if (item.extraSauce) message += "Molho extra: R$ 2,00\n";
        if (item.note) message += `Obs.: ${item.note}\n`;
        message += `Subtotal: ${money(item.price * item.quantity)}\n\n`;
    });
    
    message += `Subtotal Produtos: ${money(cartTotal())}\n`;
    message += `Taxa de Entrega: ${money(deliveryFee)}\n`;
    message += `*TOTAL A PAGAR: ${money(totalComEntrega)}*\n`;
    message += `Pix: ${PIX}\n`;
    
    if (orderNote) message += `\nObs. geral: ${orderNote}\n`;
    message += "\n⚠️ *IMPORTANTE:* Envie o *comprovante* nesta conversa para confirmarmos seu pedido. ❤️";

    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    closeModal("checkoutModal");
    $("successName").textContent = name;
    openModal("successModal");
}

/* =========================================
   EVENTOS GERAIS
========================================= */

function setupEvents() {
    document.addEventListener("click", event => {
        if (event.target.closest("[data-product]")) { openProduct(event.target.closest("[data-product]").dataset.product); return; }
        if (event.target.closest("#customButton")) { open750(); return; }
        if (event.target.closest("#qtyMinus")) { changeQuantity(-1); return; }
        if (event.target.closest("#qtyPlus")) { changeQuantity(1); return; }
        if (event.target.closest("#addToCart")) { addCurrentProduct(); return; }
        if (event.target.closest("#cartFab")) { renderCart(); openModal("cartModal"); return; }
        
        const plus = event.target.closest("[data-cart-plus]");
        if (plus) { changeCartItem(plus.dataset.cartPlus, 1); return; }
        const minus = event.target.closest("[data-cart-minus]");
        if (minus) { changeCartItem(minus.dataset.cartMinus, -1); return; }
        const remove = event.target.closest("[data-cart-remove]");
        if (remove) { cart = cart.filter(item => item.key !== remove.dataset.cartRemove); saveCart(); renderCart(); return; }
        
        if (event.target.closest("#goCheckout")) { openCheckout(); return; }
        if (event.target.closest("#copyPix")) { copyPix(); return; }
        if (event.target.closest("#sendWhatsApp")) { sendWhatsApp(); return; }

        const closeButton = event.target.closest("[data-close]");
        if (closeButton) { closeModal(closeButton.dataset.close); return; }
        if (event.target.classList.contains("modal-backdrop")) { closeModal(event.target.id); }
    });

    // Modal de Adicionais
    ["extraPotato", "extraSauce"].forEach(id => { $(id).addEventListener("change", updateProductPrice); });
    
    $("flavorChoices").addEventListener("change", event => {
        if (!event.target.matches(".flavor-input")) return;
        const checked = document.querySelectorAll(".flavor-input:checked");
        if (checked.length > 3) {
            event.target.checked = false;
            showToast("Máximo de 3 sabores!");
        }
    });

    // Menu Mobile
    const menuToggle = $("menuToggle");
    const mainNav = $("mainNav");
    if (menuToggle && mainNav) {
        menuToggle.addEventListener("click", () => mainNav.classList.toggle("active"));
        mainNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => mainNav.classList.remove("active")));
    }

    // Cálculo por CEP
    const cepInput = $("customerCep");
    if (cepInput) {
        cepInput.addEventListener("blur", (e) => {
            const cep = e.target.value.replace(/\D/g, '');
            if (cep.length === 8) calcularFretePeloCEP(cep);
        });
    }

    // Máscara de Celular
    const phoneInput = $("customerPhone");
    if (phoneInput) {
        phoneInput.addEventListener("input", (e) => {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        });
    }

    // Tela de Sucesso
    const closeSuccessBtn = $("closeSuccessBtn");
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener("click", () => {
            closeModal("successModal");
            cart = [];
            saveCart();
            renderCart();
        });
    }

     // --- LÓGICA DO PAINEL ADMIN ---
    const adminTrigger = $("adminTrigger");
    if(adminTrigger) {
        adminTrigger.addEventListener("click", () => {
            renderAdminList();
            if($("adminToggleSaoGoncalo")) {
                $("adminToggleSaoGoncalo").checked = isSaoGoncalo;
            }
            openModal("adminModal");
        });
    }

    // Salvar novo produto no Admin
    const btnSaveProduct = $("btnSaveProduct");
    if(btnSaveProduct) {
        btnSaveProduct.addEventListener("click", () => {
            const name = $("adminName").value;
            const price = parseFloat($("adminPrice").value);
            const desc = $("adminDesc").value;
            const img = $("adminImg").value;
            const cat = $("adminCat").value;

            if(!name || !price || !img) return showToast("Preencha nome, preço e imagem.");

            const newProduct = {
                id: "prod-" + Date.now(),
                name: name,
                size: cat === 'mini' ? '140ml' : '350ml',
                price: price,
                description: desc,
                image: img,
                category: cat
            };

            PRODUCTS.push(newProduct);
            saveProducts();
            renderProducts();
            renderAdminList();
            showToast("Produto adicionado!");
            
            // Limpa os campos
            $("adminName").value = ""; $("adminPrice").value = ""; $("adminDesc").value = ""; $("adminImg").value = "";
        });
    }

    // Mudar de endereço no Admin
    const adminToggleSaoGoncalo = $("adminToggleSaoGoncalo");
    if(adminToggleSaoGoncalo) {
        adminToggleSaoGoncalo.addEventListener("change", (e) => {
            isSaoGoncalo = e.target.checked;
            saveConfig();
            showToast(isSaoGoncalo ? "Endereço alterado para São Gonçalo" : "Endereço alterado para Potengi");
        });
    }

    // Exportar dados do Admin
    const btnExportData = $("btnExportData");
    if(btnExportData) {
        btnExportData.addEventListener("click", () => {
            const dataStr = JSON.stringify(PRODUCTS, null, 4);
            navigator.clipboard.writeText(dataStr).then(() => {
                showToast("Código copiado! Cole no GitHub.");
            });
        });
    }

/* =========================================
   INICIALIZAÇÃO
========================================= */

function init() {
    loadProducts();
    loadCart();
    loadConfig();
    renderProducts();
    renderCart();
    setupEvents();
    const year = $("year");
    if (year) year.textContent = new Date().getFullYear();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
