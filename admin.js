// ================= INIT =================

const S_URL = 'https://bsiavngtycpetiiikmxd.supabase.co';
const S_KEY = 'sb_publishable_5WlTFr_cduyplbY4BS2w2w_cevKpWmW';
const ADMIN_PIN = '2580';
const ADMIN_VERSION = 'admin-force-status-v12';

let supabaseClient = null;

const statusLabels = {
    pending: 'В процесi',
    confirmed: 'Підтверджено',
    completed: 'Виконано',
    rejected: 'Вiдхилено',
};

const statusClasses = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    completed: 'status-completed',
    rejected: 'status-rejected',
};

let orders = [];
let isLoading = false;


// ================= HELPERS =================

function normalizeStatus(status) {
    const value = String(status || '').trim();

    if (value === 'В процесi') return 'pending';
    if (value === 'Підтверджено') return 'confirmed';
    if (value === 'Виконано') return 'completed';
    if (value === 'Вiдхилено') return 'rejected';

    return value || 'pending';
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatOrderNumber(order) {
    if (order.order_number === null || order.order_number === undefined) {
        return String(order.id || '').slice(0, 8);
    }

    return String(order.order_number).padStart(6, '0');
}

function getOrderSearchText(order) {
    return [
        formatOrderNumber(order),
        order.customer_name,
        order.phone,
        order.telegram,
        order.telegram_id,
        order.city,
        order.warehouse,
        order.comment,
        ...(Array.isArray(order.items) ? order.items.map(item => item.name) : []),
    ].join(' ').toLowerCase();
}

function setLastUpdated() {
    const el = document.getElementById('last-updated');
    el.textContent = `Оновлено: ${new Date().toLocaleString()}`;
}


function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;

    if (!window.supabase) {
        alert('Supabase ще не завантажився. Оновіть сторінку і спробуйте ще раз.');
        return null;
    }

    supabaseClient = window.supabase.createClient(S_URL, S_KEY);
    return supabaseClient;
}


// ================= AUTH =================

function showAdmin() {
    document.getElementById('login-screen').hidden = true;
    document.getElementById('admin-app').hidden = false;
    loadOrders();
}

function login() {
    const pinInput = document.getElementById('admin-pin');
    const error = document.getElementById('login-error');

    if (pinInput.value.trim() !== ADMIN_PIN) {
        error.textContent = 'Невірний PIN';
        return;
    }

    localStorage.setItem('puff_admin_auth', '1');
    showAdmin();
}


// ================= DATA =================

async function loadOrders() {
    if (isLoading) return;

    const client = getSupabaseClient();
    if (!client) return;

    isLoading = true;
    document.getElementById('refresh-btn').disabled = true;

    const { data, error } = await client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    isLoading = false;
    document.getElementById('refresh-btn').disabled = false;

    if (error) {
        console.error(error);
        alert(`Не вдалося завантажити замовлення:\n${error.message}`);
        return;
    }

    orders = data || [];
    setLastUpdated();
    renderOrders();
}

async function updateOrderStatus(orderId, newStatus, button) {
    const client = getSupabaseClient();
    if (!client) return;

    const order = orders.find(item => String(item.id) === String(orderId));

    button.disabled = true;
    button.textContent = 'Зберігаю...';

    const { error } = await client.rpc('admin_force_order_status_v2', {
        p_order_id: String(orderId),
        p_status: newStatus,
        p_pin: ADMIN_PIN,
    });

    button.disabled = false;
    button.textContent = 'Зберегти';

    if (error) {
        console.error(error);
        alert(`Не вдалося змінити статус (${ADMIN_VERSION}):\n${error.message}`);
        return;
    }

    await notifyCustomerStatusChange(order, newStatus);
    await loadOrders();
}

