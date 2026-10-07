const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const oldGraph = `<Area type="monotone" dataKey="price" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={true} animationDuration={500} />`;

const newGraph = `<YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} hide />
                <Area type="monotone" dataKey="price" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={true} animationDuration={800} />`;

code = code.replace(oldGraph, newGraph);

// Also let's make the random variation slightly more aggressive so it visibly fluctuates
const oldRandom = `const change = (Math.random() - 0.5) * 0.8;`;
const newRandom = `const change = (Math.random() - 0.5) * 2.5; // Bigger fluctuation for visual effect`;
code = code.replace(oldRandom, newRandom);

fs.writeFileSync('miniapp/src/App.jsx', code, 'utf8');
console.log("Patched graph!");
