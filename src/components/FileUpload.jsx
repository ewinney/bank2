import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function FileUpload({ onUploadAndAnalyze, isProcessing }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Invalid file type. Please upload a PDF file.');
        setSelectedFile(null);
      } else {
        setError(null);
        setSelectedFile(file);
      }
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (selectedFile) {
      onUploadAndAnalyze(selectedFile);
    } else {
      setError('Please select a file before uploading.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-4">
        <Input
          type="file"
          onChange={handleFileChange}
          accept=".pdf"
          disabled={isProcessing}
          className="flex-grow"
        />
        <Button type="submit" disabled={isProcessing || !selectedFile}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Upload and Analyze'
          )}
        </Button>
      </div>
      {selectedFile && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selected file: {selectedFile.name}
        </p>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}