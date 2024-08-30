import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DarkModeToggle from './DarkModeToggle';

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-6 flex items-center justify-between border-b border-indigo-500 dark:border-indigo-700 lg:border-none">
          <div className="flex items-center">
            <Link href="/">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                Bank Statement Analyzer
              </span>
            </Link>
          </div>
          <div className="ml-10 space-x-4 flex items-center">
            <Link href="/settings">
              <Button variant="outline">Settings</Button>
            </Link>
            <DarkModeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
}