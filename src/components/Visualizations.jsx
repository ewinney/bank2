import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function Visualizations({ data }) {
  const monthlySpendingData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Spending',
        data: data.monthlySpendingTrend || [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const balanceData = {
    labels: ['Credits', 'Debits', 'Balance'],
    datasets: [
      {
        label: 'Amount',
        data: [
          parseFloat(data.totalCredits) || 0,
          parseFloat(data.totalDebits) || 0,
          parseFloat(data.ledgerBalance) || 0
        ],
        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 'N/A' : `$${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Line data={monthlySpendingData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar data={balanceData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Biggest Credit: {formatCurrency(data.biggestCredit)}</li>
            <li>Biggest Debit: {formatCurrency(data.biggestDebit)}</li>
            <li>Total Transactions: {data.totalTransactions || 'N/A'}</li>
            <li>Average Balance: {formatCurrency(data.averageBalance)}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}