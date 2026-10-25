const fs = require('fs');
let c = fs.readFileSync('miniapp/src/App.jsx', 'utf8');
c = c.replace('<style>{', '<style>{`');
c = c.replace('overflow: hidden !important; }\r\n          }</style>', 'overflow: hidden !important; }\r\n          `}</style>');
c = c.replace('overflow: hidden !important; }\n          }</style>', 'overflow: hidden !important; }\n          `}</style>');
fs.writeFileSync('miniapp/src/App.jsx', c);
