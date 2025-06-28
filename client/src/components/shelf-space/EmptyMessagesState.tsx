import { Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const EmptyMessagesState = () => (
  <Card className="text-center py-8">
    <CardContent>
      <Send className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
      <h3 className="font-semibold mb-2">No messages yet</h3>
      <p className="text-sm text-muted-foreground">Start the conversation!</p>
    </CardContent>
  </Card>
);
