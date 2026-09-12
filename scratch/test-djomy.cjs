const crypto = require('crypto');

// Simulate Djomy signature generation
function generateHmac(stringToSign, clientSecret) {
    const sha256Hmac = crypto.createHmac("sha256", clientSecret);
    sha256Hmac.update(stringToSign);
    return sha256Hmac.digest("hex");
}

const clientSecret = "s3cr3t-zei3iUnZM88Xi4Uo-siyWnRFVm3IV96-";
const clientId = "djomy-client-1784976340748-c956";

// 1. Test Auth Signature
const authSignature = generateHmac(clientId, clientSecret);
console.log("Auth Signature:", authSignature);

// 2. Test Webhook Signature
const payload = {
    message: "Statut du paiement",
    eventType: "payment.success",
    eventId: "8bfd5709-737c-4254-99a7-57a3d630b349",
    data: {
        transactionId: "123e4567-e89b-12d3-a456-426614174000",
        status: "SUCCESS"
    }
};

const rawString = JSON.stringify(payload);
const webhookSignature = generateHmac(rawString, clientSecret);
console.log("Webhook Signature (expected by our code):", webhookSignature);

// Let's test phone number parsing for OrderModal
function formatPhone(phone) {
    let clean = phone.replace(/[^0-9+]/g, ''); // Keep + and digits
    if (clean.startsWith('+')) {
        clean = '00' + clean.substring(1);
    } else if (clean.startsWith('224')) {
        clean = '00' + clean;
    } else if (clean.startsWith('6')) { // Guinea local format starts with 6
        clean = '00224' + clean;
    }
    return clean;
}

console.log("Phone tests:");
console.log("+224 623 00 00 00 ->", formatPhone("+224 623 00 00 00"));
console.log("00224623000000 ->", formatPhone("00224623000000"));
console.log("623 00 00 00 ->", formatPhone("623 00 00 00"));
