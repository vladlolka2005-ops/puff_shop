// ================= INIT =================

const S_URL = 'https://bsiavngtycpetiiikmxd.supabase.co';
const S_KEY = 'sb_publishable_5WlTFr_cduyplbY4BS2w2w_cevKpWmW';

const supabaseClient = supabase.createClient(S_URL, S_KEY);

let productsData = [];
let currentSort = 'promo';
let selectedFlavorByGroup = {};
let currentCategory = 'liquid';

const CATEGORY_VALUES = {
    liquid: ['Рідина'],
    pods: ['POD-Системи'],
    cartridges: ['Картриджі'],
};

let cart = {};
let favorites = JSON.parse(localStorage.getItem('puff_favs')) || [];
let isSubmittingOrder = false;


// ================= CART STORAGE =================

function closeImageModal() {
    document.getElementById('image-modal').style.display = 'none';
}

function saveCart() {
    localStorage.setItem('puff_cart', JSON.stringify(cart));
}

function loadCart() {
    const saved = localStorage.getItem('puff_cart');
    if (saved) {
        cart = JSON.parse(saved);
    }
}

function removeFromCart(id) {
    const numericId = Number(id);
    delete cart[numericId];
    saveCart();
    updateFooter();
    renderCart();
}


// ================= LOAD =================

async function load() {
    const { data, error } = await supabaseClient.from('Products').select('*');

    if (error) {
        console.error('Ошибка загрузки:', error);
        return;
    }

    productsData = data;
    validateCart();
    render();
}


// ================= PRODUCT GROUPS / FLAVORS =================

