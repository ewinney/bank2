import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Layout({ children, title, description }) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <Head>
        <title>{`${title} - Business Bank Statement Analyzer`}</title>
        <meta name="description" content={description} />
      </Head>
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}