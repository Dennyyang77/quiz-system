import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4 focus:text-blue-700"
      >
        跳到主要內容
      </a>
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">
          無障礙數學測驗系統
        </h1>
      </header>
      <main id="main-content" className="mx-auto max-w-4xl px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white px-6 py-3 text-center text-sm text-gray-500">
        無障礙數學測驗系統 © 2026
      </footer>
    </div>
  );
}
