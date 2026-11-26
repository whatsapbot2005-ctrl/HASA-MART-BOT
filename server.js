require("dotenv").config();

const app = require("./index");

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("--------------------------------");
  console.log("🤖 HASA MART BOT STARTED");
  console.log("🚀 Server Port:", PORT);
  console.log("📱 WhatsApp Cloud API Ready");
  console.log("--------------------------------");
});
