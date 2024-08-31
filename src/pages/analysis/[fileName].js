import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Visualizations from '@/components/Visualizations';
import ReactMarkdown from 'react-markdown';
import AnalysisHighlights from '@/components/AnalysisHighlights';

export default function SavedAnalysisView() {
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVisualizations, setShowVisualizations] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
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
      <Card className="shadow-lg mb-8 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardTitle className="text-2xl font-bold">
            {analysisData.bankName} - {analysisData.statementDate}
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-6">
          <div className="flex justify-between mb-6">
            <Button 
              variant={showHighlights ? "secondary" : "outline"}
              onClick={() => setShowHighlights(!showHighlights)}
            >
              {showHighlights ? 'Hide Highlights' : 'Show Highlights'}
            </Button>
            <Button 
              variant={showVisualizations ? "secondary" : "outline"}
              onClick={() => setShowVisualizations(!showVisualizations)}
            >
              {showVisualizations ? 'Hide Visualizations' : 'Show Visualizations'}
            </Button>
          </div>

          {showHighlights && analysisData.transactions && (
            <AnalysisHighlights transactions={analysisData.transactions} />
          )}

          {showVisualizations ? (
            analysisData.visualizationData ? (
              <Visualizations data={analysisData.visualizationData} />
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">No visualization data available.</p>
            )
          ) : (
            <>
              <h3 className="text-2xl font-bold mb-6">Detailed Analysis</h3>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-inner mb-8 prose dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4" {...props} />,
                    li: ({node, ...props}) => <li className="mb-2" {...props} />,
                  }}
                >
                  {analysisData.analysis}
                </ReactMarkdown>
              </div>
              <h3 className="text-2xl font-bold mb-4">Transactions</h3>
              <Textarea
                value={JSON.stringify(analysisData.transactions || {}, null, 2)}
                readOnly
                rows={10}
                className="mb-8 font-mono text-sm bg-gray-100 dark:bg-gray-700"
              />
            </>
          )}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => router.push('/saved-analyses')}>Back to Saved Analyses</Button>
            <Button onClick={() => window.print()}>Print Report</Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}