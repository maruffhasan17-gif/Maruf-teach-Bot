const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const badCode = `           </div>
        </div>
        </div>

        <div className="p-6">`;

const goodCode = `           </div>
        </div>

        <div className="p-6">`;

code = code.replace(`</div>\n          </div>\n  \n          <div className="p-6">`, `</div>\n  \n          <div className="p-6">`);
// Or more aggressively:
code = code.replace(/<\/div>\s*<\/div>\s*<div className="p-6">/, `</div>\n\n        <div className="p-6">`);

fs.writeFileSync('miniapp/src/App.jsx', code, 'utf8');
console.log("Fixed JSX error");