async function notifyCustomerStatusChange(order, newStatus) {
    if (!order?.telegram_id) return;

    const response = await fetch('/api/notify-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            pin: ADMIN_PIN,
            chatId: order.telegram_id,
            status: newStatus,
            orderNumber: formatOrderNumber(order),
        }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        console.error('Telegram notification error:', result);
        alert(`Статус змінено, але повідомлення покупцю не відправлено:\n${formatNotifyError(result, response)}`);
    }
}

function formatNotifyError(result, response) {
    const lines = [
        result.error || response.statusText,
        result.telegram_status ? `Telegram status: ${result.telegram_status}` : '',
        result.telegram_error ? `Telegram error: ${result.telegram_error}` : '',
    ].filter(Boolean);

    return lines.join('\n');
}

async function sendCustomerMessage(button) {
    const orderId = button.dataset.orderId;
    const order = orders.find(item => String(item.id) === String(orderId));
    const panel = button.closest('.admin-contact');
    const textarea = panel.querySelector('.admin-message-input');
    const message = textarea.value.trim();

    if (!message) {
        alert('Введіть повідомлення для покупця');
        return;
    }

    if (!order?.telegram_id) {
        alert('У цього замовлення немає Telegram ID для відправки повідомлення');
        return;
    }

    button.disabled = true;
    button.textContent = 'Відправляю...';

    const response = await fetch('/api/notify-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            pin: ADMIN_PIN,
            chatId: order.telegram_id,
            orderNumber: formatOrderNumber(order),
            message,
            type: 'custom',
        }),
    });

    const result = await response.json().catch(() => ({}));

    button.disabled = false;
    button.textContent = 'Відправити';

    if (!response.ok) {
        console.error('Telegram message error:', result);
        alert(`Не вдалося відправити повідомлення:\n${formatNotifyError(result, response)}`);
        return;
    }

    textarea.value = '';
    alert('Повідомлення покупцю відправлено');
}


// ================= RENDER =================

function renderSummary(filteredOrders) {
    const counts = {
        all: filteredOrders.length,
        pending: 0,
        confirmed: 0,
        completed: 0,
    };

    filteredOrders.forEach(order => {
        const status = normalizeStatus(order.status);
        if (counts[status] !== undefined) counts[status]++;
    });

    document.getElementById('count-all').textContent = counts.all;
    document.getElementById('count-pending').textContent = counts.pending;
    document.getElementById('count-confirmed').textContent = counts.confirmed;
    document.getElementById('count-completed').textContent = counts.completed;
}

function renderOrders() {
    const list = document.getElementById('orders-list');
    const empty = document.getElementById('empty-state');
    const search = document.getElementById('search-input').value.trim().toLowerCase();
    const filter = document.getElementById('status-filter').value;

    const filtered = orders.filter(order => {
        const status = normalizeStatus(order.status);
        const matchesStatus = filter === 'all' || status === filter;
        const matchesSearch = !search || getOrderSearchText(order).includes(search);
        return matchesStatus && matchesSearch;
    });

    renderSummary(filtered);

    list.innerHTML = filtered.map(renderOrderCard).join('');
    empty.hidden = filtered.length > 0;
}

