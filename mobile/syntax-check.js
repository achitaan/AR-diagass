// Simple test to check if session.tsx has valid syntax
const fs = require('fs');
const path = require('path');

try {
  // Read the session.tsx file
  const sessionPath = path.join(__dirname, 'app', 'session.tsx');
  const content = fs.readFileSync(sessionPath, 'utf8');
  
  // Check for basic syntax issues
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  
  console.log('Syntax check results:');
  console.log(`Open braces: ${openBraces}, Close braces: ${closeBraces}`);
  console.log(`Open parens: ${openParens}, Close parens: ${closeParens}`);
  console.log(`Braces balanced: ${openBraces === closeBraces ? '✓' : '✗'}`);
  console.log(`Parens balanced: ${openParens === closeParens ? '✓' : '✗'}`);
  
  if (openBraces === closeBraces && openParens === closeParens) {
    console.log('✅ File appears to have balanced braces and parentheses');
  } else {
    console.log('❌ File has unbalanced braces or parentheses');
  }
  
} catch (error) {
  console.error('Error checking file:', error.message);
}
