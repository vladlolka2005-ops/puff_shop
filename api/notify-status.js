const STATUS_LABELS = {
    pending: 'В процесi',
    confirmed: 'Підтверджено',
    completed: 'Виконано',
    rejected: 'Вiдхилено',
};

const STATUS_MESSAGES = {
    pending: 'Ваше замовлення знову в обробці.',
    confirmed: 'Ваше замовлення підтверджено.',
    completed: 'Ваше замовлення виконано.',
    rejected: 'Ваше замовлення відхилено.',
};

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const botToken = String(process.env.TELEGRAM_BOT_TOKEN || '')
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\s+/g, '')
        .replace(/^bot/i, '');
    const adminPin = process.env.ADMIN_PIN || '2580';

    if (!botToken) {
        res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is not configured' });
        return;
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { pin, chatId, status, orderNumber, message, type } = body;

    if (pin !== adminPin) {
        res.status(403).json({ error: 'Invalid PIN' });
        return;
    }

    if (!chatId) {
        res.status(200).json({ skipped: true, reason: 'No Telegram chat id' });
        return;
    }

    if (type !== 'custom' && !STATUS_LABELS[status]) {
        res.status(400).json({ error: 'Invalid status' });
        return;
    }

    if (type === 'custom' && !String(message || '').trim()) {
        res.status(400).json({ error: 'Message is required' });
        return;
    }

    const text = type === 'custom'
        ? [
            `Повідомлення щодо замовлення №${orderNumber || '-'}.`,
            '',
            String(message || '').trim(),
            '',
            'З питань звертайтеся до менеджера: @nnpuff',
        ].join('\n')
        : [
            `Статус замовлення №${orderNumber || '-'} змінено.`,
            `Новий статус: ${STATUS_LABELS[status]}.`,
            STATUS_MESSAGES[status],
            '',
            'З питань звертайтеся до менеджера: @nnpuff',
        ].join('\n');

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
        }),
    });

    const telegramResult = await telegramResponse.json().catch(() => null);

    if (!telegramResponse.ok || telegramResult?.ok === false) {
        const telegramError = telegramResult?.description || telegramResponse.statusText || 'Telegram API error';
        const friendlyError = telegramResponse.status === 404
            ? 'Telegram bot token is invalid. Check TELEGRAM_BOT_TOKEN in Vercel.'
            : telegramError;

        res.status(502).json({
            error: friendlyError,
            telegram_error: telegramError,
            telegram_status: telegramResponse.status,
        });
        return;
    }

    res.status(200).json({ ok: true });
};
