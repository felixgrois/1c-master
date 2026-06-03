import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Необработанная ошибка:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl border border-red-100 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">⚠️</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Что-то пошло не так</h2>
              <p className="text-gray-500 font-medium">Произошла непредвиденная ошибка в приложении.</p>
            </div>
            <div className="p-4 bg-red-50 rounded-2xl text-left overflow-auto max-h-40">
              <code className="text-xs text-red-600 font-mono">
                {error?.message || 'Неизвестная ошибка'}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase hover:brightness-110 transition-all"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
