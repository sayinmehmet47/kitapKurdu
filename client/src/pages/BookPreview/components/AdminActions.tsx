import type React from 'react';
import { Button, Card, CardContent, CardHeader } from '@/components/ui';

interface AdminActionsProps {
  isAdmin: boolean;
  onEditBook: () => void;
  onDeleteBook?: () => void;
}

export const AdminActions: React.FC<AdminActionsProps> = ({
  isAdmin,
  onEditBook,
  onDeleteBook,
}) => {
  if (!isAdmin) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Admin Actions</h2>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onEditBook}>
            Edit Book
          </Button>
          {onDeleteBook && (
            <Button variant="destructive" onClick={onDeleteBook}>
              Delete Book
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
