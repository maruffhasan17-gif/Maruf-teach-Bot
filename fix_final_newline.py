import io

with io.open('index.js', 'r', encoding='utf-8') as f:
    c = f.read()

bad_str1 = "            const response = await \naxios.get(https://tonapi.io/v2/accounts//jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs);"
good_str1 = "            const response = await axios.get(https://tonapi.io/v2/accounts//jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs);"

bad_str2 = "            const jettonRes = await \naxios.get(https://tonapi.io/v2/accounts//jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs);"
good_str2 = "            const jettonRes = await axios.get(https://tonapi.io/v2/accounts//jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs);"

bad_str3 = "        const res = await \naxios.get(https://tonapi.io/v2/accounts/);"
good_str3 = "        const res = await axios.get(https://tonapi.io/v2/accounts/);"

c = c.replace(bad_str1, good_str1)
c = c.replace(bad_str2, good_str2)
c = c.replace(bad_str3, good_str3)

# Just in case there are no spaces or different indents
c = c.replace("await \naxios.get(https://tonapi.io/v2/accounts//jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs);", "await axios.get(https://tonapi.io/v2/accounts//jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs);")
c = c.replace("await \naxios.get(https://tonapi.io/v2/accounts/);", "await axios.get(https://tonapi.io/v2/accounts/);")


with io.open('index.js', 'w', encoding='utf-8') as f:
    f.write(c)