function normalizeText(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeCategory(value) {
    return normalizeText(value).toLowerCase();
}

function productMatchesCategory(product) {
    const allowedValues = CATEGORY_VALUES[currentCategory] || [];
    const productCategory = normalizeCategory(product.category);

    return allowedValues.some(category =>
        normalizeCategory(category) === productCategory
    );
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
    return escapeHtml(value).replaceAll('\n', ' ');
}

function encodeClickValue(value) {
    return encodeURIComponent(String(value ?? ''));
}

function decodeClickValue(value) {
    return decodeURIComponent(String(value ?? ''));
}

function getProductGroupName(product) {
    const explicitGroup = normalizeText(
        product.group_name ||
        product.group ||
        product.base_name ||
        product.product_name ||
        product.line ||
        product.series ||
        product.model
    );

    if (explicitGroup) return explicitGroup;

    const name = normalizeText(product.name);
    const separators = [' - ', ' — ', ' – ', ' | '];
    const separator = separators.find(item => name.includes(item));

    if (separator) {
        return normalizeText(name.split(separator)[0]);
    }

    return name;
}

function getProductFlavor(product, groupName = '') {
    const explicitFlavor = normalizeText(
        product.flavor ||
        product.Flavor ||
        product.taste ||
        product.Taste ||
        product.smak ||
        product.aroma
    );

    if (explicitFlavor) return explicitFlavor;

    const name = normalizeText(product.name);
    const group = normalizeText(groupName);

    if (group && name.toLowerCase().startsWith(group.toLowerCase())) {
        const flavor = normalizeText(name.slice(group.length));
        if (flavor) return flavor.replace(/^[-—–|:]+/, '').trim();
    }

    return name;
}

function getProductGroupKey(product) {
    const explicitKey = normalizeText(
        product.group_id ||
        product.group_key ||
        product.parent_id ||
        product.slug
    );

    if (explicitKey) {
        return `${normalizeText(product.category)}::${explicitKey}`;
    }

    return `${normalizeText(product.category)}::${getProductGroupName(product).toLowerCase()}`;
}

function sortProductsList(items) {
    return [...items].sort((a, b) => {
        if (b.stock !== a.stock) {
            return b.stock - a.stock;
        }

        if (currentSort === 'promo') {
            return (b.old_price ? 1 : 0) - (a.old_price ? 1 : 0);
        }
        if (currentSort === 'price-asc') return a.price - b.price;
        if (currentSort === 'price-desc') return b.price - a.price;

        return 0;
    });
}

function getProductGroups(products) {
    const groups = {};

    products.forEach(product => {
        const key = getProductGroupKey(product);
        if (!groups[key]) {
            groups[key] = {
                key,
                name: getProductGroupName(product),
                items: [],
            };
        }

        groups[key].items.push(product);
    });

    return Object.values(groups).map(group => ({
        ...group,
        items: sortProductsList(group.items),
    }));
}

function getSelectedVariant(group) {
    const selectedId = selectedFlavorByGroup[group.key];
    const selected = group.items.find(item => Number(item.id) === Number(selectedId));
    return selected || group.items.find(item => Number(item.stock) > 0) || group.items[0];
}

function openProductGroup(groupKey) {
    const group = getProductGroups(productsData).find(item => item.key === groupKey);
    if (!group) return;

    if (!selectedFlavorByGroup[group.key]) {
        selectedFlavorByGroup[group.key] = getSelectedVariant(group).id;
    }

    renderProductGroupModal(group);
}

function openProductGroupEncoded(encodedGroupKey) {
    openProductGroup(decodeClickValue(encodedGroupKey));
}

function selectProductFlavor(groupKey, productId) {
    const group = getProductGroups(productsData).find(item => item.key === groupKey);
    if (!group) return;

    selectedFlavorByGroup[groupKey] = Number(productId);
    renderProductGroupModal(group);

    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
}

function selectProductFlavorEncoded(encodedGroupKey, productId) {
    selectProductFlavor(decodeClickValue(encodedGroupKey), productId);
}

function closeProductGroup() {
    const modal = document.getElementById('product-group-screen');
    if (modal) modal.style.display = 'none';
}

function renderProductGroupModal(group) {
    let modal = document.getElementById('product-group-screen');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'product-group-screen';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    const selected = getSelectedVariant(group);
    const isFav = favorites.includes(Number(selected.id));
    const flavorButtons = group.items.map(item => {
        const flavor = getProductFlavor(item, group.name);
        const isActive = Number(item.id) === Number(selected.id);

        return `
            <button class="flavor-btn ${isActive ? 'active' : ''}"
                onclick="selectProductFlavorEncoded('${encodeClickValue(group.key)}', ${item.id})"
                ${item.stock <= 0 ? 'data-empty="true"' : ''}>
                ${escapeHtml(flavor)}
            </button>
        `;
    }).join('');

    modal.innerHTML = `
        <div class="modal-content product-detail">
            <div class="modal-header">
                <button class="back-btn" onclick="closeProductGroup()">‹</button>
                ${escapeHtml(group.name)}
            </div>

            <button class="fav-btn detail-fav ${isFav ? 'active' : ''}"
                onclick="toggleFav(${selected.id})">
                ${isFav ? '❤' : '♡'}
            </button>

            <div class="detail-image-wrap">
                <img src="${escapeAttr(selected.image_url || '')}"
                     onclick="openImageModal('${escapeAttr(selected.image_url || '')}')"
                     style="cursor:pointer;">
            </div>

            <div class="detail-info">
                ${renderStock(selected.stock)}
                <div class="price">${selected.price} ₴</div>
                <div class="name">${escapeHtml(selected.name)}</div>
            </div>

            <div class="flavor-section">
                <div class="label">Смаки</div>
                <div class="flavor-grid">
                    ${flavorButtons}
                </div>
            </div>

            <button class="buy-btn detail-buy"
                onclick="handleBuy(this, ${selected.id})"
                ${selected.stock <= 0 ? 'disabled style="opacity:0.5"' : ''}>
                ${selected.stock > 0 ? 'Купити' : 'Немає'}
            </button>
        </div>
    `;

    modal.style.display = 'block';
}


// ================= RENDER PRODUCTS =================

function render() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    let filtered = productsData.filter(productMatchesCategory);
    const groups = getProductGroups(sortProductsList(filtered));

    grid.innerHTML = groups.map(group => renderProductGroupCard(group)).join('');

    updateFooter();
}


// ================= CART =================

