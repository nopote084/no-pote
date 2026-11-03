"use strict";

/* =========================================
   NO POTE - JAVASCRIPT CORRIGIDO
   Com salvamento de preferências, celular e WhatsApp
========================================= */

const WHATSAPP = "5584981921744";
const PIX = "no.pote.084@gmail.com";
const EXTRA_PRICE = 2;
const PRICE_750 = 20;

const STORAGE_CART = "nopote_cart";
const STORAGE_CUSTOMER = "nopote_customer";

const PRODUCTS = [
    {
        id: "mini-misto",
        name: "Mini Misto",
        size: "140ml",
        price: 5,
        description: "Molho vermelho, creme de frango, purê e pão.",
        image: "assets/mini-misto.jpeg",
        category: "mini"
    },
    {
        id: "mini-tradicional",
        name: "Mini Tradicional",
        size: "140ml",
        price: 5,
        description: "Molho vermelho, purê e pão.",
        image: "assets/mini-tradicional.jpeg",
        category: "mini"
    },
    {
        id: "mini-frango",
        name: "Mini Frango",
        size: "140ml",
        price: 5,
        description: "Creme de frango, purê e pão.",
        image: "assets/mini-frango.jpeg",
        category: "mini"
    },
    {
        id: "tradicional",
        name: "Tradicional",
        size: "350ml",
        price: 15,
        description: "Molho vermelho, purê e pão.",
        image: "assets/tradicional.jpeg",
        category: "regular"
    },
    {
        id: "frango-cremoso",
        name: "Frango Cremoso",
        size: "350ml",
        price: 15,
        description: "Creme de frango, purê e pão.",
        image: "assets/frango-cremoso.jpeg",
        category: "regular"
    },
    {
        id: "misto",
        name: "Misto",
        size: "350ml",
        price: 15,
        description: "Molho vermelho, creme de frango, purê e pão.",
        image: "assets/misto.jpeg",
        category: "regular"
    },
    {
        id: "calabresa",
        name: "Calabresa",
        size: "350ml",
        price: 16,
        description: "Molho de calabresa, purê e pão.",
        image: "assets/misto.jpeg",
        category: "regular"
    }
];

const FLAVORS_750 = [
    "Tradicional",
    "Frango Cremoso",
    "Misto",
    "Calabresa"
];

let cart = [];
let currentProduct = null;
let quantity = 1;
let selectedFlavors = [];
let is750 = false;
let deliveryFee = 0;

/* =========================================
   FUNÇÕES AUXILIARES
========================================= */

const $ = id => document.getElementById(id);

