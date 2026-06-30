const S_URL = 'https://bsiavngtycpetiiikmxd.supabase.co';
const S_KEY = 'sb_publishable_5WlTFr_cduyplbY4BS2w2w_cevKpWmW';

function cleanBotToken(value) {
    return String(value || '')
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\s+/g, '')
        .replace(/^bot/i, '');
}

function escapeText(value) {
    return String(value ?? '').trim();
}

async function findLatestOrder(telegramId) {
    if (!telegramId) return null;

    const url = new URL(`${S_URL}/rest/v1/orders`);
    url.searchParams.set('select', 'id,order_number,status,total,created_at,customer_name');
    url.searchParams.set('telegram_id', `eq.${telegramId}`);
    url.searchParams.set('order', 'created_at.desc');
    url.searchParams.set('limit', '1');

    const response = await fetch(url, {
        headers: {
            apikey: S_KEY,
            Authorization: `Bearer ${S_KEY}`,
        },
    });

    if (!response.ok) return null;

    const orders = await response.json().catch(() => []);
    return Array.isArray(orders) ? orders[0] : null;
}

async function saveIncomingMessage({ telegramId, username, firstName, lastName, text, orderId }) {
    const response = await fetch(`${S_URL}/rest/v1/bot_messages`, {
        method: 'POST',
        headers: {
            apikey: S_KEY,
            Authorization: `Bearer ${S_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
        },
        body: JSON.stringify({
            telegram_id: telegramId,
            username,
            first_name: firstName,
            last_name: lastName,
            text,
            order_id: orderId,
            direction: 'incoming',
        }),
    });

    return response.ok;
}

async function sendTelegramMessage(botToken, chatId, text) {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            disable_web_page_preview: true,
        }),
    });

    return response.ok;
}

module.exports = async function handler(req, res) {
    if (req.method === 'GET') {
        res.status(200).json({
            ok: true,
            route: 'telegram-webhook',
            has_admin_chat_id: Boolean(String(process.env.ADMIN_CHAT_ID || '').trim()),
        });
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const botToken = cleanBotToken(process.env.TELEGRAM_BOT_TOKEN);
    const adminChatId = String(process.env.ADMIN_CHAT_ID || '').trim();

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const message = body.message || body.edited_message;

    if (!message?.from || !message.chat) {
        res.status(200).json({ ok: true, skipped: 'No message' });
        return;
    }

    const text = escapeText(message.text || message.caption);
    if (!text) {
        res.status(200).json({ ok: true, skipped: 'No text' });
        return;
    }

    const user = message.from;
    const latestOrder = await findLatestOrder(user.id);
    const saved = await saveIncomingMessage({
        telegramId: user.id,
        username: user.username || null,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
        text,
        orderId: latestOrder?.id || null,
    });

    const orderLine = latestOrder
        ? `Останній заказ: №${String(latestOrder.order_number || latestOrder.id).padStart(6, '0')} | ${latestOrder.status || '-'} | ${latestOrder.total || 0} ₴`
        : 'Останній заказ: не знайдено';

    const username = user.username ? `@${user.username}` : 'без username';
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'без імені';

    const forwardText = [
        'Нове повідомлення від покупця',
        '',
        `Клієнт: ${name}`,
        `Username: ${username}`,
        `Telegram ID: ${user.id}`,
        orderLine,
        '',
        'Повідомлення:',
        text,
    ].join('\n');

    const forwarded = botToken && adminChatId
        ? await sendTelegramMessage(botToken, adminChatId, forwardText)
        : false;

    res.status(200).json({ ok: true, saved, forwarded });
};
