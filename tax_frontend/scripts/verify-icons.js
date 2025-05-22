// filepath: c:\Users\Keerththansana\Desktop\Project\Tax.X\tax_frontend\scripts\verify-icons.js
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const manifest = require('../public/manifest.json');

manifest.icons.forEach(icon => {
  const iconPath = path.join(publicDir, icon.src);
  if (!fs.existsSync(iconPath)) {
    console.error(`Missing icon: ${icon.src}`);
    console.log(`Please add the icon to: ${iconPath}`);
  }
});