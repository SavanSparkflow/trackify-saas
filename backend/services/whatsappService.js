const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log("Starting WhatsApp Native Client...");

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'trackify-server'
    }),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Users\\PC\\.cache\\puppeteer\\chrome\\win64-146.0.7680.31\\chrome-win64\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-extensions',
            '--disable-features=IsolateOrigins,site-per-process'
        ],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    webVersionCache: {
        type: 'none'
    }
});

let isClientReady = false;

client.on('qr', (qr) => {
    console.clear();
    console.log('\n========================================================================');
    console.log('📱 ACTION REQUIRED: LINK YOUR WHATSAPP TO TRACKIFY 📱');
    console.log('1. Open WhatsApp on your phone');
    console.log('2. Go to Settings/Menu -> Linked Devices');
    console.log('3. Tap on "Link a Device" and scan the code below:');
    console.log('========================================================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ SUCCESS: WhatsApp is now linked and ready for notifications!');
    isClientReady = true;
});

client.on('auth_failure', (msg) => {
    console.error('\n❌ AUTH ERROR: WhatsApp failed to link. Try deleting the ".wwebjs_auth" folder and restarting.', msg);
});

client.on('disconnected', (reason) => {
    console.log('\n❌ DISCONNECTED: WhatsApp was disconnected:', reason);
    isClientReady = false;
});

client.on('error', (err) => {
    console.error('\n❌ WHATSAPP ERROR:', err);
});

// Initialize the WhatsApp Web connection immediately
try {
    client.initialize();
} catch (err) {
    console.error("Critical error during WhatsApp initialization:", err);
}
console.log("WhatsApp module initialized. Waiting for QR code or saved session...");

const sendWhatsAppMessage = async (to, message) => {
    if (!isClientReady) {
        console.log(`[WhatsApp Pending] Your Trackify server has not been linked to a WhatsApp yet.\nPlease look at your Node Server terminal and scan the QR code first!`);
        return;
    }

    try {
        // Strip out all non-numeric characters from the phone number
        let formattedTo = String(to).replace(/\D/g, '');

        // If they enter 10 digits (Standard Indian Phone length), add 91 prefix
        if (formattedTo.length === 10) {
            formattedTo = `91${formattedTo}`;
        }

        // Format for whatsapp-web.js: Requires trailing @c.us for personal accounts
        const contactId = `${formattedTo}@c.us`;

        // Dispatch the message directly through exactly as if the physical phone typed it
        await client.sendMessage(contactId, message);
        console.log(`WhatsApp message sent natively to +${formattedTo}`);
    } catch (error) {
        console.error(`[WhatsApp Native Error] Failed to send message to ${to}:`, error.message);
    }
};

module.exports = { sendWhatsAppMessage };
