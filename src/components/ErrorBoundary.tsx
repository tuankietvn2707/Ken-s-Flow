import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';

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
        <div className="min-h-screen flex items-center justify-center bg-sky-50/40 p-4">
          <div className="glass-panel text-sky-950 p-6 rounded-2xl shadow-xl max-w-lg w-full border border-sky-300/30">
            <h2 className="text-xl font-bold text-rose-600 mb-4">Đã xảy ra lỗi không mong muốn</h2>
            <p className="text-sky-700/80 mb-4">
              Ứng dụng gặp sự cố khi hiển thị dữ liệu. Điều này thường xảy ra do dữ liệu cũ không tương thích.
            </p>
            <div className="bg-sky-50/40 p-4 rounded-xl overflow-auto text-xs text-sky-900 font-mono max-h-48 mb-6">
              {this.state.error?.toString()}
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Tải lại trang
              </Button>
              
              {!this.state.showConfirmDelete ? (
                <Button
                  variant="danger"
                  onClick={() => (this as any).setState({ showConfirmDelete: true })}
                  className="w-full"
                >
                  Xóa dữ liệu cũ và tải lại (Khôi phục cài đặt gốc)
                </Button>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                  <p className="text-sm text-rose-800 mb-3 font-medium">
                    Hành động này sẽ xóa toàn bộ dữ liệu lưu trên trình duyệt của bạn (Học viên, Lớp học, Thu chi...). Bạn có chắc chắn muốn tiếp tục?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      onClick={() => {
                        window.localStorage.clear();
                        window.location.reload();
                      }}
                      className="flex-1"
                    >
                      Xác nhận xóa
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => (this as any).setState({ showConfirmDelete: false })}
                      className="flex-1"
                    >
                      Hủy
                    </Button>
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
