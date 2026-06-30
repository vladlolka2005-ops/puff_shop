// ================= INIT =================

const S_URL = 'https://bsiavngtycpetiiikmxd.supabase.co';
const S_KEY = 'sb_publishable_5WlTFr_cduyplbY4BS2w2w_cevKpWmW';

const supabaseClient = supabase.createClient(S_URL, S_KEY);

let productsData = [];
let currentSort = 'promo';
let selectedFlavorByGroup = {};
let currentCategory = 'liquid';
let currentLang = localStorage.getItem('puff_lang') || 'uk';

const I18N = {
    uk: {
        profile: 'Профіль',
        myProfile: 'Мій профіль',
        favorites: 'Обране',
        orderHistory: 'Історія замовлень',
        history: 'Історія',
        language: 'Мова',
        privacy: 'Політика конфіденційності',
        faq: 'FAQ',
        manager: 'Написати менеджеру',
        appVersion: 'Версія додатку',
        liquid: 'Рідина',
        pods: 'POD-Системи',
        cartridges: 'Картриджі',
        promo: '🔥 Акція',
        priceAsc: '📈 Дешевші спочатку',
        priceDesc: '📉 Дорожчі спочатку',
        cartEmpty: 'Кошик порожній',
        cart: 'Кошик',
        total: 'Разом',
        checkoutOpen: 'ОФОРМИТИ ЗАМОВЛЕННЯ',
        checkout: 'Оформлення',
        contactData: '👤 КОНТАКТНІ ДАНІ:',
        namePlaceholder: "Прізвище Ім'я по батькові",
        phone: 'Ваш номер телефону:',
        payment: '💳 СПОСІБ ОПЛАТИ:',
        card: 'Карта',
        cash: 'Готівка',
        delivery: '🚚 СПОСІБ ДОСТАВКИ:',
        novaPoshta: 'Нова Пошта',
        city: 'Місто',
        warehouse: '№ Відділення',
        comment: '📝 Коментар до замовлення:',
        commentPlaceholder: "Ваші побажання (необов'язково)",
        confirm: 'ПІДТВЕРДИТИ',
        sending: 'ВІДПРАВЛЯЄМО...',
        confirmOrder: 'ПІДТВЕРДИТИ ЗАМОВЛЕННЯ',
        successTitle: 'Дякуємо!',
        successText: "Ваше замовлення прийнято.<br>Наш менеджер зв'яжеться з вами.",
        returnBack: 'Повернутися',
        inStock: 'В наявності',
        outOfStock: 'Немає в наявності',
        buy: 'Купити',
        unavailable: 'Немає',
        flavors: 'Смаки',
        ohms: 'Оми',
        colors: 'Кольори',
        emptyFavorites: 'Тут поки порожньо',
        emptyCatalog: 'Тут поки немає товарів',
        noOrders: 'Замовлень ще немає',
        maxStock: 'Досягнуто максимальну кількість товару на складі',
        checkContacts: 'Перевірте контактні дані! Номер повинен містити 9 цифр (наприклад: 931234567)',
        fillDelivery: 'Вкажіть місто та відділення Нової Пошти!',
        saveOrderError: 'Помилка збереження замовлення!',
        privacyConsent: 'Оформлюючи замовлення, ви погоджуєтесь з <a href="privacy.html">Політикою конфіденційності</a>.',
        ageTitle: 'Підтвердження віку',
        ageText: 'Цей магазин призначений лише для користувачів, яким виповнилося 18 років.',
        ageConfirm: 'Мені є 18 років',
        ageExit: 'Вийти',
        repeatOrder: 'Повторити замовлення',
        addedToCart: 'Товари додано в кошик',
        faqQ1: 'Як оформити замовлення?',
        faqA1: 'Додайте товар у кошик, заповніть контакти та підтвердіть замовлення.',
        faqQ2: 'Як відбувається доставка?',
        faqA2: 'Ми відправляємо замовлення Новою Поштою після підтвердження менеджером.',
        faqQ3: 'Як оплатити?',
        faqA3: 'Доступна оплата карткою або готівкою згідно з умовами замовлення.',
        faqQ4: "Як зв'язатися з магазином?",
        faqA4: 'Напишіть боту або менеджеру в Telegram: @nnpuff.',
        statusPending: 'В процесi',
        statusConfirmed: 'Підтверджено',
        statusShipped: 'Відправлено',
        statusCompleted: 'Виконано',
        statusRejected: 'Відхилено',
    },
    en: {
        profile: 'Profile',
        myProfile: 'My profile',
        favorites: 'Favorites',
        orderHistory: 'Order history',
        history: 'History',
        language: 'Language',
        privacy: 'Privacy Policy',
        faq: 'FAQ',
        manager: 'Message manager',
        appVersion: 'App version',
        liquid: 'Liquids',
        pods: 'POD Systems',
        cartridges: 'Cartridges',
        promo: '🔥 Sale',
        priceAsc: '📈 Cheapest first',
        priceDesc: '📉 Most expensive first',
        cartEmpty: 'Cart is empty',
        cart: 'Cart',
        total: 'Total',
        checkoutOpen: 'CHECKOUT',
        checkout: 'Checkout',
        contactData: '👤 CONTACT DETAILS:',
        namePlaceholder: 'Full name',
        phone: 'Your phone number:',
        payment: '💳 PAYMENT METHOD:',
        card: 'Card',
        cash: 'Cash',
        delivery: '🚚 DELIVERY METHOD:',
        novaPoshta: 'Nova Poshta',
        city: 'City',
        warehouse: 'Branch number',
        comment: '📝 Order comment:',
        commentPlaceholder: 'Your notes (optional)',
        confirm: 'CONFIRM',
        sending: 'SENDING...',
        confirmOrder: 'CONFIRM ORDER',
        successTitle: 'Thank you!',
        successText: 'Your order has been received.<br>Our manager will contact you.',
        returnBack: 'Return',
        inStock: 'In stock',
        outOfStock: 'Out of stock',
        buy: 'Buy',
        unavailable: 'Unavailable',
        flavors: 'Flavors',
        ohms: 'Ohms',
        colors: 'Colors',
        emptyFavorites: 'Nothing here yet',
        emptyCatalog: 'No products here yet',
        noOrders: 'No orders yet',
        maxStock: 'Maximum stock quantity reached',
        checkContacts: 'Check contact details! The number must contain 9 digits, for example: 931234567',
        fillDelivery: 'Enter city and Nova Poshta branch!',
        saveOrderError: 'Order saving error!',
        privacyConsent: 'By placing an order, you agree to the <a href="privacy.html">Privacy Policy</a>.',
        ageTitle: 'Age confirmation',
        ageText: 'This shop is intended only for users who are at least 18 years old.',
        ageConfirm: 'I am 18 or older',
        ageExit: 'Exit',
        repeatOrder: 'Repeat order',
        addedToCart: 'Items added to cart',
        faqQ1: 'How do I place an order?',
        faqA1: 'Add products to the cart, fill in your contact details, and confirm the order.',
        faqQ2: 'How does delivery work?',
        faqA2: 'We ship orders via Nova Poshta after manager confirmation.',
        faqQ3: 'How can I pay?',
        faqA3: 'Payment by card or cash is available according to the order terms.',
        faqQ4: 'How do I contact the shop?',
        faqA4: 'Message the bot or the manager on Telegram: @nnpuff.',
        statusPending: 'Processing',
        statusConfirmed: 'Confirmed',
        statusShipped: 'Shipped',
        statusCompleted: 'Completed',
        statusRejected: 'Rejected',
    },
};

