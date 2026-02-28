const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PUBLIC_DATA_DIR = path.join(__dirname, '..', 'public', 'data');

function prepareDataFiles() {
  // Create public/data directory if it doesn't exist
  if (!fs.existsSync(PUBLIC_DATA_DIR)) {
    fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
  }

  // Get all xlsx files from data directory
  const files = [];
  
  if (fs.existsSync(DATA_DIR)) {
    const entries = fs.readdirSync(DATA_DIR);
    
    for (const entry of entries) {
      if (entry.endsWith('.xlsx') || entry.endsWith('.xls')) {
        const sourcePath = path.join(DATA_DIR, entry);
        const destPath = path.join(PUBLIC_DATA_DIR, entry);
        
        // Copy file to public/data
        fs.copyFileSync(sourcePath, destPath);
        
        const stats = fs.statSync(sourcePath);
        files.push({
          name: entry,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        });
        
        console.log(`Copied: ${entry}`);
      }
    }
  }

  // Sort by modified date (newest first)
  files.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

  // Write files.json
  const filesJsonPath = path.join(PUBLIC_DATA_DIR, 'files.json');
  fs.writeFileSync(filesJsonPath, JSON.stringify(files, null, 2));
  
  console.log(`\nGenerated files.json with ${files.length} files`);
}

prepareDataFiles();
