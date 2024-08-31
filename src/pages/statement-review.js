import { useState, useEffect } from 'react';
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
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const data = localStorage.getItem('statementAnalysis');
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        setStatementData(parsedData);
        console.log("Loaded statement data:", parsedData);
        console.log("Visualization data:", parsedData.visualizationData);
      } catch (error) {
        console.error("Error parsing statement data:", error);
        toast({
          title: "Error",
          description: "Failed to load statement data",
          variant: "destructive",
        });
      }
    } else {
      router.push('/');
    }
    setIsLoading(false);
  }, [router, toast]);

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

  if (!statementData) {
    return <Layout title="Loading">Loading...</Layout>;
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
            <Button onClick={() => {
              setShowVisualizations(!showVisualizations);
              console.log("Visualization data when toggling:", statementData.visualizationData);
            }}>
              {showVisualizations ? 'Hide Visualizations' : 'Show Visualizations'}
            </Button>
          </div>

          {showVisualizations && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Visualizations</h3>
              {statementData.visualizationData ? (
                <Visualizations data={statementData.visualizationData} />
              ) : (
                <p>No visualization data available</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
