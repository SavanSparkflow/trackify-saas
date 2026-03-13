const CryptoJS = require('crypto-js');

exports.passwordDecryptor = async (passwordKeyDecrypt) => {
    try {
        if (!passwordKeyDecrypt || typeof passwordKeyDecrypt !== 'string') return passwordKeyDecrypt;
        
        // Multi-layer decryption attempt
        try {
            var decLayer1 = CryptoJS.TripleDES.decrypt(passwordKeyDecrypt, process.env.PASSWORD_ENCRYPTION_SECRET);
            var deciphertext1 = decLayer1.toString(CryptoJS.enc.Utf8);
            if (!deciphertext1) return passwordKeyDecrypt;

            var decLayer2 = CryptoJS.DES.decrypt(deciphertext1, process.env.PASSWORD_ENCRYPTION_SECRET);
            var deciphertext2 = decLayer2.toString(CryptoJS.enc.Utf8);
            if (!deciphertext2) return passwordKeyDecrypt;

            var decLayer3 = CryptoJS.AES.decrypt(deciphertext2, process.env.PASSWORD_ENCRYPTION_SECRET);
            var finalDecPassword = decLayer3.toString(CryptoJS.enc.Utf8);
            
            return finalDecPassword || passwordKeyDecrypt;
        } catch (e) {
            // If any step fails (e.g. malformed UTF-8), it's likely a BCrypt hash or plain text
            return passwordKeyDecrypt;
        }
    } catch (err) {
        return passwordKeyDecrypt;
    }
};

exports.passwordEncryptor = async (passwordKeyEncrypt) => {
    try {
        if (!passwordKeyEncrypt) return "";
        var encLayer1 = CryptoJS.AES.encrypt(passwordKeyEncrypt, process.env.PASSWORD_ENCRYPTION_SECRET).toString();
        var encLayer2 = CryptoJS.DES.encrypt(encLayer1, process.env.PASSWORD_ENCRYPTION_SECRET).toString();
        var finalEncPassword = CryptoJS.TripleDES.encrypt(encLayer2, process.env.PASSWORD_ENCRYPTION_SECRET).toString();
        return finalEncPassword;
    } catch (err) {
        console.error("Encryption error:", err);
        throw err;
    }
};
