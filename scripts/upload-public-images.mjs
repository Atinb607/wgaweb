import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { v2: cloudinary } = require('../node_modules/cloudinary');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const wgawebDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(wgawebDir, 'public');

// Load environment variables from .env
const envPath = path.resolve(wgawebDir, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq > 0) {
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    env[key] = val;
  }
}

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log('Configured Cloudinary for:', env.CLOUDINARY_CLOUD_NAME);

// Recursive walk
function getFiles(dir, base = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const relPath = base ? `${base}/${file}` : file;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getFiles(fullPath, relPath));
    } else {
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

const allFiles = getFiles(publicDir);
console.log(`Found ${allFiles.length} files in ${publicDir}`);

async function uploadAll() {
  const resultMap = {};

  for (const { fullPath, relPath } of allFiles) {
    // Standardize public ID
    // Remove extension for public_id, keep path clean
    const ext = path.extname(relPath);
    const cleanRelPathWithoutExt = relPath.slice(0, -ext.length).replace(/\\/g, '/');
    const sanitizedPublicId = `wag_assets/${cleanRelPathWithoutExt}`
      .replace(/\s+/g, '_')
      .replace(/[^\w\-/]/g, '');

    console.log(`Uploading: ${relPath} -> ${sanitizedPublicId}`);

    try {
      const uploadRes = await cloudinary.uploader.upload(fullPath, {
        public_id: sanitizedPublicId,
        resource_type: 'auto',
        overwrite: true,
        use_filename: false,
        unique_filename: false,
      });

      console.log(`✓ Uploaded: ${uploadRes.secure_url}`);
      resultMap[relPath.replace(/\\/g, '/')] = {
        secure_url: uploadRes.secure_url,
        public_id: uploadRes.public_id,
        format: uploadRes.format,
        width: uploadRes.width,
        height: uploadRes.height,
      };
    } catch (err) {
      console.error(`✗ Error uploading ${relPath}:`, err.message);
    }
  }

  const outMapPath = path.resolve(__dirname, 'uploaded-images-map.json');
  fs.writeFileSync(outMapPath, JSON.stringify(resultMap, null, 2), 'utf8');
  console.log(`\nWrote results map to: ${outMapPath}`);
}

uploadAll();
