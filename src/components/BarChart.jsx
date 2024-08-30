import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function BarChart({ data }) {
  // Helper function to safely parse financial values
  const parseFinancialValue = (str) => {
    if (!str) return 0;
    const match = str.match(/\$?([\d,]+(\.\d{2})?)/);
    return match ? parseFloat(match[1].replace(',', '')) : 0;
  };

  // Extract financial data safely
  const income = parseFinancialValue(data.details.find(d => d.toLowerCase().includes('income'))?.split(':')[1]);
  const expenses = parseFinancialValue(data.details.find(d => d.toLowerCase().includes('expenses'))?.split(':')[1]);
  const netProfit = parseFinancialValue(data.details.find(d => d.toLowerCase().includes('net profit'))?.split(':')[1]);

  const chartData = {
    labels: ['Income', 'Expenses', 'Net Profit'],
    datasets: [
      {
        label: 'Amount ($)',
        data: [income, expenses, netProfit],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Financial Overview',
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}