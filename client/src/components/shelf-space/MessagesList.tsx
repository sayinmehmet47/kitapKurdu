import { MessagesModel } from '@/models/messages.model';
import { EmptyMessagesState } from './EmptyMessagesState';
import { MessageCard } from './MessageCard';

interface MessagesListProps {
  messages: MessagesModel[];
  isAdmin: boolean;
  onDeleteMessage: (messageId: string) => void;
}

export const MessagesList = ({
  messages,
  isAdmin,
  onDeleteMessage,
}: MessagesListProps) => {
  if (messages.length === 0) {
    return <EmptyMessagesState />;
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      {messages.map((message) => (
        <MessageCard
          key={message._id}
          message={message}
          isAdmin={isAdmin}
          onDelete={onDeleteMessage}
        />
      ))}
    </div>
  );
};
