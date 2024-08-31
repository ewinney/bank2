import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

export default function FileUpload({ onUploadAndAnalyze, isProcessing, startDate, endDate }) {
  const [selectedFiles, setSelectedFiles] = useState({});
  const [error, setError] = useState(null);
  const buttonRef = useRef(null);
  console.log('FileUpload component rendered');

  useEffect(() => {
    console.log('Date range changed. Clearing selected files.');
    setSelectedFiles({});
  }, [startDate, endDate]);

  useEffect(() => {
    console.log('selectedFiles state updated:', selectedFiles);
    console.log('Number of selected files:', Object.keys(selectedFiles).length);
  }, [selectedFiles]);

  const handleFileChange = (event, month) => {
    console.log(`handleFileChange called for ${month}`);
    const file = event.target.files[0];
    if (file) {
      console.log(`File selected for ${month}:`, file.name, 'Type:', file.type);
      if (file.type !== 'application/pdf') {
        console.log(`Invalid file type for ${month}:`, file.type);
        setError(`Invalid file type for ${month}. Please upload a PDF file.`);
      } else {
        setSelectedFiles(prev => {
          const newFiles = { ...prev, [month]: file };
          console.log('Updating selectedFiles:', newFiles);
          console.log('New number of selected files:', Object.keys(newFiles).length);
          return newFiles;
        });
        console.log(`File added for ${month}:`, file.name);
        setError(null);
      }
    } else {
      console.log(`File removed for ${month}`);
      setSelectedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[month];
        console.log('Updated selectedFiles after removal:', newFiles);
        console.log('New number of selected files:', Object.keys(newFiles).length);
        return newFiles;
      });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('handleSubmit called. selectedFiles:', selectedFiles);
    console.log('isProcessing:', isProcessing);
    const isDisabled = isProcessing || Object.keys(selectedFiles).length === 0;
    console.log('Button disabled state:', isDisabled);

    if (Object.keys(selectedFiles).length > 0) {
      console.log('Calling onUploadAndAnalyze with files:', selectedFiles);
      onUploadAndAnalyze(selectedFiles);
    } else {
      console.log('No files selected. Setting error.');
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

  console.log('Rendering FileUpload. selectedFiles:', selectedFiles, 'isProcessing:', isProcessing);
  const buttonDisabled = isProcessing || Object.keys(selectedFiles).length === 0;
  console.log('Button disabled state:', buttonDisabled);

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
      <Button
        type="submit"
        disabled={buttonDisabled}
        ref={buttonRef}
        onClick={() => console.log('Button clicked. isProcessing:', isProcessing, 'selectedFiles:', selectedFiles, 'buttonDisabled:', buttonDisabled)}
      >
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

// This useEffect hook has been moved inside the component function
