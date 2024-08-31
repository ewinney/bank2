import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function Visualizations() {
  const [visualizationData, setVisualizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem('visualizationData');
    if (data) {
      setVisualizationData(JSON.parse(data));
      setIsLoading(false);
    } else {
      router.push('/statement-review');
    }
  }, [router]);

  if (isLoading) {
    return (
      <Layout title="Loading Visualizations" description="Preparing your financial visualizations">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="ml-2 text-lg font-medium">Preparing visualizations...</span>
        </div>
      </Layout>
    );
  }

  if (!visualizationData) {
    return (
      <Layout title="Error" description="No visualization data available">
        <div className="text-center">No visualization data available.</div>
      </Layout>
    );
  }

  return (
    <Layout title="Financial Visualizations" description="Visual representation of your financial data">
      <Card className="shadow-lg mb-8">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl font-bold">Financial Visualizations</CardTitle>
        </CardHeader>
        <CardContent className="mt-6">
          {visualizationData.charts.map((chart, index) => (
            <div key={index} className="mb-8">
              <h3 className="text-xl font-semibold mb-4">{chart.title}</h3>
              <Chart
                options={chart.options}
                series={chart.series}
                type={chart.type}
                height={350}
              />
            </div>
          ))}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => router.push('/statement-review')}>Back to Analysis</Button>
            <Button onClick={() => window.print()}>Print Visualizations</Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}