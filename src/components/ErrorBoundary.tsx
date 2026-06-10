import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Card } from './ui';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App render error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
        <Card className="max-w-xl">
          <h1 className="text-xl font-bold text-slate-950">Something stopped the page from loading</h1>
          <p className="mt-2 text-sm text-slate-600">{this.state.error.message}</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => window.location.reload()}>Reload app</Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
                window.location.reload();
              }}
            >
              Clear app cache
            </Button>
          </div>
        </Card>
      </main>
    );
  }
}
