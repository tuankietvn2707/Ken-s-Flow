import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showConfirmDelete: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public props: Props;
  
  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public state: State = {
    hasError: false,
    error: null,
    showConfirmDelete: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showConfirmDelete: false };
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
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                Tải lại trang
              </button>
              
              {!this.state.showConfirmDelete ? (
                <button
                  onClick={() => (this as any).setState({ showConfirmDelete: true })}
                  className="w-full bg-rose-100 text-rose-700 py-3 rounded-xl font-medium hover:bg-rose-200 transition-colors"
                >
                  Xóa dữ liệu cũ và tải lại (Khôi phục cài đặt gốc)
                </button>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                  <p className="text-sm text-rose-800 mb-3 font-medium">
                    Hành động này sẽ xóa toàn bộ dữ liệu lưu trên trình duyệt của bạn (Học viên, Lớp học, Thu chi...). Bạn có chắc chắn muốn tiếp tục?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        window.localStorage.clear();
                        window.location.reload();
                      }}
                      className="flex-1 bg-rose-600 text-white py-2 rounded-lg font-medium hover:bg-rose-700 transition-colors"
                    >
                      Xác nhận xóa
                    </button>
                    <button
                      onClick={() => (this as any).setState({ showConfirmDelete: false })}
                      className="flex-1 bg-slate-200 text-slate-800 py-2 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (this.props as any).children;
  }
}
