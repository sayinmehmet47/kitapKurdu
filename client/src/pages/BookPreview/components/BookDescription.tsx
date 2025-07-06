import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui';

interface BookDescriptionProps {
  description: string;
}

export const BookDescription: React.FC<BookDescriptionProps> = ({
  description,
}) => {
  if (!description) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Description</h3>
      </CardHeader>
      <CardContent>
        <p className="text-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
};
