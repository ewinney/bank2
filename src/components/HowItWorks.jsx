import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function HowItWorks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How It Works</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal list-inside space-y-2">
          <li>Upload your bank statement (PDF, JPG, or PNG format)</li>
          <li>Our AI-powered OCR technology extracts the relevant information</li>
          <li>The data is analyzed to provide insights into your business finances</li>
          <li>View a summary and detailed breakdown of your financial status</li>
          <li>Use the insights to make informed decisions about your business</li>
        </ol>
      </CardContent>
    </Card>
  );
}