function addToCart(id) {
    const numericId = Number(id);
    const product = productsData.find(p => Number(p.id) === numericId);
    if (!product) return;

    const currentQty = cart[numericId]?.qty || 0;

    if (Number(currentQty) >= Number(product.stock)) {
        alert('Більше немає в наявності');
        return;
    }

    if (cart[numericId]) {
        cart[numericId].qty++;
    } else {
        cart[numericId] = { ...product, qty: 1 };
    }

    saveCart();
    updateFooter();

    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
}

function changeQty(id, delta) {
    const numericId = Number(id);
    if (!cart[numericId]) return;

    const product = productsData.find(p => Number(p.id) === numericId);
    if (!product) return;

    const newQty = cart[numericId].qty + delta;

    if (newQty < 1) return;

    if (newQty > product.stock) {
        alert('Досягнуто максимальну кількість товару на складі');
        return;
    }

    cart[numericId].qty = newQty;

    saveCart();
    updateFooter();
    renderCart();
}

function updateFooter() {
    let totalItems = 0;
    let totalPrice = 0;

    for (let id in cart) {
        totalItems += cart[id].qty;
        totalPrice += cart[id].price * cart[id].qty;
    }

    const text = totalItems > 0
        ? `Кошик (${totalItems}) — ${totalPrice} ₴`
        : 'Кошик порожній';

    const mainBtn = document.getElementById('cart-footer');
    if (mainBtn) mainBtn.innerText = text;

    const favBtn = document.getElementById('fav-cart-footer');
    if (favBtn) favBtn.innerText = text;
}

function validateCart() {
    for (let id in cart) {
        const product = productsData.find(p => Number(p.id) === Number(id));
        if (!product) continue;

        if (cart[id].qty > product.stock) {
            cart[id].qty = product.stock;
        }

        if (product.stock <= 0) {
            delete cart[id];
        }
    }

    saveCart();
}

function renderCart() {
    const list = document.getElementById('cart-list');

    let html = '';
    let total = 0;

    for (let id in cart) {
        const item = cart[id];
        total += item.price * item.qty;

        html += `
            <div class="cart-item" style="justify-content: space-between;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <img src="${item.image_url}">
                    <div>
                        <div>${item.name}</div>
                        <div style="font-weight:bold;">${item.price * item.qty} ₴</div>
                    </div>
                </div>

                <div style="display:flex; gap:10px; align-items:center;">
                    <div class="qty-ctrl">
                        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
                    </div>

                    <span onclick="removeFromCart(${item.id})" style="cursor:pointer;">🗑️</span>
                </div>
            </div>
        `;
    }

    list.innerHTML = html || '<p style="text-align:center; color:#888;">Кошик порожній</p>';
    document.getElementById('cart-total').innerText = `Разом: ${total} ₴`;
}


// ================= FAVORITES =================

function toggleFav(id) {
    const numericId = Number(id);

    const index = favorites.indexOf(numericId);

    if (index === -1) {
        favorites.push(numericId);
    } else {
        favorites.splice(index, 1);
    }

    localStorage.setItem('puff_favs', JSON.stringify(favorites));

    render();

    const detailModal = document.getElementById('product-group-screen');
    if (detailModal?.style.display === 'block') {
        const group = getProductGroups(productsData)
            .find(item => item.items.some(product => Number(product.id) === numericId));
        if (group) renderProductGroupModal(group);
    }

    if (document.getElementById('favorites-screen')?.style.display === 'block') {
        openFavorites();
    }
}

function openFavorites() {
    document.getElementById('favorites-screen').style.display = 'block';

    const favProducts = productsData
        .filter(p => favorites.includes(Number(p.id)))
        .map(p => productsData.find(x => Number(x.id) === Number(p.id)) || p);

    const grid = document.getElementById('favorites-grid');
    const cartContainer = document.getElementById('fav-cart-container');

    if (!favProducts.length) {
        grid.innerHTML = '<p style="grid-column:1/3; text-align:center; color:#888;">Тут поки порожньо</p>';
        if (cartContainer) cartContainer.style.display = 'none';
        return;
    }

    if (cartContainer) cartContainer.style.display = 'block';

    grid.innerHTML = favProducts.map(p =>
        renderProductCard(p, { isFavorite: true })
    ).join('');
}


