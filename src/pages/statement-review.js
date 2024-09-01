import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import Visualizations from '@/components/Visualizations';
import ReactMarkdown from 'react-markdown';

export default function StatementReview() {
  const [statementData, setStatementData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVisualizations, setShowVisualizations] = useState(false);
  const [bankName, setBankName] = useState('');
  const [statementDate, setStatementDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [visualizationError, setVisualizationError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    console.log("Attempting to retrieve data from localStorage");
    const data = localStorage.getItem('statementAnalysis');
    console.log("Raw data from localStorage:", data ? `${data.substring(0, 100)}...` : 'null');
    if (data) {
      try {
        console.log("Attempting to parse data");
        const parsedData = JSON.parse(data);
        console.log("Successfully parsed data structure:", Object.keys(parsedData));
        startTransition(() => {
          setStatementData(parsedData);
          console.log("Set statement data with keys:", Object.keys(parsedData));
          if (!parsedData.visualizationData) {
            console.warn("No visualization data available in parsed data");
            setVisualizationError("No visualization data available");
          } else {
            console.log("Visualization data structure:", Object.keys(parsedData.visualizationData));
            if (Array.isArray(parsedData.visualizationData.charts)) {
              console.log("Number of charts:", parsedData.visualizationData.charts.length);
              parsedData.visualizationData.charts.forEach((chart, index) => {
                console.log(`Chart ${index + 1} summary:`, {
                  type: chart.type,
                  title: chart.title,
                  datasetCount: chart.data?.datasets?.length || 0,
                  labelCount: chart.data?.labels?.length || 0
                });
                if (!chart.type || !chart.data || !chart.options) {
                  console.error(`Invalid chart structure at index ${index}`);
                } else {
                  console.log(`Chart ${index + 1} options:`, {
                    scales: chart.options.scales ? 'Present' : 'Absent',
                    tooltips: chart.options.tooltips ? 'Present' : 'Absent',
                    responsive: chart.options.responsive,
                    maintainAspectRatio: chart.options.maintainAspectRatio,
                    customOptions: Object.keys(chart.options).filter(key => !['scales', 'tooltips', 'responsive', 'maintainAspectRatio'].includes(key))
                  });
                }
                if (chart.data && chart.data.datasets) {
                  chart.data.datasets.forEach((dataset, datasetIndex) => {
                    console.log(`Chart ${index + 1}, Dataset ${datasetIndex + 1}:`, {
                      label: dataset.label,
                      dataPointCount: dataset.data?.length || 0,
                      dataType: dataset.data?.length > 0 ? typeof dataset.data[0] : 'unknown',
                      borderColor: dataset.borderColor,
                      backgroundColor: dataset.backgroundColor
                    });
                  });
                }
              });
            } else {
              console.warn("Visualization data does not contain a valid charts array");
              setVisualizationError("Invalid visualization data structure");
            }
            setVisualizationError(null);
          }
          setIsLoading(false);
        });
      } catch (error) {
        console.error("Error parsing statement data:", error);
        console.error("First 100 characters of raw data that failed to parse:", data.substring(0, 100));
        setVisualizationError(`Failed to parse statement data: ${error.message}`);
        toast({
          title: "Error",
          description: "Failed to load statement data",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } else {
      console.log("No data found in localStorage, redirecting to home");
      router.push('/');
    }
  }, [router, toast, startTransition]);

  const handleSaveAnalysis = async () => {
    if (!bankName || !statementDate) {
      toast({
        title: "Error",
        description: "Please enter bank name and statement date",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/save-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bankName,
          statementDate,
          analysis: statementData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save analysis');
      }

      toast({
        title: "Success",
        description: "Analysis saved successfully",
      });
    } catch (error) {
      console.error('Error saving analysis:', error);
      toast({
        title: "Error",
        description: "Failed to save analysis",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Layout title="Loading"><div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div></Layout>;
  }

  if (!statementData) {
    return <Layout title="Error"><div className="text-center text-red-500">Failed to load statement data</div></Layout>;
  }

  return (
    <Layout title="Statement Review">
      <Card>
        <CardHeader>
          <CardTitle>Statement Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Enter bank name"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="statementDate">Statement Date</Label>
              <Input
                id="statementDate"
                type="date"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleSaveAnalysis} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Analysis'
            )}
          </Button>

          <h3 className="text-lg font-semibold mt-6 mb-2">Analysis</h3>
          <div className="mb-4 p-4 bg-gray-100 rounded overflow-auto">
            <ReactMarkdown>{statementData.analysis}</ReactMarkdown>
          </div>

          <h3 className="text-lg font-semibold mb-2">Transactions</h3>
          <Textarea
            value={JSON.stringify(statementData.transactions, null, 2)}
            readOnly
            rows={10}
            className="font-mono text-sm"
          />

          <div className="mt-4 space-x-4">
            <Button onClick={() => router.push('/')}>Back to Home</Button>
            <Button onClick={() => setShowVisualizations(!showVisualizations)}>
              {showVisualizations ? 'Hide Visualizations' : 'Show Visualizations'}
            </Button>
          </div>

          {showVisualizations && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Visualizations</h3>
              {visualizationError ? (
                <div className="text-center text-red-500">{visualizationError}</div>
              ) : (
                <Visualizations data={statementData.visualizationData} />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
