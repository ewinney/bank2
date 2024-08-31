import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

export default function FileUpload({ onUploadAndAnalyze, isProcessing, startDate, endDate }) {
  const [selectedFiles, setSelectedFiles] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    // Clear selected files when date range changes
    setSelectedFiles({});
  }, [startDate, endDate]);

  const handleFileChange = (event, month) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError(`Invalid file type for ${month}. Please upload a PDF file.`);
      } else {
        setSelectedFiles(prev => ({ ...prev, [month]: file }));
        setError(null);
      }
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (Object.keys(selectedFiles).length > 0) {
      onUploadAndAnalyze(selectedFiles);
    } else {
      setError('Please select at least one file before uploading.');
    }
  };

  const getMonthsBetweenDates = (start, end) => {
    const months = [];
    const currentDate = new Date(start);
    const endDate = new Date(end);
    while (currentDate <= endDate) {
      months.push(currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return months;
  };

  const months = getMonthsBetweenDates(startDate, endDate);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {months.map((month) => (
        <div key={month} className="flex flex-col space-y-2">
          <Label htmlFor={`file-${month}`}>{month}</Label>
          <Input
            id={`file-${month}`}
            type="file"
            onChange={(e) => handleFileChange(e, month)}
            accept=".pdf"
            disabled={isProcessing}
          />
          {selectedFiles[month] && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Selected file: {selectedFiles[month].name}
            </p>
          )}
        </div>
      ))}
      <Button type="submit" disabled={isProcessing || Object.keys(selectedFiles).length === 0}>
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Upload and Analyze'
        )}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}