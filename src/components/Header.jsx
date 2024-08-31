import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DarkModeToggle from './DarkModeToggle';

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-6 flex items-center justify-between border-b border-indigo-500 dark:border-indigo-700 lg:border-none">
          <div className="flex items-center">
            <Link href="/">
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                FinanceInsight Pro
              </span>
            </Link>
          </div>
          <div className="ml-10 space-x-4 flex items-center">
            <Link href="/saved-analyses">
              <Button variant="ghost">Saved Analyses</Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost">Settings</Button>
            </Link>
            <DarkModeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
}