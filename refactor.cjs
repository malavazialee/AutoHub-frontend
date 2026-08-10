const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // If it's Login, we might not want to intercept its fetch because it needs to POST without a token initially.
  // Actually, sending a null token is fine for Login, or we can just leave Login using native fetch.
  if (file === 'Login.jsx') return;

  if (content.includes('fetch(')) {
    // Replace fetch( with apiFetch(
    content = content.replace(/\bfetch\(/g, 'apiFetch(');

    // Add import statement if not exists
    if (!content.includes("import apiFetch")) {
      content = "import apiFetch from '../utils/apiFetch';\n" + content;
    }

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