function renderOrderCard(order) {
    const status = normalizeStatus(order.status);
    const statusLabel = statusLabels[status] || order.status || 'Невідомо';
    const statusClass = statusClasses[status] || '';
    const items = Array.isArray(order.items) ? order.items : [];
    const phone = order.phone ? `+380${order.phone}` : '—';
    const delivery = order.delivery === 'nova_poshta'
        ? `Нова Пошта, ${order.city || 'місто не вказано'}, відд. ${order.warehouse || 'не вказано'}`
        : order.delivery || '—';

    const telegramLink = order.telegram
        ? `https://t.me/${String(order.telegram).replace('@', '')}`
        : '';

    const itemsHtml = items.map(item => `
        <div class="admin-item">
            <span>${escapeHtml(item.name || `Товар #${item.id}`)}</span>
            <strong>x${escapeHtml(item.qty || item.quantity || 0)} · ${escapeHtml(item.price || 0)} ₴</strong>
        </div>
    `).join('');

    return `
        <article class="admin-order">
            <div class="admin-order-head">
                <div>
                    <div class="admin-order-title">№${escapeHtml(formatOrderNumber(order))}</div>
                    <div class="admin-order-meta">${escapeHtml(new Date(order.created_at).toLocaleString())}</div>
                </div>
                <div>
                    <div class="admin-order-total">${escapeHtml(order.total || 0)} ₴</div>
                    <span class="status-badge ${statusClass}">${escapeHtml(statusLabel)}</span>
                </div>
            </div>

            <div class="admin-order-grid">
                <div class="admin-field">Клієнт<strong>${escapeHtml(order.customer_name || '—')}</strong></div>
                <div class="admin-field">Телефон<strong>${escapeHtml(phone)}</strong></div>
                <div class="admin-field">Telegram<strong>${escapeHtml(order.telegram || order.telegram_id || '—')}</strong></div>
                <div class="admin-field">Оплата<strong>${escapeHtml(order.payment || '—')}</strong></div>
                <div class="admin-field">Доставка<strong>${escapeHtml(delivery)}</strong></div>
                <div class="admin-field">Коментар<strong>${escapeHtml(order.comment || '—')}</strong></div>
            </div>

            <div class="admin-contact admin-contact-top">
                <div class="admin-contact-actions">
                    ${telegramLink
                        ? `<a class="admin-contact-link" href="${escapeHtml(telegramLink)}" target="_blank" rel="noopener noreferrer">Відкрити Telegram</a>`
                        : '<span class="admin-muted">Telegram username не вказано</span>'}
                </div>
                <textarea class="input-field comment-field admin-message-input" placeholder="Повідомлення покупцю"></textarea>
                <button class="admin-send-btn" data-order-id="${escapeHtml(order.id)}" onclick="sendCustomerMessage(this)">Відправити</button>
            </div>

            <div class="admin-items">
                ${itemsHtml || '<div class="admin-muted">Товари не вказані</div>'}
            </div>

            <div class="admin-contact">
                <div class="admin-contact-actions">
                    ${telegramLink
                        ? `<a class="admin-contact-link" href="${escapeHtml(telegramLink)}" target="_blank" rel="noopener noreferrer">Відкрити Telegram</a>`
                        : '<span class="admin-muted">Telegram username не вказано</span>'}
                </div>
                <textarea class="input-field comment-field admin-message-input" placeholder="Повідомлення покупцю"></textarea>
                <button class="admin-send-btn" data-order-id="${escapeHtml(order.id)}" onclick="sendCustomerMessage(this)">Відправити</button>
            </div>

            <div class="admin-actions">
                <select class="input-field admin-status-select">
                    ${renderStatusOptions(status)}
                </select>
                <button class="admin-save-btn" data-order-id="${escapeHtml(order.id)}" onclick="saveStatus(this)">Зберегти</button>
            </div>
        </article>
    `;
}

function renderStatusOptions(currentStatus) {
    return Object.entries(statusLabels).map(([value, label]) => {
        const selected = value === currentStatus ? 'selected' : '';
        return `<option value="${value}" ${selected}>${escapeHtml(label)}</option>`;
    }).join('');
}

function saveStatus(button) {
    const orderId = button.dataset.orderId;
    const select = button.closest('.admin-actions').querySelector('.admin-status-select');
    updateOrderStatus(orderId, select.value, button);
}


// ================= START =================

document.getElementById('login-btn').addEventListener('click', login);
document.getElementById('admin-pin').addEventListener('keydown', event => {
    if (event.key === 'Enter') login();
});
document.getElementById('refresh-btn').addEventListener('click', loadOrders);
document.getElementById('search-input').addEventListener('input', renderOrders);
document.getElementById('status-filter').addEventListener('change', renderOrders);

if (localStorage.getItem('puff_admin_auth') === '1') {
    showAdmin();
}

setInterval(() => {
    if (!document.getElementById('admin-app').hidden) {
        loadOrders();
    }
}, 15000);
