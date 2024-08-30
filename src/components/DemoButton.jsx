import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

export default function DemoButton({ onDemoClick, isLoading }) {
  return (
    <Button onClick={onDemoClick} disabled={isLoading} variant="outline">
      <Play className="mr-2 h-4 w-4" />
      Run Demo Analysis
    </Button>
  );
}