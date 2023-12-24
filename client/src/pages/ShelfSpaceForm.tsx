import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/components';
import { Textarea } from '@/components/ui/textarea';
import {
  useAddMessageMutation,
  useDeleteMessageMutation,
} from '@/redux/services/messages.api';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { BiSend } from 'react-icons/bi';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import * as z from 'zod';

export const ShelfSpaceForm: FC = () => {
  const { _id: userId } = useSelector(
    (state: any) => state.authSlice.user.user
  );

  const [addMessage] = useAddMessageMutation();

  const formSchema = z.object({
    message: z.string().min(2, {
      message: 'Message must be at least 2 characters.',
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);

    try {
      addMessage({
        text: values.message,
        sender: userId,
      });
      toast.success('Message sent successfully');
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Message:</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your message here !!!"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" variant="default" className="w-full">
          <div className="flex gap-2 items-center">
            Submit
            <BiSend />
          </div>
        </Button>
      </form>
    </Form>
  );
};
