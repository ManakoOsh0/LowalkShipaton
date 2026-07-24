import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const xml = fs
  .readFileSync(path.join(root, "assets/images/pixelated_golden_coin.svg"), "utf8")
  .trim();

const out = `/** Pixelated golden coin SVG — source: assets/images/pixelated_golden_coin.svg */
export const pixelatedGoldenCoinXml = ${JSON.stringify(xml)};
`;

fs.writeFileSync(path.join(root, "constants/pixelatedGoldenCoin.ts"), out);
