import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Visualizations from '@/components/Visualizations';

export default function SavedAnalysisView() {
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVisualizations, setShowVisualizations] = useState(false);
  const router = useRouter();
  const { fileName } = router.query;

  useEffect(() => {
    if (fileName) {
      fetchAnalysis(fileName);
    }
  }, [fileName]);

  const fetchAnalysis = async (fileName) => {
    try {
      const response = await fetch(`/api/get-analysis?fileName=${fileName}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }
      const data = await response.json();
      setAnalysisData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout title="Loading Analysis" description="Loading saved analysis">
        <div className="flex items-center justify-center h-64">
          <span className="text-lg font-medium">Loading analysis...</span>
        </div>
      </Layout>
    );
  }

  if (!analysisData) {
    return (
      <Layout title="Error" description="Analysis not found">
        <div className="text-center">Analysis not found.</div>
      </Layout>
    );
  }

  return (
    <Layout title={`Analysis - ${analysisData.bankName}`} description="View saved bank statement analysis">
      <Card className="shadow-lg mb-8">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl font-bold">
            {analysisData.bankName} - {analysisData.statementDate}
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Analysis</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto whitespace-pre-wrap font-mono text-sm mb-8">
            {analysisData.analysis}
          </div>
          {showVisualizations ? (
            analysisData.visualizationData ? (
              <Visualizations data={analysisData.visualizationData} />
            ) : (
              <p>No visualization data available.</p>
            )
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-4">Transactions</h3>
              <Textarea
                value={JSON.stringify(analysisData.transactions || [], null, 2)}
                readOnly
                rows={10}
                className="mb-8 font-mono text-sm"
              />
            </>
          )}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => router.push('/saved-analyses')}>Back to Saved Analyses</Button>
            <Button onClick={() => setShowVisualizations(!showVisualizations)}>
              {showVisualizations ? 'Show Transactions' : 'Show Visualizations'}
            </Button>
            <Button onClick={() => window.print()}>Print Report</Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}