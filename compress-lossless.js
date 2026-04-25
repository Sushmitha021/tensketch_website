const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const SOURCE_DIR = process.argv[2] || "src/images";
const OUTPUT_DIR = process.argv[3] || "dist/images";
const PROCESSABLE_EXTENSIONS = new Set([
  ".png",
  ".webp",
  ".avif",
  ".tif",
  ".tiff",
  ".svg",
  ".jpg",
  ".jpeg",
  ".gif",
]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

async function compressLossless(inputPath, outputPath) {
  const ext = path.extname(inputPath).toLowerCase();

  try {
    if (ext === ".png") {
      await sharp(inputPath, { animated: true })
        .png({ compressionLevel: 9, effort: 10 })
        .toFile(outputPath);
      return "png(lossless)";
    }
    if (ext === ".webp") {
      await sharp(inputPath, { animated: true })
        .webp({ lossless: true, effort: 6 })
        .toFile(outputPath);
      return "webp(lossless)";
    }
    if (ext === ".avif") {
      await sharp(inputPath, { animated: true })
        .avif({ lossless: true, effort: 9 })
        .toFile(outputPath);
      return "avif(lossless)";
    }
    if (ext === ".tif" || ext === ".tiff") {
      await sharp(inputPath, { animated: true })
        .tiff({ compression: "deflate", predictor: "horizontal" })
        .toFile(outputPath);
      return "tiff(lossless)";
    }
  } catch {
    await fs.copyFile(inputPath, outputPath);
    return "copied(unsupported)";
  }

  // Keep JPG/JPEG/GIF/SVG byte-identical to avoid any visual or data loss.
  await fs.copyFile(inputPath, outputPath);
  return "copied";
}

async function main() {
  const sourceRoot = path.resolve(SOURCE_DIR);
  const outputRoot = path.resolve(OUTPUT_DIR);

  try {
    await fs.access(sourceRoot);
  } catch {
    console.error(`Source folder not found: ${sourceRoot}`);
    process.exit(1);
  }

  const allFiles = await walk(sourceRoot);
  const imageFiles = allFiles.filter((file) =>
    PROCESSABLE_EXTENSIONS.has(path.extname(file).toLowerCase())
  );

  if (imageFiles.length === 0) {
    console.log(`No images found in ${sourceRoot}`);
    return;
  }

  let totalBefore = 0;
  let totalAfter = 0;
  let compressedCount = 0;

  for (const inputPath of imageFiles) {
    const relativePath = path.relative(sourceRoot, inputPath);
    const outputPath = path.join(outputRoot, relativePath);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const before = (await fs.stat(inputPath)).size;
    const mode = await compressLossless(inputPath, outputPath);
    const after = (await fs.stat(outputPath)).size;

    totalBefore += before;
    totalAfter += after;
    compressedCount += 1;

    const diff = before - after;
    const sign = diff >= 0 ? "-" : "+";
    console.log(
      `${relativePath} | ${mode} | ${formatKb(before)} -> ${formatKb(after)} (${sign}${formatKb(
        Math.abs(diff)
      )})`
    );
  }

  const totalSaved = totalBefore - totalAfter;
  const percent =
    totalBefore > 0 ? ((totalSaved / totalBefore) * 100).toFixed(2) : "0.00";

  console.log("\nDone.");
  console.log(`Processed: ${compressedCount} image(s)`);
  console.log(`Before: ${formatKb(totalBefore)}`);
  console.log(`After:  ${formatKb(totalAfter)}`);
  console.log(`Saved:  ${formatKb(totalSaved)} (${percent}%)`);
  console.log(
    "Note: JPEG/GIF/SVG are copied unchanged for strict no-quality-loss behavior in this script."
  );
}

main().catch((error) => {
  console.error("Compression failed:", error);
  process.exit(1);
});
