const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const regex = /const \[activeTab, setActiveTab\] = useState\('home'\);/;
const replace = `const [activeTab, setActiveTab] = useState('home');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);`;

code = code.replace(regex, replace);
fs.writeFileSync('miniapp/src/App.jsx', code);
