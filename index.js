

const express = require("express");

const app = express();

app.use(express.json());

const {
  WHATSAPP_TOKEN,
  PHONE_NUMBER_ID,
  VERIFY_TOKEN,
  GRAPH_API_VERSION = "v23.0"
} = process.env;

const WEBHOOK_PATH = "/webhook";

// Health check
app.get("/", (req, res) => {
  res.status(200).send(
    "HASA MART BOT is running! 🤖"
  );
});

// WhatsApp Webhook Verification
app.get(WEBHOOK_PATH, (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN &&
    challenge
  ) {
    console.log("WhatsApp Webhook Verified!");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Send WhatsApp Text Message
async function sendMessage(to, message) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.error("WhatsApp API credentials missing.");
    return;
  }

  const url =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
          preview_url: false,
          body: message
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API Error:", data);
      return;
    }

    console.log("Message sent successfully!");

  } catch (error) {
    console.error("Message sending failed:", error.message);
  }
}

// HASA MART Automatic Replies
function getReply(message) {
  const text = message.toLowerCase().trim();

  // Welcome
  if (
    ["hi", "hello", "hey", "හායි", "හෙලෝ", "ආයුබෝවන්"]
      .some(word => text.includes(word))
  ) {
    return `👋 Welcome to HASA Online Mart!

ආයුබෝවන්! ❤️

අපගේ Online Mart එකට සාදරයෙන් පිළිගන්නවා.

කරුණාකර අවශ්‍ය සේවාව තෝරන්න.

1️⃣ Products
2️⃣ Prices
3️⃣ Place an Order
4️⃣ Delivery Information
5️⃣ Contact Support

අංකය හෝ අවශ්‍ය දේ Type කරන්න.`;
  }

  // Products
  if (
    text === "1" ||
    text.includes("product") ||
    text.includes("භාණ්ඩ")
  ) {
    return `🛍️ HASA Online Mart Products

අපගේ විවිධ භාණ්ඩ සඳහා විස්තර ලබාගන්න පුළුවන්.

ඔබට අවශ්‍ය භාණ්ඩයේ නම හෝ Photo එක අපට එවන්න.

අපගේ කණ්ඩායම ඔබට සහාය ලබාදේ. ❤️`;
  }

  // Prices
  if (
    text === "2" ||
    text.includes("price") ||
    text.includes("මිල")
  ) {
    return `💰 Price Information

ඔබට අවශ්‍ය භාණ්ඩයේ නම හෝ Photo එක එවන්න.

අපි එහි මිල සහ ලබාගත හැකි බව තහවුරු කර දෙන්නම්.`;
  }

  // Orders
  if (
    text === "3" ||
    text.includes("order") ||
    text.includes("අවශ්‍යයි") ||
    text.includes("ඕඩර්")
  ) {
    return `📦 HASA Online Mart Orders

Order එකක් ලබාදීමට:

1. අවශ්‍ය භාණ්ඩයේ නම එවන්න.
2. අවශ්‍ය ප්‍රමාණය සඳහන් කරන්න.
3. Delivery විස්තර සඳහා අපගේ කණ්ඩායම සමඟ සම්බන්ධ වන්න.

ඔබගේ Order එක තහවුරු කිරීමෙන් පසුව අපි දැනුම් දෙන්නම්. ❤️`;
  }

  // Delivery
  if (
    text === "4" ||
    text.includes("delivery") ||
    text.includes("deliver") ||
    text.includes("delivery charge")
  ) {
    return `🚚 Delivery Information

Delivery පහසුකම් සහ ගාස්තු පිළිබඳව දැනගැනීමට ඔබගේ ප්‍රදේශය සඳහන් කර අපට පණිවිඩයක් එවන්න.

අපගේ කණ්ඩායම තොරතුරු ලබාදේ.`;
  }

  // Support
  if (
    text === "5" ||
    text.includes("support") ||
    text.includes("help") ||
    text.includes("contact")
  ) {
    return `☎️ HASA Online Mart Support

ඔබට සහාය අවශ්‍යද?

ඔබගේ ප්‍රශ්නය මෙහි Type කරන්න.

අපගේ කණ්ඩායම සමඟ සම්බන්ධ වීමට:
HASA Online Mart`;
  }

  // Default Reply
  return `❤️ Thank you for contacting HASA Online Mart!

ඔබගේ පණිවිඩය ලැබුණා.

කරුණාකර පහත සේවාවන්ගෙන් එකක් තෝරන්න:

1 - Products
2 - Prices
3 - Orders
4 - Delivery
5 - Support

ස්තුතියි! 🛒`;
}

// Process incoming messages
async function processWebhook(body) {
  try {
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value || {};
        const messages = value.messages || [];

        for (const message of messages) {
          // Ignore non-text messages
          if (message.type !== "text") {
            continue;
          }

          const sender = message.from;
          const incomingText = message.text?.body || "";

          if (!sender || !incomingText) {
            continue;
          }

          console.log("Incoming customer message received.");

          const reply = getReply(incomingText);

          await sendMessage(sender, reply);
        }
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error.message);
  }
}

// Receive WhatsApp Webhook
app.post(WEBHOOK_PATH, (req, res) => {
  const body = req.body;

  // Respond immediately to Meta
  res.sendStatus(200);

  // Process incoming messages
  processWebhook(body);
});

module.exports = app;
