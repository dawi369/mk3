"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.name || "Component"}:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center backdrop-blur-sm">
          <AlertCircle className="mb-2 h-8 w-8 text-rose-500" />
          <h3 className="mb-1 text-sm font-semibold text-rose-500">
            {this.props.name || "Component"} Error
          </h3>
          <p className="mb-4 text-xs text-muted-foreground max-w-[200px] line-clamp-2">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 border-rose-500/20 hover:bg-rose-500/10 text-rose-500"
            onClick={this.handleReset}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
