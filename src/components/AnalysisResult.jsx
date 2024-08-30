import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AnalysisResult({ result }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Result</CardTitle>
      </CardHeader>
      <CardContent>
        {result.summary && <p className="font-semibold mb-4">{result.summary}</p>}
        {result.details && result.details.length > 0 ? (
          <ul className="list-disc list-inside">
            {result.details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        ) : (
          <p>No detailed analysis available.</p>
        )}
      </CardContent>
    </Card>
  );
}