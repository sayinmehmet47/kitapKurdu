import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components';
import { Textarea } from '@/components/ui/textarea';
import { useAddMessageMutation } from '@/redux/services/messages.api';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import * as z from 'zod';
import { RootState } from '@/redux/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const ShelfSpaceForm: FC = () => {
  const user = useSelector((state: RootState) => state.authSlice.user.user);
  const userId = user.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addMessage] = useAddMessageMutation();

  const formSchema = z.object({
    message: z
      .string()
      .min(2, { message: 'Message must be at least 2 characters.' })
      .max(500, { message: 'Message cannot exceed 500 characters.' }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  const messageLength = form.watch('message')?.length || 0;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userId) {
      toast.error('Authentication required. Please log in and try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addMessage({
        text: values.message,
        sender: userId,
      }).unwrap();

      toast.success('Message shared successfully!');
      form.reset();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact User Preview */}
      <div className="flex items-center gap-2 p-2 bg-background rounded border">
        <Avatar className="h-6 w-6">
          <AvatarImage src={`/avatars/${user.username}.png`} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {user.username?.slice(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-xs text-muted-foreground">Posting as</p>
          <p className="text-sm font-medium text-primary">{user.username}</p>
        </div>
      </div>

      {/* Compact Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Your message</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share your thoughts about books..."
                    className="min-h-[80px] resize-none text-sm"
                    {...field}
                  />
                </FormControl>
                <div className="flex justify-between items-center">
                  <FormMessage />
                  <span
                    className={`text-xs ${
                      messageLength > 450
                        ? 'text-destructive'
                        : messageLength > 400
                        ? 'text-orange-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {messageLength}/500
                  </span>
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || messageLength === 0}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Send className="h-3 w-3 mr-2" />
                Share
              </>
            )}
          </Button>
        </form>
      </Form>

      {/* Compact Guidelines */}
      <div className="bg-muted/30 p-2 rounded text-xs text-muted-foreground">
        <strong className="text-primary">Community Guidelines:</strong> Be
        respectful, keep discussions book-related, and no spoilers without
        warnings.
      </div>
    </div>
  );
};