function money(value) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function showToast(message) {
    const toast = $("toast");
    if (!toast) {
        alert(message);
        return;
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
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
   PERSISTÊNCIA (SALVAR PREFERÊNCIAS)
========================================= */

function saveCart() {
    try {
        localStorage.setItem(STORAGE_CART, JSON.stringify(cart));
    } catch (e) {
        console.warn("Não foi possível salvar o carrinho:", e);
    }
}

function loadCart() {
    try {
        const saved = localStorage.getItem(STORAGE_CART);
        if (saved) {
            cart = JSON.parse(saved);
        }
    } catch (e) {
        cart = [];
    }
}

function saveCustomer(data) {
    try {
        localStorage.setItem(STORAGE_CUSTOMER, JSON.stringify(data));
    } catch (e) {
        console.warn("Não foi possível salvar os dados do cliente:", e);
    }
}

function loadCustomer() {
    try {
        const saved = localStorage.getItem(STORAGE_CUSTOMER);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
}

/* =========================================
   PRODUTOS NA TELA
========================================= */

function createProductCard(product) {
    return `
        <article class="product-card">
            <div class="product-image-wrap">
                ${
                    product.image
                    ? `<img src="${product.image}" alt="${escapeHTML(product.name)}" class="product-image" loading="lazy" onerror="this.style.display='none'">`
                    : `<div class="product-image-placeholder">🌭</div>`
                }
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
    if (!mini || !regular) {
        console.error("Não encontrei miniProducts ou regularProducts no HTML.");
        return;
    }
    mini.innerHTML = PRODUCTS.filter(p => p.category === "mini").map(createProductCard).join("");
    regular.innerHTML = PRODUCTS.filter(p => p.category === "regular").map(createProductCard).join("");
}

/* =========================================
   ABRIR MODAL DO PRODUTO
========================================= */

function openProduct(productId) {
    currentProduct = PRODUCTS.find(p => p.id === productId);
    if (!currentProduct) {
        console.error("Produto não encontrado:", productId);
        return;
    }
    is750 = false;
    quantity = 1;
    selectedFlavors = [];
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
    $("addToCart").textContent = "Adicionar ao carrinho";
    updateProductPrice();
    openModal("productModal");
}

/* =========================================
   ABRIR MODAL DO POTE 750ML
========================================= */

function open750() {
    currentProduct = null;
    is750 = true;
    quantity = 1;
    selectedFlavors = [];
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
    $("addToCart").textContent = "Adicionar ao carrinho";
    updateProductPrice();
    openModal("productModal");
}

/* =========================================
   PREÇO DO MODAL
========================================= */

function getModalExtras() {
    return (
        ($("extraPotato").checked ? EXTRA_PRICE : 0) +
        ($("extraSauce").checked ? EXTRA_PRICE : 0)
    );
}

function updateProductPrice() {
    const basePrice = is750 ? PRICE_750 : currentProduct.price;
    const total = (basePrice + getModalExtras()) * quantity;
    $("modalPrice").textContent = money(total);
    $("modalQty").textContent = quantity;
}

/* =========================================
   QUANTIDADE DO MODAL
========================================= */

function changeQuantity(value) {
    quantity = Math.max(1, quantity + value);
    updateProductPrice();
}

/* =========================================
   ADICIONAR AO CARRINHO
========================================= */

function addCurrentProduct() {
    const flavors = is750
        ? Array.from(document.querySelectorAll(".flavor-input:checked")).map(input => input.value)
        : [];
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
        price,
        quantity,
        flavors,
        freePotato: $("freePotato").checked,
        freeSauce: $("freeSauce").checked,
        extraPotato: $("extraPotato").checked,
        extraSauce: $("extraSauce").checked,
        note: $("itemNote").value.trim()
    };
    const key = [
        item.id,
        item.flavors.join("+"),
        item.freePotato,
        item.freeSauce,
        item.extraPotato,
        item.extraSauce,
        item.note
    ].join("|");
    const existing = cart.find(product => product.key === key);
    if (existing) {
        existing.quantity += quantity;
    } else {
        item.key = key;
        cart.push(item);
    }
    saveCart();
    closeModal("productModal");
    renderCart();
    showToast("Produto adicionado ao carrinho!");
}

/* =========================================
   CARRINHO
========================================= */

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
    
    // Atualiza os valores no modal de pagamento
    $("pixProducts").textContent = money(cartTotal());
    $("pixDelivery").textContent = money(deliveryFee);
    $("pixAmount").textContent = money(cartTotal() + deliveryFee);

    const container = $("cartItems");
    if (!cart.length) {
        container.innerHTML = `
            <div class="empty-cart">
                <h3>Seu carrinho está vazio!</h3>
                <p>Escolha seu No Pote favorito.</p>
            </div>
        `;
        return;
    }
    container.innerHTML = cart.map(item => `
        <article class="cart-item">
            <div class="cart-item-info">
                <h3>${escapeHTML(item.name)}</h3>
                <small>${escapeHTML(item.size)}</small>
                ${item.flavors.length ? `<p>Sabores: ${item.flavors.map(escapeHTML).join(", ")}</p>` : ""}
                <p>
                    ${item.freePotato ? "Batata palha grátis" : "Sem batata palha"}
                    •
                    ${item.freeSauce ? "Molho grátis" : "Sem molho"}
                </p>
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
    if (item.quantity <= 0) {
        cart = cart.filter(p => p.key !== key);
    }
    saveCart();
    renderCart();
}

/* =========================================
   FINALIZAÇÃO DO PEDIDO
========================================= */

function openCheckout() {
    if (!cart.length) {
        showToast("Adicione algum produto primeiro!");
        return;
    }

    // Carrega dados salvos
    const saved = loadCustomer();
    if (saved) {
        $("customerName").value = saved.name || "";
        $("customerPhone").value = saved.phone || ""; // Carrega celular
        $("customerAddress").value = saved.address || "";
        $("deliveryType").value = saved.delivery || "Entrega";
        $("orderNote").value = saved.orderNote || "";
        $("customerNeighborhood").value = saved.neighborhood || "0";
    }

    // Calcula a taxa inicial
    deliveryFee = Number($("customerNeighborhood").value);
    $("pixProducts").textContent = money(cartTotal());
    $("pixDelivery").textContent = money(deliveryFee);
    $("pixAmount").textContent = money(cartTotal() + deliveryFee);

    closeModal("cartModal");
    openModal("checkoutModal");
}

function copyPix() {
    navigator.clipboard.writeText(PIX)
        .then(() => showToast("Chave Pix copiada!"))
        .catch(() => {
            prompt("Copie sua chave Pix:", PIX);
        });
}

function sendWhatsApp() {
    if (!cart.length) {
        showToast("Seu carrinho está vazio!");
        return;
    }
    
    const name = $("customerName").value.trim();
    const phone = $("customerPhone").value.trim(); // Pega o celular
    const address = $("customerAddress").value.trim();
    const delivery = $("deliveryType").value;
    const orderNote = $("orderNote").value.trim();
    const neighborhoodValue = $("customerNeighborhood").value;
    const neighborhoodText = $("customerNeighborhood").options[$("customerNeighborhood").selectedIndex].text;
    
    if (!name) {
        showToast("Informe seu nome!");
        $("customerName").focus();
        return;
    }

    // Valida o celular
    if (!phone) {
        showToast("Informe seu celular!");
        $("customerPhone").focus();
        return;
    }

    if (delivery === "Entrega" && !address) {
        showToast("Informe o endereço de entrega!");
        $("customerAddress").focus();
        return;
    }

    // Salva dados do cliente (incluindo o celular)
    saveCustomer({ name, phone, address, delivery, orderNote, neighborhood: neighborhoodValue });

    const totalComEntrega = cartTotal() + deliveryFee;

    let message = "*NOVO PEDIDO - NO POTE*\n\n";
    message += `Cliente: ${name}\n`;
    message += `Celular: ${phone}\n`; // Envia o celular na mensagem
    message += `Recebimento: ${delivery}\n`;
    if (delivery === "Entrega") {
        message += `Bairro: ${neighborhoodText}\n`;
        message += `Endereço: ${address}\n`;
    }
    message += "\n*ITENS DO PEDIDO*\n\n";
    cart.forEach((item, index) => {
        message += `${index + 1}. *${item.name}*\n`;
        message += `Tamanho: ${item.size}\n`;
        message += `Quantidade: ${item.quantity}\n`;
        if (item.flavors.length) {
            message += `Sabores: ${item.flavors.join(", ")}\n`;
        }
        message += item.freePotato ? "Batata palha grátis\n" : "Sem batata palha\n";
        message += item.freeSauce ? "Molho especial grátis\n" : "Sem molho especial\n";
        if (item.extraPotato) message += "Batata extra: R$ 2,00\n";
        if (item.extraSauce) message += "Molho extra: R$ 2,00\n";
        if (item.note) message += `Observação: ${item.note}\n`;
        message += `Subtotal: ${money(item.price * item.quantity)}\n\n`;
    });
    
    message += `Subtotal dos Produtos: ${money(cartTotal())}\n`;
    message += `Taxa de Entrega (${neighborhoodText}): ${money(deliveryFee)}\n`;
    message += `*TOTAL A PAGAR: ${money(totalComEntrega)}*\n`;
    message += `Pix: ${PIX}\n`;
    
    if (orderNote) {
        message += `\nObservação geral: ${orderNote}\n`;
    }

    message += "\n⚠️ *IMPORTANTE:* Após o pagamento via Pix, envie o *comprovante* nesta conversa para confirmarmos seu pedido. ❤️";

    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    // --- LÓGICA DA TELA DE SUCESSO ---
    closeModal("checkoutModal");
    $("successName").textContent = name;
    openModal("successModal");

    // Limpa o carrinho após o envio
    cart = [];
    saveCart();
    renderCart();
}

/* =========================================
   EVENTOS - TODOS OS BOTÕES
========================================= */

function setupEvents() {
    document.addEventListener("click", event => {
        const productButton = event.target.closest("[data-product]");
        if (productButton) {
            event.preventDefault();
            openProduct(productButton.dataset.product);
            return;
        }
        if (event.target.closest("#customButton")) {
            event.preventDefault();
            open750();
            return;
        }
        if (event.target.closest("#qtyMinus")) {
            changeQuantity(-1);
            return;
        }
        if (event.target.closest("#qtyPlus")) {
            changeQuantity(1);
            return;
        }
        if (event.target.closest("#addToCart")) {
            event.preventDefault();
            addCurrentProduct();
            return;
        }
        if (event.target.closest("#cartFab")) {
            renderCart();
            openModal("cartModal");
            return;
        }
        const plus = event.target.closest("[data-cart-plus]");
        if (plus) {
            changeCartItem(plus.dataset.cartPlus, 1);
            return;
        }
        const minus = event.target.closest("[data-cart-minus]");
        if (minus) {
            changeCartItem(minus.dataset.cartMinus, -1);
            return;
        }
        const remove = event.target.closest("[data-cart-remove]");
        if (remove) {
            cart = cart.filter(item => item.key !== remove.dataset.cartRemove);
            saveCart();
            renderCart();
            return;
        }
        if (event.target.closest("#goCheckout")) {
            openCheckout();
            return;
        }
        if (event.target.closest("#copyPix")) {
            copyPix();
            return;
        }
        if (event.target.closest("#sendWhatsApp")) {
            sendWhatsApp();
            return;
        }
        const closeButton = event.target.closest("[data-close]");
        if (closeButton) {
            closeModal(closeButton.dataset.close);
            return;
        }
        if (event.target.classList.contains("modal-backdrop")) {
            closeModal(event.target.id);
        }
    });

    ["extraPotato", "extraSauce"].forEach(id => {
        $(id).addEventListener("change", updateProductPrice);
    });

    $("flavorChoices").addEventListener("change", event => {
        if (!event.target.matches(".flavor-input")) return;
        const checked = document.querySelectorAll(".flavor-input:checked");
        if (checked.length > 3) {
            event.target.checked = false;
            showToast("Você pode escolher no máximo 3 sabores!");
        }
    });

    const menuToggle = $("menuToggle");
    const mainNav = $("mainNav");
    if (menuToggle && mainNav) {
        menuToggle.addEventListener("click", () => {
            mainNav.classList.toggle("active");
        });
        mainNav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                mainNav.classList.remove("active");
            });
        });
    }
    
    // Evento para recalcular quando mudar o bairro
    const neighborhoodSelect = $("customerNeighborhood");
    if (neighborhoodSelect) {
        neighborhoodSelect.addEventListener("change", (e) => {
            deliveryFee = Number(e.target.value);
            $("pixProducts").textContent = money(cartTotal());
            $("pixDelivery").textContent = money(deliveryFee);
            $("pixAmount").textContent = money(cartTotal() + deliveryFee);
        });
    }

    // Máscara para o campo de celular
    const phoneInput = $("customerPhone");
    if (phoneInput) {
        phoneInput.addEventListener("input", (e) => {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        });
    }
}

/* =========================================
   INICIALIZAÇÃO
========================================= */

function init() {
    loadCart();
    renderProducts();
    renderCart();
    setupEvents();
    const year = $("year");
    if (year) {
        year.textContent = new Date().getFullYear();
    }
    console.log("No Pote carregado corretamente!");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
