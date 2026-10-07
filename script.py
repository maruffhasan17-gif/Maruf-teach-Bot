import io
import re

with io.open('miniapp/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

tc_style_comp = '''function TonConnectStyles() {
    useEffect(() => {
        const injectStyles = () => {
            const tcRoot = document.getElementById('tc-widget-root');
            if (tcRoot && tcRoot.shadowRoot) {
                const styleId = 'custom-tc-styles';
                if (!tcRoot.shadowRoot.getElementById(styleId)) {
                    const style = document.createElement('style');
                    style.id = styleId;
                    style.textContent = 
                        /* Target TonConnect Toasts */
                        div[data-tc-toast], 
                        [class*="toast-"], 
                        [class*="Toast-"],
                        [class*="notification"] {
                            position: fixed !important;
                            top: 90px !important;
                            left: 50% !important;
                            transform: translateX(-50%) !important;
                            right: auto !important;
                            bottom: auto !important;
                            margin: 0 !important;
                            z-index: 99999 !important;
                            width: max-content !important;
                            max-width: 90vw !important;
                        }
                    ;
                    tcRoot.shadowRoot.appendChild(style);
                }
            }
        };

        const observer = new MutationObserver(() => {
            injectStyles();
        });

        observer.observe(document.body, { childList: true, subtree: true });
        injectStyles(); // initial try

        // Setup interval to catch shadowRoot creation if delayed
        const interval = setInterval(injectStyles, 500);

        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, []);

    return null;
}'''

# Insert this function right before function App()
content = content.replace('export default function App() {', tc_style_comp + '\\n\\nexport default function App() {')

# Inject <TonConnectStyles /> right inside <TonConnectUIProvider>
content = content.replace('<TonConnectUIProvider manifestUrl={manifestUrl}>\\n        <div className="min-h-screen', '<TonConnectUIProvider manifestUrl={manifestUrl}>\\n        <TonConnectStyles />\\n        <div className="min-h-screen')

with io.open('miniapp/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected TonConnectStyles")
