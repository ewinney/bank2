import { useState, useEffect, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Loader2 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function Visualizations({ data }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.log('Visualizations component received data:', data);
    startTransition(() => {
      if (data && Array.isArray(data.charts) && data.charts.length > 0) {
        console.log('Valid chart data found. Number of charts:', data.charts.length);
        setIsLoading(false);
      } else {
        console.error('Invalid or missing chart data:', data);
        setError('No valid visualization data available');
        setIsLoading(false);
      }
    });
  }, [data, startTransition]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {data.charts.map((chart, index) => {
        console.log(`Rendering chart ${index + 1}:`, chart);
        return (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <CardTitle>{chart.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {chart.type === 'bar' && chart.data.datasets[0].data.length > 0 ? (
                <Bar data={chart.data} options={{...chart.options, responsive: true, maintainAspectRatio: false}} />
              ) : chart.type === 'line' && chart.data.datasets[0].data.length > 0 ? (
                <Line data={chart.data} options={{...chart.options, responsive: true, maintainAspectRatio: false}} />
              ) : (
                <div className="text-center text-gray-500">
                  {`No data available for this ${chart.type} chart (${chart.title})`}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
