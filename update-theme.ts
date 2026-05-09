import fs from 'fs';
import path from 'path';

function replaceRegex(content: string, regex: RegExp, replaceValue: string) {
  return content.replace(regex, replaceValue);
}

function processAll(content: string) {
    let result = content;
    result = replaceRegex(result, /text-slate-900/g, 'text-sky-950');
    result = replaceRegex(result, /text-slate-800/g, 'text-sky-900');
    result = replaceRegex(result, /text-slate-700/g, 'text-sky-900');
    result = replaceRegex(result, /text-slate-600/g, 'text-sky-700/80');
    result = replaceRegex(result, /text-slate-500/g, 'text-sky-700/80');
    result = replaceRegex(result, /text-slate-400/g, 'text-sky-600/50');
    result = replaceRegex(result, /text-slate-300/g, 'text-sky-400/50');
    result = replaceRegex(result, /text-slate-200/g, 'text-sky-300/50');

    result = replaceRegex(result, /bg-slate-900(?:(\/[0-9]+))?/g, 'bg-sky-950$1');
    result = replaceRegex(result, /bg-slate-800(?:(\/[0-9]+))?/g, 'bg-sky-900$1');
    result = replaceRegex(result, /bg-slate-700(?:(\/[0-9]+))?/g, 'bg-sky-800$1');
    result = replaceRegex(result, /bg-slate-600(?:(\/[0-9]+))?/g, 'bg-sky-700$1');
    result = replaceRegex(result, /bg-slate-500(?:(\/[0-9]+))?/g, 'bg-sky-600$1');
    result = replaceRegex(result, /bg-slate-400(?:(\/[0-9]+))?/g, 'bg-sky-400$1');
    result = replaceRegex(result, /bg-slate-300(?:(\/[0-9]+))?/g, 'bg-sky-300$1');
    result = replaceRegex(result, /bg-slate-200(?:(\/[0-9]+))?/g, 'bg-sky-200$1');
    result = replaceRegex(result, /bg-slate-100(?:(\/[0-9]+))?/g, 'bg-sky-100/50');
    result = replaceRegex(result, /bg-slate-50(?:(\/[0-9]+))?/g, 'bg-sky-50/40');

    result = replaceRegex(result, /border-slate-900/g, 'border-sky-900');
    result = replaceRegex(result, /border-slate-800/g, 'border-sky-800');
    result = replaceRegex(result, /border-slate-700/g, 'border-sky-700');
    result = replaceRegex(result, /border-slate-600/g, 'border-sky-600');
    result = replaceRegex(result, /border-slate-500/g, 'border-sky-500');
    result = replaceRegex(result, /border-slate-400/g, 'border-sky-400');
    result = replaceRegex(result, /border-slate-300/g, 'border-sky-300/50');
    result = replaceRegex(result, /border-slate-200/g, 'border-sky-300/40');
    result = replaceRegex(result, /border-slate-100/g, 'border-sky-300/30');
    result = replaceRegex(result, /border-slate-50/g, 'border-sky-200/30');

    result = replaceRegex(result, /divide-slate-900/g, 'divide-sky-900');
    result = replaceRegex(result, /divide-slate-800/g, 'divide-sky-800');
    result = replaceRegex(result, /divide-slate-700/g, 'divide-sky-700');
    result = replaceRegex(result, /divide-slate-600/g, 'divide-sky-600');
    result = replaceRegex(result, /divide-slate-500/g, 'divide-sky-500');
    result = replaceRegex(result, /divide-slate-400/g, 'divide-sky-400');
    result = replaceRegex(result, /divide-slate-300/g, 'divide-sky-300/50');
    result = replaceRegex(result, /divide-slate-200/g, 'divide-sky-300/40');
    result = replaceRegex(result, /divide-slate-100/g, 'divide-sky-300/30');
    result = replaceRegex(result, /divide-slate-50/g, 'divide-sky-200/30');

    result = replaceRegex(result, /hover:bg-slate-900/g, 'hover:bg-sky-900');
    result = replaceRegex(result, /hover:bg-slate-800/g, 'hover:bg-sky-800');
    result = replaceRegex(result, /hover:bg-slate-700/g, 'hover:bg-sky-700');
    result = replaceRegex(result, /hover:bg-slate-600/g, 'hover:bg-sky-600');
    result = replaceRegex(result, /hover:bg-slate-500/g, 'hover:bg-sky-500');
    result = replaceRegex(result, /hover:bg-slate-400/g, 'hover:bg-sky-400');
    result = replaceRegex(result, /hover:bg-slate-300/g, 'hover:bg-sky-300/50');
    result = replaceRegex(result, /hover:bg-slate-200/g, 'hover:bg-sky-200/50');
    result = replaceRegex(result, /hover:bg-slate-100/g, 'hover:bg-sky-100/50');
    result = replaceRegex(result, /hover:bg-slate-50/g, 'hover:bg-sky-50/50');
    
    result = replaceRegex(result, /hover:text-slate-900/g, 'hover:text-sky-950');
    result = replaceRegex(result, /hover:text-slate-800/g, 'hover:text-sky-900');
    result = replaceRegex(result, /hover:text-slate-700/g, 'hover:text-sky-900');
    result = replaceRegex(result, /hover:text-slate-600/g, 'hover:text-sky-700/80');
    result = replaceRegex(result, /hover:text-slate-500/g, 'hover:text-sky-700/80');
    result = replaceRegex(result, /hover:text-slate-400/g, 'hover:text-sky-600/50');
    result = replaceRegex(result, /hover:text-slate-300/g, 'hover:text-sky-400/50');
    result = replaceRegex(result, /hover:text-slate-200/g, 'hover:text-sky-300/50');
    result = replaceRegex(result, /hover:text-slate-100/g, 'hover:text-sky-100/50');
    result = replaceRegex(result, /hover:text-slate-50/g, 'hover:text-sky-50/50');
    
    result = replaceRegex(result, /hover:border-slate-900/g, 'hover:border-sky-950');
    result = replaceRegex(result, /hover:border-slate-800/g, 'hover:border-sky-900');
    result = replaceRegex(result, /hover:border-slate-700/g, 'hover:border-sky-900');
    result = replaceRegex(result, /hover:border-slate-600/g, 'hover:border-sky-700/80');
    result = replaceRegex(result, /hover:border-slate-500/g, 'hover:border-sky-700/80');
    result = replaceRegex(result, /hover:border-slate-400/g, 'hover:border-sky-600/50');
    result = replaceRegex(result, /hover:border-slate-300/g, 'hover:border-sky-400/50');
    result = replaceRegex(result, /hover:border-slate-200/g, 'hover:border-sky-300/50');
    result = replaceRegex(result, /hover:border-slate-100/g, 'hover:border-sky-100/50');
    result = replaceRegex(result, /hover:border-slate-50/g, 'hover:border-sky-50/50');
    
    // Indigo to Sky generically
    result = replaceRegex(result, /text-indigo-600/g, 'text-sky-600');
    result = replaceRegex(result, /text-indigo-500/g, 'text-sky-500');
    result = replaceRegex(result, /bg-indigo-600/g, 'bg-sky-600');
    result = replaceRegex(result, /bg-indigo-500/g, 'bg-sky-500');
    result = replaceRegex(result, /bg-indigo-50/g, 'bg-sky-50');
    result = replaceRegex(result, /hover:bg-indigo-700/g, 'hover:bg-sky-700');
    result = replaceRegex(result, /hover:text-indigo-600/g, 'hover:text-sky-600');
    result = replaceRegex(result, /hover:text-indigo-500/g, 'hover:text-sky-500');
    result = replaceRegex(result, /focus:ring-indigo-500/g, 'focus:ring-sky-500');
    result = replaceRegex(result, /focus:border-indigo-500/g, 'focus:border-sky-500');
    
    // Common rounded issues in forms
    result = replaceRegex(result, /sm:rounded-lg/g, 'sm:rounded-2xl');
    result = replaceRegex(result, /rounded-md/g, 'rounded-xl');
    result = replaceRegex(result, /rounded-lg/g, 'rounded-xl');

    // Make standalone bg-white into glass-panel for forms / moduses
    result = replaceRegex(result, /bg-white py-8 px-4 shadow/g, 'glass-panel py-8 px-4 rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.08)]');

    return result;
}

function processDir(dir: string) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = processAll(content);
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log('Updated ' + fullPath);
            }
        }
    }
}

function run() {
  processDir(path.join(process.cwd(), 'src'));
}

run();
