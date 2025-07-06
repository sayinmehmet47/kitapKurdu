import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ShelfSpaceHeaderProps {
  messageCount: number;
  isAdmin: boolean;
}

export const ShelfSpaceHeader = ({
  messageCount,
  isAdmin,
}: ShelfSpaceHeaderProps) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="bg-primary/10 p-2 rounded-lg">
        <MessageSquare className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Shelf Space</h1>
        <p className="text-sm text-muted-foreground">Community discussions</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-xs">
        {messageCount} messages
      </Badge>
      {isAdmin && (
        <Badge
          variant="outline"
          className="text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-600"
        >
          Admin
        </Badge>
      )}
    </div>
  </div>
);
