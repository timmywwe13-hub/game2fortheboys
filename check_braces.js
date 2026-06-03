const fs = require('fs');
const content = fs.readFileSync('game.js', 'utf8');
let open = 0;
const lines = content.split('\n');
const braceStack = [];

lines.forEach((line, i) => {
  // Process each character to track opening/closing braces
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '{') {
      open++;
      braceStack.push({ line: i+1, col: j, char: line.substring(Math.max(0, j-20), Math.min(line.length, j+30)) });
    } else if (char === '}') {
      open--;
      if (braceStack.length > 0) {
        braceStack.pop();
      }
    }
  }
});

console.log(`Final brace balance: ${open}`);
if (open > 0) {
  console.log(`\nMissing ${open} closing brace(s)`);
  console.log(`\nUnclosed opening braces:`);
  braceStack.slice(-5).forEach(b => {
    console.log(`  Line ${b.line}: ...${b.char}...`);
  });
}