const CATEGORY_VALUES = {
    liquid: ['Рідина'],
    pods: ['POD-Системи'],
    cartridges: ['Картриджі'],
};

let cart = {};
let favorites = JSON.parse(localStorage.getItem('puff_favs')) || [];
let isSubmittingOrder = false;

function t(key) {
    return I18N[currentLang]?.[key] || I18N.uk[key] || key;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}

function setPlaceholder(id, value) {
    const el = document.getElementById(id);
    if (el) el.placeholder = value;
}

function applyTranslations() {
    document.documentElement.lang = currentLang;

    setText('profile-open-btn', `👤 ${t('profile')}`);
    setText('profile-title', t('myProfile'));
    setText('profile-favorites-label', t('favorites'));
    setText('profile-history-label', t('orderHistory'));
    setText('profile-language-label', t('language'));
    setText('profile-privacy-label', t('privacy'));
    setText('profile-faq-label', t('faq'));
    setText('manager-link-label', t('manager'));
    setText('app-version-label', t('appVersion'));
    setText('favorites-title', t('favorites'));
    setText('history-title', t('history'));
    setText('cart-title', t('cart'));
    setText('checkout-open-btn', t('checkoutOpen'));
    setText('checkout-title', t('checkout'));
    setText('contact-label', t('contactData'));
    setText('phone-label', t('phone'));
    setText('payment-label', t('payment'));
    setText('payment-card-option', t('card'));
    setText('payment-cash-option', t('cash'));
    setText('delivery-label', t('delivery'));
    setText('delivery-np-option', t('novaPoshta'));
    setText('comment-label', t('comment'));
    setText('checkout-submit-btn', t('confirm'));
    setText('privacy-consent', t('privacyConsent'));
    setText('age-title', t('ageTitle'));
    setText('age-text', t('ageText'));
    setText('age-confirm-btn', t('ageConfirm'));
    setText('age-exit-btn', t('ageExit'));
    setText('faq-title', t('faq'));
    setText('faq-q1', t('faqQ1'));
    setText('faq-a1', t('faqA1'));
    setText('faq-q2', t('faqQ2'));
    setText('faq-a2', t('faqA2'));
    setText('faq-q3', t('faqQ3'));
    setText('faq-a3', t('faqA3'));
    setText('faq-q4', t('faqQ4'));
    setText('faq-a4', t('faqA4'));
    setText('success-title', t('successTitle'));
    setText('success-text', t('successText'));
    setText('success-return-btn', t('returnBack'));

    setPlaceholder('order-name', t('namePlaceholder'));
    setPlaceholder('order-city', t('city'));
    setPlaceholder('order-warehouse', t('warehouse'));
    setPlaceholder('order-comment', t('commentPlaceholder'));

    const categories = document.querySelectorAll('.categories .cat-btn');
    if (categories[0]) categories[0].textContent = t('liquid');
    if (categories[1]) categories[1].textContent = t('pods');
    if (categories[2]) categories[2].textContent = t('cartridges');

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        const selected = sortSelect.value;
        sortSelect.innerHTML = `
            <option value="promo">${t('promo')}</option>
            <option value="price-asc">${t('priceAsc')}</option>
            <option value="price-desc">${t('priceDesc')}</option>
        `;
        sortSelect.value = selected;
    }

    document.getElementById('lang-uk-btn')?.classList.toggle('active', currentLang === 'uk');
    document.getElementById('lang-en-btn')?.classList.toggle('active', currentLang === 'en');

    updateFooter();
    renderCart();
    render();
}

