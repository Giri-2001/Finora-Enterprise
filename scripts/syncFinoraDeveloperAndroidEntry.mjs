import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const source = resolve("dist/control-center.html");
const target = resolve(
  "android/app/src/developer/assets/public/index.html"
);

const html = await readFile(source, "utf8");

if (
  !html.includes("FINORA Control Center") ||
  !/controlCenter-[^"']+\.(js|css)/.test(html)
) {
  throw new Error(
    "FINORA Developer Android entry verification failed"
  );
}

await mkdir(dirname(target), { recursive: true });
await writeFile(target, html, "utf8");

console.log(
  "FINORA_DEVELOPER_ANDROID_ENTRY=SYNCED_FROM_CURRENT_BUILD"
);