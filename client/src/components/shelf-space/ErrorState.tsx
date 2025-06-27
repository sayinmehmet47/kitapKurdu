import { MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const ErrorState = () => (
  <Card className="max-w-md mx-auto text-center">
    <CardContent className="py-8">
      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Unable to Load Messages</h3>
      <p className="text-muted-foreground">
        There was an error loading the shelf space messages. Please try again
        later.
      </p>
    </CardContent>
  </Card>
);
