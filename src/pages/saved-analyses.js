import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useToast } from "@/components/ui/use-toast";

export default function SavedAnalyses() {
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalyses, setSelectedAnalyses] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const response = await fetch('/api/list-analyses');
      if (!response.ok) {
        throw new Error('Failed to fetch analyses');
      }
      const data = await response.json();
      setAnalyses(data.analyses);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch saved analyses",
        variant: "destructive",
      });
    }
  };

  const handleCheckboxChange = (fileName) => {
    setSelectedAnalyses(prev => 
      prev.includes(fileName)
        ? prev.filter(f => f !== fileName)
        : [...prev, fileName]
    );
  };

  const handleCompare = async () => {
    if (selectedAnalyses.length < 2) {
      toast({
        title: "Error",
        description: "Please select at least two analyses to compare",
        variant: "destructive",
      });
      return;
    }

    setIsComparing(true);
    try {
      const response = await fetch('/api/compare-analyses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileNames: selectedAnalyses,
          apiKey: localStorage.getItem('openaiApiKey'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to compare analyses');
      }

      const result = await response.json();
      setComparisonResult(result.comparison);
    } catch (error) {
      console.error('Error comparing analyses:', error);
      toast({
        title: "Error",
        description: "Failed to compare analyses",
        variant: "destructive",
      });
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <Layout title="Saved Analyses" description="View and compare your saved bank statement analyses">
      <Card className="shadow-lg mb-8">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl font-bold">Saved Analyses</CardTitle>
        </CardHeader>
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compare</TableHead>
                <TableHead>Bank Name</TableHead>
                <TableHead>Statement Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyses.map((analysis) => (
                <TableRow key={analysis.fileName}>
                  <TableCell>
                    <Checkbox
                      checked={selectedAnalyses.includes(analysis.fileName)}
                      onCheckedChange={() => handleCheckboxChange(analysis.fileName)}
                    />
                  </TableCell>
                  <TableCell>{analysis.bankName}</TableCell>
                  <TableCell>{analysis.statementDate}</TableCell>
                  <TableCell>
                    <Link href={`/analysis/${analysis.fileName}`}>
                      <Button variant="outline">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Layout>
  );
}