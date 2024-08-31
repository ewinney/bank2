import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { getOpenAIApiKey, setOpenAIApiKey } from '@/lib/settings';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedApiKey = getOpenAIApiKey();
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setOpenAIApiKey(apiKey);
    toast({
      title: "Settings saved",
      description: "Your OpenAI API key has been saved.",
    });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Head>
        <title>Settings - Business Bank Statement Analyzer</title>
        <meta name="description" content="Configure your API settings" />
      </Head>

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  OpenAI API Key
                </label>
                <Input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenAI API key"
                  required
                />
              </div>
              <Button type="submit">Save Settings</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}