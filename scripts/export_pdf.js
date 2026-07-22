import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function getBrowserPath() {
  const paths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const browserPath = getBrowserPath();
if (!browserPath) {
  console.error('No suitable browser found for headless PDF printing.');
  process.exit(1);
}

console.log('Using Browser:', browserPath);

const resultsDir = path.resolve(process.cwd(), 'Results');
const htmlFiles = ['academic_report.html', 'benchmark_report.html'];

for (const htmlFile of htmlFiles) {
  const htmlPath = path.join(resultsDir, htmlFile);
  const pdfPath = path.join(resultsDir, htmlFile.replace('.html', '.pdf'));

  if (fs.existsSync(htmlPath)) {
    const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
    console.log(`Converting ${htmlFile} -> ${path.basename(pdfPath)}...`);
    const cmd = `"${browserPath}" --headless --disable-gpu --no-pdf-header-footer "--print-to-pdf=${pdfPath}" "${fileUrl}"`;
    try {
      execSync(cmd, { stdio: 'inherit' });
      console.log(`Successfully generated: ${pdfPath}`);
    } catch (err) {
      console.error(`Failed to convert ${htmlFile}:`, err);
    }
  } else {
    console.warn(`HTML file not found: ${htmlPath}`);
  }
}
