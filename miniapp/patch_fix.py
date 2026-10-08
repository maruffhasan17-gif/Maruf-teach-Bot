import io, re
with io.open('src/App.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Let's remove the duplicated ProfilePage and everything from BuyPage to the first ProfilePage?
# The structure is currently:
# function BuyPage
# ...
# function ProfilePage (1)
# ...
# function SellPage
# ...
# function ProfilePage (2)
# ...
# function WithdrawFiatPage

# I will find the first 'function BuyPage()'
start_buy = c.find('function BuyPage()')
# Find the second 'function ProfilePage'
start_profile2 = c.find('function ProfilePage', c.find('function ProfilePage') + 1)
# Find the start of SellPage
start_sell = c.find('function SellPage()')
# Extract SellPage correctly this time: from SellPage to the second ProfilePage
sell_page_content = c[start_sell:start_profile2]

# Create proper BuyPage
buy_page = sell_page_content.replace('SellPage', 'BuyPage')
buy_page = buy_page.replace('Sell to Taka', 'Buy TON')
buy_page = buy_page.replace('SELLING...', 'BUYING...')
buy_page = buy_page.replace('CONFIRM SELL', 'CONFIRM BUY')
buy_page = buy_page.replace('Successfully sold to TK BDT', 'Successfully bought TON')
buy_page = buy_page.replace('sell-btn-shadow', 'buy-btn-shadow')
buy_page = buy_page.replace('You Receive:', 'You Pay (BDT):')

# Now cut out everything from start_buy up to start_profile2
# And replace with buy_page + sell_page_content
new_c = c[:start_buy] + buy_page + sell_page_content + c[start_profile2:]

with io.open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(new_c)
print("Fixed duplications!")