// ================= UI =================

function filterCat(cat, el) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');

    currentCategory = cat;
    render();
}

function sortProducts() {
    const select = document.getElementById('sort-select');
    if (!select) return;

    currentSort = select.value;
    render();
}

function toggleDeliveryFields() {
    const method = document.getElementById('order-delivery').value;

    document.getElementById('np-fields').style.display =
        method === 'nova_poshta' ? 'block' : 'none';

    document.getElementById('pickup-info').style.display =
        method === 'self_pickup' ? 'block' : 'none';
}


// ================= MODALS =================

function openCart() {
    if (Object.keys(cart).length === 0) return;

    document.getElementById('cart-screen').style.display = 'block';
    renderCart();
}

function openProfile() {
    document.getElementById('profile-screen').style.display = 'block';
}

function openHistory() {
    document.getElementById('history-screen').style.display = 'block';
    loadHistory();
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}


// ================= CHECKOUT & ORDER SUBMISSION =================

function openCheckout() {
    if (!Object.keys(cart).length) return alert('Кошик порожній!');
    document.getElementById('checkout-screen').style.display = 'block';
    toggleDeliveryFields();

    if (window.Telegram?.WebApp?.MainButton) {
        const mainBtn = window.Telegram.WebApp.MainButton;
        mainBtn.setText("ПІДТВЕРДИТИ ЗАМОВЛЕННЯ");
        mainBtn.offClick(openCheckout);
        mainBtn.onClick(submitOrder);
    }

    setTimeout(() => {
        const nameInput = document.getElementById('order-name');
        if (nameInput) {
            nameInput.focus();
        }
    }, 150);
}

async function submitOrder() {
    if (isSubmittingOrder) return;

    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const delivery = document.getElementById('order-delivery').value;
    const payment = document.getElementById('order-payment').value;
    const city = document.getElementById('order-city').value.trim();
    const warehouse = document.getElementById('order-warehouse').value.trim();
    const comment = document.getElementById('order-comment').value.trim();

    let cleanPhone = phone.replace(/\D/g, ''); 
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
        cleanPhone = cleanPhone.substring(1);
    }

    if (!name || !/^\d{9}$/.test(cleanPhone)) {
        return alert('Перевірте контактні дані! Номер повинен містити 9 цифр (наприклад: 931234567)');
    }

    if (delivery === 'nova_poshta' && (!city || !warehouse)) {
        return alert('Вкажіть місто та відділення Нової Пошти!');
    }

    const items = Object.values(cart);
    if (!items.length) return alert('Кошик порожній!');

    const total = items.reduce((s, i) => s + i.price * i.qty, 0);

    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || null;
    const telegramId = tgUser?.id || null;
    const telegramUsername = tgUser?.username ? '@' + tgUser.username : null;

    const orderItems = items.map(i => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
    }));

    // Инсертим заказ напрямую в английские названия полей
    isSubmittingOrder = true;

    const { error: orderError } = await supabaseClient
        .from('orders')
        .insert([{
            items: orderItems,
            total: total,
            status: 'pending',
            customer_name: name,
            telegram: telegramUsername,
            telegram_id: telegramId,
            phone: cleanPhone,
            delivery: delivery,
            payment: payment,
            city: delivery === 'nova_poshta' ? city : null,
            warehouse: delivery === 'nova_poshta' ? warehouse : null,
            comment: comment || null,
        }]);

    if (orderError) {
        isSubmittingOrder = false;
        console.error('Ошибка сохранения заказа:', orderError);

        const errorText = [
            orderError.message,
            orderError.details,
            orderError.hint,
            orderError.code ? `Код: ${orderError.code}` : '',
        ].filter(Boolean).join('\n');

        alert(`Помилка збереження замовлення!\n${errorText}`);
        return;
    }

    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        window.Telegram.WebApp.MainButton.hide(); 
    }

    document.getElementById('checkout-screen').style.display = 'none';
    document.getElementById('cart-screen').style.display = 'none';
    document.getElementById('success-screen').style.display = 'block';

    cart = {};
    saveCart();
    updateFooter();
    render();
    isSubmittingOrder = false;
}


