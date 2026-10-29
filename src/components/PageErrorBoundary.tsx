import { Component, ReactNode, ErrorInfo } from "react";
import { ErrorState } from "./States";

interface Props { children: ReactNode; }
interface State { error: Error | null; errorInfo: ErrorInfo | null; }

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null };
  static getDerivedStateFromError(error: Error) { return { error, errorInfo: null }; }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("PageErrorBoundary caught:", error, errorInfo);
  }
  
  render() {
    if (this.state.error) {
      return (
        <div role="alert" aria-live="assertive" className="p-4">
          <ErrorState 
            message={this.state.error.message} 
            onRetry={() => this.setState({ error: null, errorInfo: null })}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
