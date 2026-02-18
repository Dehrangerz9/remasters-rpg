import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SOURCE_ROOT = path.join(ROOT_DIR, "lang-src");
const OUTPUT_ROOT = path.join(ROOT_DIR, "lang");

const isPlainObject = (value) => value && typeof value === "object" && !Array.isArray(value);

const deepMerge = (target, source) => {
  const output = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(output[key])) {
      output[key] = deepMerge(output[key], value);
      continue;
    }
    output[key] = value;
  }
  return output;
};

const collectJsonFiles = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(fullPath)));
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    files.push(fullPath);
  }
  return files.sort((a, b) => a.localeCompare(b));
};

const buildLocale = async (locale) => {
  const localeDirectory = path.join(SOURCE_ROOT, locale);
  const files = await collectJsonFiles(localeDirectory);
  if (!files.length) {
    throw new Error(`No JSON files found for locale: ${locale}`);
  }

  let merged = {};
  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) {
      throw new Error(`Expected object JSON in ${path.relative(ROOT_DIR, filePath)}`);
    }
    merged = deepMerge(merged, parsed);
  }

  const outputPath = path.join(OUTPUT_ROOT, `${locale}.json`);
  await fs.writeFile(outputPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  return { locale, files: files.length, outputPath };
};

const main = async () => {
  const sourceExists = await fs
    .stat(SOURCE_ROOT)
    .then((entry) => entry.isDirectory())
    .catch(() => false);
  if (!sourceExists) {
    throw new Error("lang-src directory not found.");
  }

  const locales = (await fs.readdir(SOURCE_ROOT, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  if (!locales.length) {
    throw new Error("No locale directories found in lang-src.");
  }

  const results = [];
  for (const locale of locales) {
    results.push(await buildLocale(locale));
  }

  for (const result of results) {
    const relative = path.relative(ROOT_DIR, result.outputPath);
    console.log(`Built ${relative} from ${result.files} source files.`);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
