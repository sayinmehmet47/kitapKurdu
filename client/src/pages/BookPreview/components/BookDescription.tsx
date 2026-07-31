import type React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui';

interface BookDescriptionProps {
  description: string;
}

export const BookDescription: React.FC<BookDescriptionProps> = ({ description }) => {
  if (!description) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Description</h2>
      </CardHeader>
      <CardContent>
        <p className="text-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
};