// ================= START =================

loadCart();
load();

if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}


// ================= IMAGE MODAL =================

function openImageModal(src) {
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('modal-image');

    img.src = src;
    modal.style.display = 'block';
}


// ================= FLY TO CART =================

function flyToCart(imgElement, targetBtnId = 'cart-footer') {
    const cartBtn = document.getElementById(targetBtnId);

    const imgRect = imgElement.getBoundingClientRect();
    const cartRect = cartBtn.getBoundingClientRect();

    const flyingImg = imgElement.cloneNode(true);

    flyingImg.classList.add('fly-image');
    document.body.appendChild(flyingImg);

    flyingImg.style.left = imgRect.left + 'px';
    flyingImg.style.top = imgRect.top + 'px';
    flyingImg.style.width = imgRect.width + 'px';
    flyingImg.style.height = imgRect.height + 'px';

    setTimeout(() => {
        flyingImg.style.left = cartRect.left + cartRect.width / 2 + 'px';
        flyingImg.style.top = cartRect.top + cartRect.height / 2 + 'px';
        flyingImg.style.transform = 'scale(0.2)';
        flyingImg.style.opacity = '0.5';
    }, 10);

    setTimeout(() => {
        flyingImg.remove();
    }, 800);
}

function handleBuy(btn, id) {
    const card = btn.closest('.card') || btn.closest('.product-detail');
    const img = card?.querySelector('img');

    const isFavorites = document.getElementById('favorites-screen')?.style.display === 'block';

    if (img) {
        if (isFavorites) {
            flyToCart(img, 'fav-cart-footer');
        } else {
            flyToCart(img, 'cart-footer');
        }
    }

    addToCart(Number(id));
}


// ================= RENDER HELPERS =================

function renderProductGroupCard(group) {
    const selected = getSelectedVariant(group);
    const inStock = group.items.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const prices = group.items.map(item => Number(item.price || 0)).filter(price => price > 0);
    const minPrice = prices.length ? Math.min(...prices) : Number(selected.price || 0);
    const isFav = group.items.some(item => favorites.includes(Number(item.id)));
    const flavorText = group.items.length > 1
        ? `${group.items.length} смаків`
        : getProductFlavor(selected, group.name);

    return `
        <div class="card product-group-card" onclick="openProductGroupEncoded('${encodeClickValue(group.key)}')">
            <button class="fav-btn ${isFav ? 'active' : ''}"
                onclick="event.stopPropagation(); toggleFav(${selected.id})">
                ${isFav ? '❤' : '♡'}
            </button>

            <div class="img-wrap">
                <img src="${escapeAttr(selected.image_url || '')}"
                     style="cursor:pointer;">
            </div>

            <div class="info">
                ${renderStock(inStock)}
                <div class="price">від ${minPrice} ₴</div>
                <div class="name">${escapeHtml(group.name)}</div>
                <div class="flavor-count">${escapeHtml(flavorText)}</div>
                <button class="buy-btn" onclick="event.stopPropagation(); openProductGroupEncoded('${encodeClickValue(group.key)}')">
                    Вибрати смак
                </button>
            </div>
        </div>
    `;
}

function renderProductCard(p, { isFavorite = false } = {}) {
    return `
        <div class="card">
            <button class="fav-btn ${isFavorite ? 'active' : ''}"
                onclick="toggleFav(${p.id})">
                ${isFavorite ? '❤️' : '🤍'}
            </button>

            <div class="img-wrap">
                <img src="${p.image_url}"
                     onclick="openImageModal('${p.image_url}')"
                     style="cursor:pointer;">
            </div>

            <div class="info">
                ${renderStock(p.stock)}

                <div class="price">${p.price} ₴</div>
                <div class="name">${p.name}</div>

                <button class="buy-btn"
                    onclick="handleBuy(this, ${p.id})"
                    ${p.stock <= 0 ? 'disabled style="opacity:0.5"' : ''}>
                    ${p.stock > 0 ? 'Купити' : 'Немає'}
                </button>
            </div>
        </div>
    `;
}

