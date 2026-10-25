const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');
code = code.replace(/} from 'lucide-react';/g, ", Volume2, VolumeX, Check, Settings } from 'lucide-react';");
fs.writeFileSync('miniapp/src/App.jsx', code);
