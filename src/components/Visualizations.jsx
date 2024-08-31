import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function Visualizations({ data }) {
  if (!data || !data.charts || data.charts.length === 0) {
    return <div>No visualization data available</div>;
  }

  return (
    <div className="space-y-8">
      {data.charts.map((chart, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{chart.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {chart.type === 'bar' && (
              <Bar data={chart.data} options={chart.options} />
            )}
            {chart.type === 'line' && (
              <Line data={chart.data} options={chart.options} />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}