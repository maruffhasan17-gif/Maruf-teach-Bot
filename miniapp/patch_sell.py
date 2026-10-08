import io, re
with io.open('src/App.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace Swap with Sell inside SellPage
sell_page_start = c.find('function SellPage()')
next_func_start = c.find('function WithdrawFiatPage', sell_page_start)

if sell_page_start != -1 and next_func_start != -1:
    sell_page = c[sell_page_start:next_func_start]
    
    # Text replacements in SellPage
    sell_page = sell_page.replace('Successfully swapped to', 'Successfully sold to')
    sell_page = sell_page.replace('Swap to Taka', 'Sell to Taka')
    sell_page = sell_page.replace('SWAPPING...', 'SELLING...')
    sell_page = sell_page.replace('CONFIRM SWAP', 'CONFIRM SELL')
    sell_page = sell_page.replace('swapped', 'sold')
    
    c = c[:sell_page_start] + sell_page + c[next_func_start:]
    
    with io.open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Sell page updated!")
else:
    print("Could not find boundaries")
