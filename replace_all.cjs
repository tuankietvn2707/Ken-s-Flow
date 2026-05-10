const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let text = fs.readFileSync(filePath, 'utf8');
  let original = text;

  // Colors
  text = text.replace(/text-sky-950/g, 'text-theme-primary');
  text = text.replace(/text-sky-900/g, 'text-theme-secondary');
  text = text.replace(/text-sky-700\/80/g, 'text-theme-muted');
  text = text.replace(/text-sky-600\/50/g, 'text-theme-muted');
  text = text.replace(/border-sky-300\/30/g, 'border-theme');
  text = text.replace(/border-sky-300\/40/g, 'border-theme');
  text = text.replace(/border-sky-300\/50/g, 'border-theme');
  text = text.replace(/border-sky-300\/20/g, 'border-theme');
  text = text.replace(/border-sky-200\/40/g, 'border-theme');
  text = text.replace(/bg-sky-50\/50/g, 'bg-theme-section');
  text = text.replace(/bg-sky-50\/40/g, 'bg-theme-section');
  text = text.replace(/bg-sky-100\/50/g, 'bg-theme-section');
  
  if (text !== original) {
    fs.writeFileSync(filePath, text, 'utf8');
    console.log('Updated ' + filePath);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  });
}

walk('src/components');
walk('src');
