const fs = require('fs');
let c = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

c = c.replace(/\/bkash\.png/g, "https://mohammadalinijhoom.com/wp-content/uploads/2024/07/bKash-Logo.png");
c = c.replace(/https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/7\/74\/Nagad_Logo\.svg/g, "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1M8VPPADiai-0lEgQMNXBEir230b0dAn61cgVHRVQat7qn3-H0L4m1Zg&s=10");

fs.writeFileSync('miniapp/src/App.jsx', c);
