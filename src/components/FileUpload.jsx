import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';

export default function FileUpload({ onFileUpload, isLoading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds the 10MB limit.');
        setSelectedFile(null);
      } else if (file.type !== 'application/pdf') {
        setError('Invalid file type. Please upload a PDF file.');
        setSelectedFile(null);
      } else {
        setError(null);
        setSelectedFile(file);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('apiKey', localStorage.getItem('openaiApiKey'));
      try {
        const response = await fetch('/api/analyze-statement', {
          method: 'POST',
          body: formData,
        });
        console.log('API Response Status:', response.status);
        console.log('API Response Headers:', JSON.stringify(Array.from(response.headers.entries())));
        const responseText = await response.text();
        console.log('API Response Text:', responseText);
        const data = JSON.parse(responseText);
        onFileUpload(data);
      } catch (error) {
        console.error('Error during file upload:', error);
        setError(`Error during analysis: ${error.message}`);
      }
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-4">
        <Input
          type="file"
          onChange={handleFileChange}
          accept=".pdf"
          disabled={isLoading}
          className="flex-grow"
        />
        <Button type="submit" disabled={!selectedFile || isLoading}>
          {isLoading ? (
            'Analyzing...'
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Upload
            </>
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
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Accepted file type: PDF. Maximum file size: 10MB.
        </AlertDescription>
      </Alert>
    </motion.form>
  );
}
