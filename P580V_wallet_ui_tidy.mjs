import fs from "node:fs";

const file = "app/renderer/v2/pages/wallet/ServerWalletPage.tsx";
if (!fs.existsSync(file)) {
  throw new Error("STOP: ServerWalletPage.tsx not found");
}

let src = fs.readFileSync(file, "utf8");
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const backup = `${file}.P580V-${stamp}.bak`;
fs.copyFileSync(file, backup);

function stop(msg) {
  throw new Error(`STOP: ${msg}`);
}

/* 1) Remove recharge helper paragraph */
const helperRegex =
  /INR 50 to INR 2000, in whole rupees\.\s*Submitting a request does not transfer money or\s*increase your balance\.\s*Credit requires verified payment and administrator approval\.\s*/;
if (!helperRegex.test(src)) {
  stop("Recharge helper text not found");
}
src = src.replace(helperRegex, "");

/* 2) Make "Verified branch Wallet loaded from FINORA server." line bright */
const messageBlock = src.match(
  /<div style=\{\{[\s\S]{0,700}?color:\s*[^,\n]+[\s\S]{0,700}?\}\}>\s*\{message\}\s*<\/div>/
);
if (!messageBlock) {
  stop("Wallet message block not found");
}
const brighterMessageBlock = messageBlock[0].replace(
  /color:\s*[^,\n]+/,
  "color: theme.colors.text.primary"
);
src = src.replace(messageBlock[0], brighterMessageBlock);

/* 3) Add amount placeholder: MIN 50 • MAX 2000 */
const amountLabelIndex = src.indexOf("Recharge amount (INR)");
if (amountLabelIndex === -1) {
  stop("Recharge amount label not found");
}
const inputStart = src.indexOf("<input", amountLabelIndex);
if (inputStart === -1) {
  stop("Recharge amount input not found");
}
const inputEnd = src.indexOf("/>", inputStart);
if (inputEnd === -1) {
  stop("Recharge amount input closing not found");
}

let amountInputTag = src.slice(inputStart, inputEnd + 2);
if (/placeholder\s*=/.test(amountInputTag)) {
  amountInputTag = amountInputTag.replace(
    /placeholder\s*=\s*(\{[\s\S]*?\}|"[^"]*"|'[^']*')/,
    'placeholder="MIN 50 • MAX 2000"'
  );
} else {
  amountInputTag = amountInputTag.replace(
    /\/>$/,
    ' placeholder="MIN 50 • MAX 2000" />'
  );
}
src = src.slice(0, inputStart) + amountInputTag + src.slice(inputEnd + 2);

fs.writeFileSync(file, src, "utf8");
console.log("PATCHED:", file);
console.log("BACKUP:", backup);
console.log("PASS: Wallet status text brightened");
console.log("PASS: Recharge helper line removed");
console.log("PASS: Amount placeholder set to MIN 50 • MAX 2000");
