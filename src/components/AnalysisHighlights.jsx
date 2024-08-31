import { Card, CardContent } from '@/components/ui/card';

export default function AnalysisHighlights({ transactions }) {
  const calculateTotals = (transactions) => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let largestTransaction = 0;
    let totalTransactionAmount = 0;
    let transactionCount = 0;

    Object.values(transactions).forEach(monthData => {
      if (monthData && monthData.transactions) {
        monthData.transactions.forEach(transaction => {
          const amount = parseFloat(transaction.amount);
          if (!isNaN(amount)) {
            if (amount > 0) totalIncome += amount;
            else totalExpenses += Math.abs(amount);
            largestTransaction = Math.max(largestTransaction, Math.abs(amount));
            totalTransactionAmount += Math.abs(amount);
            transactionCount++;
          }
        });
      }
    });

    const averageTransaction = transactionCount > 0 ? totalTransactionAmount / transactionCount : 0;

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      largestTransaction,
      averageTransaction,
      transactionCount
    };
  };

  const totals = calculateTotals(transactions);

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg rounded-lg overflow-hidden">
      <CardContent className="p-6">
        <h3 className="text-3xl font-bold mb-6 text-center">Financial Snapshot</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="font-semibold text-lg">Total Income</p>
            <p className="text-3xl font-bold">${totals.totalIncome.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">Total Expenses</p>
            <p className="text-3xl font-bold">${totals.totalExpenses.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">Net Profit</p>
            <p className="text-3xl font-bold">${totals.netProfit.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">Largest Transaction</p>
            <p className="text-3xl font-bold">${totals.largestTransaction.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">Average Transaction</p>
            <p className="text-3xl font-bold">${totals.averageTransaction.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">Total Transactions</p>
            <p className="text-3xl font-bold">{totals.transactionCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}