function setLanguage(lang) {
    currentLang = lang === 'en' ? 'en' : 'uk';
    localStorage.setItem('puff_lang', currentLang);
    applyTranslations();
}

function renderEmptyState(icon, text) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">${icon}</div>
            <div>${escapeHtml(text)}</div>
        </div>
    `;
}

function renderSkeletons(count = 6) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: count }, () => '<div class="skeleton-card"></div>').join('');
}


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
    const itemId = decodeClickValue(id);
    delete cart[itemId];
    delete cart[`product-${itemId}`];
    delete cart[`liquid-${itemId}`];
    delete cart[`cartridge-${itemId}`];
    delete cart[`pod-${itemId}`];
    saveCart();
    updateFooter();
    renderCart();
}


// ================= LOAD =================

async function load() {
    renderSkeletons();

    const [
        { data: products, error: productsError },
        { data: liquids, error: liquidsError },
        { data: cartridges, error: cartridgesError },
        { data: pods, error: podsError },
    ] = await Promise.all([
        supabaseClient.from('Products').select('*'),
        supabaseClient.from('liquids').select('*'),
        supabaseClient.from('cartridges').select('*'),
        supabaseClient.from('pods').select('*'),
    ]);

    const error = productsError;
    if (productsError) {
        console.error('Ошибка загрузки:', error);
        console.error('Products loading error:', productsError);
        return;
    }

    if (liquidsError) {
        console.error('Liquids loading error:', liquidsError);
    }

    if (cartridgesError) {
        console.error('Cartridges loading error:', cartridgesError);
    }

    if (podsError) {
        console.error('Pods loading error:', podsError);
    }

    const normalizedProducts = (products || []).map(product => ({
        ...product,
        client_id: `product-${product.id}`,
    }));

    const normalizedLiquids = (liquids || []).map(liquid => ({
        ...liquid,
        category: liquid.category || 'Рідина',
        client_id: `liquid-${liquid.id}`,
        source_table: 'liquids',
        source_id: liquid.id,
    }));

    const normalizedCartridges = (cartridges || []).map(cartridge => ({
        ...cartridge,
        category: cartridge.category || 'Картриджі',
        client_id: `cartridge-${cartridge.id}`,
        source_table: 'cartridges',
        source_id: cartridge.id,
    }));

    const normalizedPods = (pods || []).map(pod => ({
        ...pod,
        category: pod.category || 'POD-Системи',
        client_id: `pod-${pod.id}`,
        source_table: 'pods',
        source_id: pod.id,
    }));

    productsData = [...normalizedProducts, ...normalizedLiquids, ...normalizedCartridges, ...normalizedPods];
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

function getProductId(product) {
    return String(product?.client_id ?? product?.id ?? '');
}

function findProductById(id) {
    const key = String(id);
    return productsData.find(product =>
        getProductId(product) === key ||
        String(product.id) === key
    );
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

function getProductOption(product, groupName = '') {
    if (normalizeCategory(product.category) === normalizeCategory('Картриджі')) {
        const resistance = normalizeText(
            product.ohm ||
            product.ohms ||
            product.resistance ||
            product.coil_ohm
        );

        if (resistance) return resistance;
    }

    if (normalizeCategory(product.category) === normalizeCategory('POD-Системи')) {
        const color = normalizeText(
            product.color ||
            product.colour ||
            product.pod_color
        );

        if (color) return color;
    }

    return getProductFlavor(product, groupName);
}

function getProductOptionLabel(group) {
    const category = group.items[0]?.category;

    if (normalizeCategory(category) === normalizeCategory('Картриджі')) {
        return t('ohms');
    }

    if (normalizeCategory(category) === normalizeCategory('POD-Системи')) {
        return t('colors');
    }

    return t('flavors');
}

function getProductChooseLabel(group) {
    const category = group.items[0]?.category;

    if (normalizeCategory(category) === normalizeCategory('Картриджі')) {
        return currentLang === 'en' ? 'Choose ohm' : 'Вибрати ом';
    }

    if (normalizeCategory(category) === normalizeCategory('POD-Системи')) {
        return currentLang === 'en' ? 'Choose color' : 'Вибрати колір';
    }

    return currentLang === 'en' ? 'Choose flavor' : 'Вибрати смак';
}

function getProductOptionCountText(group) {
    const category = group.items[0]?.category;

    if (normalizeCategory(category) === normalizeCategory('Картриджі')) {
        return currentLang === 'en' ? `${group.items.length} ohms` : `${group.items.length} омів`;
    }

    if (normalizeCategory(category) === normalizeCategory('POD-Системи')) {
        return currentLang === 'en' ? `${group.items.length} colors` : `${group.items.length} кольорів`;
    }

    return currentLang === 'en' ? `${group.items.length} flavors` : `${group.items.length} смаків`;
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
    const selected = group.items.find(item => getProductId(item) === String(selectedId));
    return selected || group.items.find(item => Number(item.stock) > 0) || group.items[0];
}

function openProductGroup(groupKey) {
    const group = getProductGroups(productsData).find(item => item.key === groupKey);
    if (!group) return;

    if (!selectedFlavorByGroup[group.key]) {
        selectedFlavorByGroup[group.key] = getProductId(getSelectedVariant(group));
    }

    renderProductGroupModal(group);
}

function openProductGroupEncoded(encodedGroupKey) {
    openProductGroup(decodeClickValue(encodedGroupKey));
}

function selectProductFlavor(groupKey, productId) {
    const group = getProductGroups(productsData).find(item => item.key === groupKey);
    if (!group) return;

    selectedFlavorByGroup[groupKey] = String(productId);
    renderProductGroupModal(group);

    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
}

function selectProductFlavorEncoded(encodedGroupKey, productId) {
    selectProductFlavor(decodeClickValue(encodedGroupKey), decodeClickValue(productId));
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
    const isFav = favorites.includes(getProductId(selected));
    const flavorButtons = group.items.map(item => {
        const flavor = getProductOption(item, group.name);
        const isActive = getProductId(item) === getProductId(selected);

        return `
            <button class="flavor-btn ${isActive ? 'active' : ''}"
                onclick="selectProductFlavorEncoded('${encodeClickValue(group.key)}', '${encodeClickValue(getProductId(item))}')"
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
                onclick="toggleFav('${encodeClickValue(getProductId(selected))}')">
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
                <div class="label">${getProductOptionLabel(group)}</div>
                <div class="flavor-grid">
                    ${flavorButtons}
                </div>
            </div>

            <button class="buy-btn detail-buy"
                onclick="handleBuy(this, '${encodeClickValue(getProductId(selected))}')"
                ${selected.stock <= 0 ? 'disabled style="opacity:0.5"' : ''}>
                ${selected.stock > 0 ? t('buy') : t('unavailable')}
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

    grid.innerHTML = groups.length
        ? groups.map(group => renderProductGroupCard(group)).join('')
        : renderEmptyState('⌁', t('emptyCatalog'));

    updateFooter();
}


