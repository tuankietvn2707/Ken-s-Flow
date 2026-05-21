const fs = require('fs');
let text = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

text = text.replace(/border-sky-300\/30/g, 'border-theme');
text = text.replace(/border-sky-300\/50/g, 'border-theme');
text = text.replace(/text-sky-700\/80/g, 'text-theme-muted');
text = text.replace(/text-sky-950/g, 'text-theme-primary');
text = text.replace(/text-sky-900/g, 'text-theme-secondary');
text = text.replace(/bg-sky-50\/40/g, 'bg-theme-section');
text = text.replace(/bg-sky-50/g, 'bg-theme-section');
text = text.replace(/bg-white\/70/g, 'glass-panel'); 

text = text.replace(/<XAxis([^]*?)tick=\{\{.*?\}\}/g, '<XAxis$1tick={{ fill: \'var(--text-muted)\', fontSize: 12, fontWeight: 500 }}');
text = text.replace(/<YAxis([^]*?)tick=\{\{.*?\}\}/g, '<YAxis$1tick={{ fill: \'var(--text-muted)\', fontSize: 12, fontWeight: 500 }}');
text = text.replace(/<CartesianGrid([^]*?)stroke="[^"]*"/g, '<CartesianGrid$1stroke="var(--glass-border)"');

fs.writeFileSync('src/components/Dashboard.tsx', text, 'utf8');
