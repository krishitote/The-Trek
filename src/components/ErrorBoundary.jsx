// src/components/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-100 text-red-800 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">⚠️ Something went wrong.</h2>
          <p>Please try refreshing the page.</p>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-4 whitespace-pre-wrap text-sm text-red-700">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