// ================= CART =================

function addToCart(id) {
    const itemId = decodeClickValue(id);
    const product = findProductById(itemId);
    if (!product) return;

    const currentQty = cart[itemId]?.qty || 0;

    if (Number(currentQty) >= Number(product.stock)) {
        alert(t('outOfStock'));
        return;
    }

    if (cart[itemId]) {
        cart[itemId].qty++;
    } else {
        cart[itemId] = { ...product, qty: 1 };
    }

    saveCart();
    updateFooter();

    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
}

function changeQty(id, delta) {
    const itemId = decodeClickValue(id);
    if (!cart[itemId]) return;

    const product = findProductById(itemId);
    if (!product) return;

    const newQty = cart[itemId].qty + delta;

    if (newQty < 1) return;

    if (newQty > product.stock) {
        alert(t('maxStock'));
        return;
    }

    cart[itemId].qty = newQty;

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
        ? `${t('cart')} (${totalItems}) — ${totalPrice} ₴`
        : t('cartEmpty');

    const mainBtn = document.getElementById('cart-footer');
    if (mainBtn) mainBtn.innerText = text;

    const favBtn = document.getElementById('fav-cart-footer');
    if (favBtn) favBtn.innerText = text;
}

function validateCart() {
    for (let id in cart) {
        const product = findProductById(id);
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
        const itemId = getProductId(item);
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
                        <button class="qty-btn" onclick="changeQty('${encodeClickValue(itemId)}', -1)">-</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="changeQty('${encodeClickValue(itemId)}', 1)">+</button>
                    </div>

                    <span onclick="removeFromCart(${item.id})" style="cursor:pointer;">🗑️</span>
                </div>
            </div>
        `;
    }

    list.innerHTML = html || `<p style="text-align:center; color:#888;">${t('cartEmpty')}</p>`;
    document.getElementById('cart-total').innerText = `${t('total')}: ${total} ₴`;
}


// ================= FAVORITES =================

function toggleFav(id) {
    const itemId = decodeClickValue(id);

    const index = favorites.indexOf(itemId);

    if (index === -1) {
        favorites.push(itemId);
    } else {
        favorites.splice(index, 1);
    }

    localStorage.setItem('puff_favs', JSON.stringify(favorites));

    render();

    const detailModal = document.getElementById('product-group-screen');
    if (detailModal?.style.display === 'block') {
        const group = getProductGroups(productsData)
            .find(item => item.items.some(product => getProductId(product) === itemId));
        if (group) renderProductGroupModal(group);
    }

    if (document.getElementById('favorites-screen')?.style.display === 'block') {
        openFavorites();
    }
}

function openFavorites() {
    document.getElementById('favorites-screen').style.display = 'block';

    const favProducts = productsData
        .filter(p => favorites.includes(getProductId(p)))
        .map(p => productsData.find(x => getProductId(x) === getProductId(p)) || p);

    const grid = document.getElementById('favorites-grid');
    const cartContainer = document.getElementById('fav-cart-container');

    if (!favProducts.length) {
        grid.innerHTML = renderEmptyState('♡', t('emptyFavorites'));
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

function openFaq() {
    document.getElementById('faq-screen').style.display = 'block';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    if (id === 'checkout-screen') {
        resetCheckoutState();
    }
}

function showAgeGate() {
    if (localStorage.getItem('puff_age_confirmed') === '1') return;
    const modal = document.getElementById('age-screen');
    if (modal) modal.style.display = 'block';
}

function confirmAge() {
    localStorage.setItem('puff_age_confirmed', '1');
    const modal = document.getElementById('age-screen');
    if (modal) modal.style.display = 'none';
}

function denyAge() {
    document.body.innerHTML = `
        <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; text-align:center;">
            <div>
                <h2>${currentLang === 'en' ? 'Access denied' : 'Доступ обмежено'}</h2>
                <p style="color:#b2bcc4;">${currentLang === 'en' ? 'The shop is available only for users aged 18 or older.' : 'Магазин доступний лише для користувачів віком від 18 років.'}</p>
            </div>
        </div>
    `;
}

function getTelegramMainButton() {
    return window.Telegram?.WebApp?.MainButton || null;
}

function setCheckoutSubmitting(submitting) {
    const submitBtn = document.getElementById('checkout-submit-btn');
    if (submitBtn) {
        submitBtn.disabled = submitting;
        submitBtn.style.opacity = submitting ? '0.6' : '';
        submitBtn.textContent = submitting ? t('sending') : t('confirm');
    }

    const mainBtn = getTelegramMainButton();
    if (!mainBtn) return;

    if (submitting) {
        mainBtn.showProgress(false);
        mainBtn.disable();
    } else {
        mainBtn.hideProgress();
        mainBtn.enable();
    }
}

function resetCheckoutState() {
    isSubmittingOrder = false;
    setCheckoutSubmitting(false);

    const mainBtn = getTelegramMainButton();
    if (mainBtn) {
        mainBtn.offClick(submitOrder);
        mainBtn.hide();
    }
}

function showCheckoutError(message, inputId) {
    isSubmittingOrder = false;
    setCheckoutSubmitting(false);

    const errorBox = document.getElementById('checkout-error');
    if (errorBox) {
        errorBox.textContent = message;
        errorBox.style.display = 'block';
        try {
            errorBox.scrollIntoView({ block: 'nearest' });
        } catch {
            errorBox.scrollIntoView();
        }
    }

    setTimeout(() => {
        const input = document.getElementById(inputId);
        if (input) {
            try {
                input.focus({ preventScroll: true });
            } catch {
                input.focus();
            }
        }
    }, 100);
}

function hideCheckoutError() {
    const errorBox = document.getElementById('checkout-error');
    if (errorBox) {
        errorBox.textContent = '';
        errorBox.style.display = 'none';
    }
}

function bindCheckoutErrorClear() {
    ['order-name', 'order-phone', 'order-city', 'order-warehouse', 'order-comment'].forEach(id => {
        const field = document.getElementById(id);
        if (field) field.addEventListener('input', hideCheckoutError);
    });
}


// ================= CHECKOUT & ORDER SUBMISSION =================

function openCheckout() {
    if (!Object.keys(cart).length) return alert(t('cartEmpty'));
    document.getElementById('checkout-screen').style.display = 'block';
    toggleDeliveryFields();
    isSubmittingOrder = false;
    setCheckoutSubmitting(false);
    hideCheckoutError();

    const mainBtn = getTelegramMainButton();
    if (mainBtn) {
        mainBtn.setText(t('confirmOrder'));
        mainBtn.offClick(submitOrder);
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
        return showCheckoutError(t('checkContacts'), !name ? 'order-name' : 'order-phone');
    }

    if (delivery === 'nova_poshta' && (!city || !warehouse)) {
        return showCheckoutError(t('fillDelivery'), !city ? 'order-city' : 'order-warehouse');
    }

    const items = Object.values(cart);
    if (!items.length) return showCheckoutError(t('cartEmpty'));
    hideCheckoutError();

    const total = items.reduce((s, i) => s + i.price * i.qty, 0);

    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || null;
    const telegramId = tgUser?.id || null;
    const telegramUsername = tgUser?.username ? '@' + tgUser.username : null;

    const orderItems = items.map(i => ({
        id: i.id,
        client_id: getProductId(i),
        source_table: i.source_table || 'Products',
        source_id: i.source_id || i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
    }));

    // Инсертим заказ напрямую в английские названия полей
    isSubmittingOrder = true;
    setCheckoutSubmitting(true);

    let orderError = null;

    try {
        const result = await supabaseClient
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

        orderError = result.error;
    } catch (err) {
        orderError = err;
    }

    if (orderError) {
        isSubmittingOrder = false;
        setCheckoutSubmitting(false);
        console.error('Ошибка сохранения заказа:', orderError);

        const errorText = [
            orderError.message,
            orderError.details,
            orderError.hint,
            orderError.code ? `Код: ${orderError.code}` : '',
        ].filter(Boolean).join('\n');

        return showCheckoutError(`${t('saveOrderError')}\n${errorText}`);
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
    setCheckoutSubmitting(false);
}


// ================= START =================

loadCart();
applyTranslations();
load();
bindCheckoutErrorClear();
showAgeGate();

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
    const itemId = decodeClickValue(id);
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

    addToCart(itemId);
}


// ================= RENDER HELPERS =================

function renderProductGroupCard(group) {
    const selected = getSelectedVariant(group);
    const inStock = group.items.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const prices = group.items.map(item => Number(item.price || 0)).filter(price => price > 0);
    const minPrice = prices.length ? Math.min(...prices) : Number(selected.price || 0);
    const isFav = group.items.some(item => favorites.includes(getProductId(item)));
    const flavorText = group.items.length > 1
        ? getProductOptionCountText(group)
        : getProductOption(selected, group.name);

    return `
        <div class="card product-group-card" onclick="openProductGroupEncoded('${encodeClickValue(group.key)}')">
            <button class="fav-btn ${isFav ? 'active' : ''}"
                onclick="event.stopPropagation(); toggleFav('${encodeClickValue(getProductId(selected))}')">
                ${isFav ? '❤' : '♡'}
            </button>

            <div class="img-wrap">
                <img src="${escapeAttr(selected.image_url || '')}"
                     style="cursor:pointer;">
            </div>

            <div class="info">
                ${renderStock(inStock)}
                <div class="price">${currentLang === 'en' ? 'from' : 'від'} ${minPrice} ₴</div>
                <div class="name">${escapeHtml(group.name)}</div>
                <div class="flavor-count">${escapeHtml(flavorText)}</div>
                <button class="buy-btn" onclick="event.stopPropagation(); openProductGroupEncoded('${encodeClickValue(group.key)}')">
                    ${getProductChooseLabel(group)}
                </button>
            </div>
        </div>
    `;
}

function renderProductCard(p, { isFavorite = false } = {}) {
    return `
        <div class="card">
            <button class="fav-btn ${isFavorite ? 'active' : ''}"
                onclick="toggleFav('${encodeClickValue(getProductId(p))}')">
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
                    onclick="handleBuy(this, '${encodeClickValue(getProductId(p))}')"
                    ${p.stock <= 0 ? 'disabled style="opacity:0.5"' : ''}>
                    ${p.stock > 0 ? t('buy') : t('unavailable')}
                </button>
            </div>
        </div>
    `;
}

// ================= HISTORY =================

function renderStock(stock) {
    return `
        <div class="stock ${stock > 0 ? 'in' : 'out'}">
            ${stock > 0
                ? t('inStock')
                : t('outOfStock')}
        </div>
    `;
}

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
        pending: t('statusPending'),
        confirmed: t('statusConfirmed'),
        shipped: t('statusShipped'),
        completed: t('statusCompleted'),
        rejected: t('statusRejected'),
    };

    const statusClassMap = {
        pending: 'status-pending',
        confirmed: 'status-confirmed',
        shipped: 'status-shipped',
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

                <button class="repeat-order-btn" onclick='repeatOrder(${JSON.stringify(order.items || []).replaceAll("'", '&#039;')})'>
                    ${t('repeatOrder')}
                </button>

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
        case 'pending':   return t('statusPending');
        case 'confirmed': return t('statusConfirmed');
        case 'shipped':   return t('statusShipped');
        case 'completed': return t('statusCompleted');
        case 'rejected':  return t('statusRejected');
        default:          return status;
    }
}

function findProductForOrderItem(item) {
    const possibleIds = [
        item.client_id,
        item.source_table && item.source_id ? `${String(item.source_table).replace(/s$/, '')}-${item.source_id}` : '',
        item.id,
    ].filter(Boolean).map(String);

    return productsData.find(product =>
        possibleIds.includes(getProductId(product)) ||
        possibleIds.includes(String(product.id)) ||
        normalizeText(product.name).toLowerCase() === normalizeText(item.name).toLowerCase()
    );
}

function repeatOrder(items) {
    let added = 0;

    (items || []).forEach(item => {
        const product = findProductForOrderItem(item);
        if (!product || Number(product.stock) <= 0) return;

        const itemId = getProductId(product);
        const qty = Math.max(1, Number(item.qty || item.quantity || 1));
        const currentQty = Number(cart[itemId]?.qty || 0);
        const nextQty = Math.min(Number(product.stock), currentQty + qty);

        if (nextQty <= currentQty) return;
        cart[itemId] = { ...product, qty: nextQty };
        added++;
    });

    if (!added) {
        alert(t('outOfStock'));
        return;
    }

    saveCart();
    updateFooter();
    closeModal('history-screen');
    openCart();
    alert(t('addedToCart'));
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
