const fs = require('fs');
let c = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

if (!c.includes('CheckCircle2 } from')) {
    c = c.replace(
        "import { Home, User, ArrowDown, ArrowUp, ChevronRight, Zap, Share2, Copy, X, ArrowRightLeft, Wallet, Gift, ArrowUpRight, TrendingUp, Sparkles, Info, CircleDollarSign, Gem, Coins, Delete, ChevronDown, Clock, Save } from 'lucide-react';",
        "import { Home, User, ArrowDown, ArrowUp, ChevronRight, Zap, Share2, Copy, X, ArrowRightLeft, Wallet, Gift, ArrowUpRight, TrendingUp, Sparkles, Info, CircleDollarSign, Gem, Coins, Delete, ChevronDown, Clock, Save, CheckCircle2 } from 'lucide-react';"
    );
    fs.writeFileSync('miniapp/src/App.jsx', c);
    console.log('Imports patched');
} else {
    console.log('Already imported');
}
