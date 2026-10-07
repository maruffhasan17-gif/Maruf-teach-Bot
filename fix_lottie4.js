const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

code = code.replace(
  "import { Lottie } from 'lottie-react';",
  "import { DotLottieReact } from '@lottiefiles/dotlottie-react';"
);

// Remove the `useLottieData` usage because DotLottieReact takes a `src` directly!
code = code.replace(
  "function useLottieData(url) {\n  const [data, setData] = useState(null);\n  useEffect(() => {\n    fetch(url).then(r => r.json()).then(setData).catch(() => {});\n  }, [url]);\n  return data;\n}",
  ""
);

code = code.replace("const giftAnimation = useLottieData(ANIMATIONS.gift);", "");
code = code.replace("{giftAnimation && <Lottie animationData={giftAnimation} loop={true} />}", "<DotLottieReact src={ANIMATIONS.gift} loop autoplay />");

code = code.replace("const successAnim = useLottieData(ANIMATIONS.success);", "");
code = code.replace("{successAnim && <Lottie animationData={successAnim} loop={false} />}", "<DotLottieReact src={ANIMATIONS.success} autoplay />");

code = code.replace("const coinAnim = useLottieData(ANIMATIONS.coin);", "");
code = code.replace("{coinAnim && <Lottie animationData={coinAnim} loop={true} />}", "<DotLottieReact src={ANIMATIONS.coin} loop autoplay />");

fs.writeFileSync('miniapp/src/App.jsx', code, 'utf8');
console.log("Patched to use DotLottieReact");
