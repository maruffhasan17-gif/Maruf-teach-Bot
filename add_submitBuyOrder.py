import re

with open('miniapp/src/api.js', 'r', encoding='utf-8') as f:
    content = f.read()

buy_func = """
export const submitBuyOrder = async (payload) => {
    try {
        const res = await axios.post(${API_URL}/api/miniapp/buy, payload);
        return res.data;
    } catch (e) {
        console.error(e);
        throw e;
    }
};
"""

content += buy_func

with open('miniapp/src/api.js', 'w', encoding='utf-8') as f:
    f.write(content)

with open('miniapp/src/App.jsx', 'r', encoding='utf-8') as f:
    app_content = f.read()

app_content = app_content.replace(
    "import { fetchUserData, submitFreeTonTask, saveFiatWallet, withdrawFiat, submitSellOrder, buildTransaction } from './api';",
    "import { fetchUserData, submitFreeTonTask, saveFiatWallet, withdrawFiat, submitSellOrder, buildTransaction, submitBuyOrder } from './api';"
)

handle_submit = """const handleSubmit = async () => {
        if(!isValidStep2) return;
        setLoading(true);
        try {
            await submitBuyOrder({
                userId: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 8799135330,
                asset,
                amount: parseFloat(amount),
                totalBdt,
                paymentMethod,
                trxId,
                receiveAddress: receiveNumber
            });
            setStep(3);
        } catch (e) {
            alert('Failed to submit order');
        }
        setLoading(false);
    };"""

app_content = re.sub(
    r'const handleSubmit = \(\) => \{\s*if\(!isValidStep2\) return;\s*setLoading\(true\);\s*setTimeout\(\(\) => \{\s*setLoading\(false\);\s*setStep\(3\);\s*\}, 2000\);\s*\};',
    handle_submit,
    app_content
)

with open('miniapp/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(app_content)
print("Updated frontend")
