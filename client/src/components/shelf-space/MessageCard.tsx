import { Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessagesModel } from '@/models/messages.model';

interface MessageCardProps {
  message: MessagesModel;
  isAdmin: boolean;
  onDelete: (messageId: string) => void;
}

const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'Just now';

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const MessageCard = ({
  message,
  isAdmin,
  onDelete,
}: MessageCardProps) => (
  <Card className="hover:shadow-sm transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={`/avatars/${message.sender.username}.png`} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {message.sender.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm truncate">
              {message.sender.username}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDate(message.date)}
              </span>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(message._id)}
                  aria-label={`Delete message from ${message.sender.username}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
            {message.text}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);
