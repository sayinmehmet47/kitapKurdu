import { Send } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShelfSpaceForm } from '../../pages/ShelfSpaceForm';

export const FormSidebar = () => (
  <Card className="sticky top-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Send className="h-4 w-4" />
        Share Thoughts
      </CardTitle>
      <CardDescription className="text-xs">
        Join the book discussion
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ShelfSpaceForm />
    </CardContent>
  </Card>
);
