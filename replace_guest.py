import re

with open('miniapp/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace other occurrences of 8799135330 with the global user object or WebApp user if possible.
# Actually, if we just use a Guest ID, we should replace 8799135330 fallback logic.
# The user object is passed down as a prop or available globally? 
# WebApp.initDataUnsafe?.user?.id || 123456789
content = content.replace("8799135330", "123456789")

with open('miniapp/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced all fallbacks to Guest ID (123456789)")
