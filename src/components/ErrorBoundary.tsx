import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg w-full border border-rose-100">
            <h2 className="text-xl font-bold text-rose-600 mb-4">Đã xảy ra lỗi không mong muốn</h2>
            <p className="text-slate-600 mb-4">
              Ứng dụng gặp sự cố khi hiển thị dữ liệu. Điều này thường xảy ra do dữ liệu cũ không tương thích.
            </p>
            <div className="bg-slate-100 p-4 rounded-lg overflow-auto text-xs text-slate-800 font-mono max-h-48 mb-6">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