/* function renderStock(stock) {
    return `
        <div class="stock ${stock > 0 ? 'in' : 'out'}">
            ${stock > 0
                ? `В наявності: ${stock} шт.`
                : 'Немає в наявності'}
        </div>
    `;
} */


// ================= HISTORY =================

async function loadHistory() {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const telegramId = tgUser?.id;

    if (!telegramId) {
        document.getElementById('history-screen').innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <button class="back-btn" onclick="closeModal('history-screen')">‹</button>
                    Історія
                </div>
                <p style="text-align:center; color:#888;">Не вдалося отримати користувача Telegram</p>
            </div>
        `;
        return;
    }

    const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('telegram_id', telegramId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    renderHistory(data || []);
}

function renderHistory(orders) {
    const container = document.getElementById('history-screen');

    const statusLabelMap = {
        pending: 'В процесi',
        confirmed: 'Підтверджено',
        completed: 'Виконано',
        rejected: 'Вiдхилено',
    };

    const statusClassMap = {
        pending: 'status-pending',
        confirmed: 'status-confirmed',
        completed: 'status-completed',
        rejected: 'status-rejected',
    };

    if (!orders.length) {
        container.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <button class="back-btn" onclick="closeModal('history-screen')">‹</button>
                    Історія
                </div>
                <p style="text-align:center; color:#888;">Замовлень ще немає</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="modal-content">
            <div class="modal-header">
                <button class="back-btn" onclick="closeModal('history-screen')">‹</button>
                Історія
            </div>
    `;

    orders.forEach(order => {
        const itemsHtml = order.items.map(i => `
            <div style="font-size:13px; color:#b2bcc4;">
                • ${i.name} x${i.qty}
            </div>
        `).join('');

        const prettyId = String(order.order_number).padStart(6, '0');

        const statusKey = order.status;
        const statusLabel = statusLabelMap[statusKey] || statusKey;
        const statusClass = statusClassMap[statusKey] || '';

        html += `
            <div style="background: var(--tg-card); padding: 12px; border-radius: 12px; margin-bottom: 10px;">

                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <b>№${prettyId}</b>
                    <span style="color:#31b545;">${order.total} ₴</span>
                </div>

                <div style="font-size:12px; color:#888; margin-bottom:5px;">
                    ${new Date(order.created_at).toLocaleString()}
                </div>

                <div style="margin-bottom:6px; font-size:13px;">
                    Статус:
                    <span class="status-badge ${statusClass}">
                        ${statusLabel}
                    </span>
                </div>

                <div>
                    ${itemsHtml}
                </div>

                ${order.status === 'pending' ? `
                    <div style="margin-top:10px; text-align:right;">
                        <button class="cancel-btn" onclick="confirmCancelOrder('${order.id}')">
                            Скасувати замовлення
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    });

    html += `</div>`;

    container.innerHTML = html;
}

function getStatusLabel(status) {
    switch (status) {
        case 'pending':   return 'В процесi';
        case 'confirmed': return 'Підтверджено';
        case 'completed': return 'Виконано';
        case 'rejected':  return 'Вiдхилено';
        default:          return status;
    }
}


// ================= CANCEL ORDER =================

async function cancelOrder(orderId) {
    try {
        const { data: order, error } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (error) throw error;

        if (order.status !== 'pending') {
            alert('Замовлення вже не можна скасувати');
            return;
        }

        const { error: updateOrderError } = await supabaseClient
            .from('orders')
            .update({ status: 'rejected' })
            .eq('id', orderId);

        if (updateOrderError) throw updateOrderError;

        await load();
        updateFooter();
        loadHistory();

    } catch (err) {
        console.error(err);
        alert('Помилка при скасуванні');
    }
}

function confirmCancelOrder(orderId) {
    const confirmed = confirm('Ви дійсно хочете скасувати це замовлення?');
    if (!confirmed) return;
    cancelOrder(orderId);
}
