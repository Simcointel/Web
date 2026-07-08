import { Component, ReactNode } from "react";
import { ErrorState } from "./States";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return <ErrorState message={this.state.error.message} onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
