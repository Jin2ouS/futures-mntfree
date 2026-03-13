const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PUBLIC_DATA_DIR = path.join(__dirname, '..', 'public', 'data');

function prepareDataFiles() {
  // Create public/data directory if it doesn't exist
  if (!fs.existsSync(PUBLIC_DATA_DIR)) {
    fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
  }

  // Get all xlsx files from data directory (including subdirs like data/jin2ous/)
  const files = [];
  
  function scanDir(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        scanDir(fullPath, relPath);
      } else if (entry.name.endsWith('.xlsx') || entry.name.endsWith('.xls')) {
        const destDir = path.join(PUBLIC_DATA_DIR, prefix);
        const destPath = path.join(destDir, entry.name);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(fullPath, destPath);
        const stats = fs.statSync(fullPath);
        files.push({
          name: entry.name,
          path: relPath,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        });
        console.log(`Copied: ${relPath}`);
      }
    }
  }
  
  scanDir(DATA_DIR);

  // Sort by modified date (newest first)
  files.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

  // Write files.json
  const filesJsonPath = path.join(PUBLIC_DATA_DIR, 'files.json');
  fs.writeFileSync(filesJsonPath, JSON.stringify(files, null, 2));
  
  console.log(`\nGenerated files.json with ${files.length} files`);
}

prepareDataFiles();
