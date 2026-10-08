import io, re
with io.open('src/App.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

sell_page_start = c.find('function SellPage()')
next_func_start = c.find('function WithdrawFiatPage', sell_page_start)

if sell_page_start != -1 and next_func_start != -1:
    sell_page = c[sell_page_start:next_func_start]
    
    # Create BuyPage by copying SellPage
    buy_page = sell_page.replace('SellPage', 'BuyPage')
    buy_page = buy_page.replace('Sell to Taka', 'Buy TON')
    buy_page = buy_page.replace('SELLING...', 'BUYING...')
    buy_page = buy_page.replace('CONFIRM SELL', 'CONFIRM BUY')
    buy_page = buy_page.replace('Successfully sold to TK BDT', 'Successfully bought TON')
    buy_page = buy_page.replace('sell-btn-shadow', 'buy-btn-shadow')
    
    # Inverse rate calculation for Buy
    # In Sell: Number(amount) * liveCryptoRate * liveUsdBdt
    # In Buy: Number(amount) / (liveCryptoRate * liveUsdBdt) ... wait, if they buy TON, they enter BDT amount or TON amount?
    # Usually you enter TON amount you want to buy, and pay BDT. So it's the same formula for "Pay" amount.
    buy_page = buy_page.replace('You Receive:', 'You Pay (BDT):')
    
    c = c[:sell_page_start] + buy_page + sell_page + c[next_func_start:]
    
    # Update navigation to have 4 buttons
    nav_old = '''<div className="w-full max-w-md bg-white rounded-t-[24px] flex justify-between items-end px-8 pb-5 pt-4 floating-nav-shadow">
            <button onClick={() => setActiveTab('home')} className={lex flex-col items-center p-2 transition-all duration-300 }>
              <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">HOME</span>
            </button>

            <button onClick={() => setActiveTab('sell')} className={elative -top-5 flex flex-col items-center justify-center w-[56px] h-[56px] rounded-full bg-[var(--color-brand)] border-[4px] border-[var(--color-bg-primary)] sell-btn-shadow text-white transition-transform active:scale-95}>
              <ArrowRightLeft size={24} strokeWidth={2.5} className={activeTab === 'sell' ? 'animate-pulse' : ''} />
            </button>

            <button onClick={() => setActiveTab('profile')} className={lex flex-col items-center p-2 transition-all duration-300 }>
              <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">PROFILE</span>
            </button>
          </div>'''
          
    nav_new = '''<div className="w-full max-w-md bg-white rounded-t-[24px] flex justify-around items-end px-4 pb-5 pt-4 floating-nav-shadow">
            <button onClick={() => setActiveTab('home')} className={lex flex-col items-center p-2 transition-all duration-300 }>
              <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">HOME</span>
            </button>

            <button onClick={() => setActiveTab('buy')} className={lex flex-col items-center p-2 transition-all duration-300 }>
              <ArrowDown size={22} strokeWidth={activeTab === 'buy' ? 2.5 : 2} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">BUY</span>
            </button>

            <button onClick={() => setActiveTab('sell')} className={lex flex-col items-center p-2 transition-all duration-300 }>
              <ArrowUp size={22} strokeWidth={activeTab === 'sell' ? 2.5 : 2} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">SELL</span>
            </button>

            <button onClick={() => setActiveTab('profile')} className={lex flex-col items-center p-2 transition-all duration-300 }>
              <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">PROFILE</span>
            </button>
          </div>'''
          
    c = c.replace(nav_old, nav_new)
    
    # Add imports
    c = c.replace('import { Home, User,', 'import { Home, User, ArrowDown, ArrowUp,')
    
    # Add to activeTab logic
    c = c.replace("{activeTab === 'sell' && <SellPage />}", "{activeTab === 'buy' && <BuyPage />}\n          {activeTab === 'sell' && <SellPage />}")
    
    with io.open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Buy page injected!")
else:
    print("Error parsing")
