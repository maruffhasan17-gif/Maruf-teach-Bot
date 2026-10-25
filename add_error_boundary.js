const fs = require('fs');
let mainJsx = fs.readFileSync('miniapp/src/main.jsx', 'utf8');

if (!mainJsx.includes('ErrorBoundary')) {
const errorBoundaryCode = \
import React from 'react';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', wordWrap: 'break-word', zIndex: 9999, position: 'relative', background: 'white', minHeight: '100vh' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
\;

mainJsx = errorBoundaryCode + mainJsx.replace("import React from 'react';", "");
mainJsx = mainJsx.replace('<App />', '<ErrorBoundary><App /></ErrorBoundary>');
fs.writeFileSync('miniapp/src/main.jsx', mainJsx);
console.log("ErrorBoundary injected");
}
