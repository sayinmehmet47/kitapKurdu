import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components';
import Layout from '@/components/Layout';
import {
  useGetBookByIdQuery,
  useUpdateBookMutation,
} from '@/redux/services/book.api';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateIcon } from '@radix-ui/react-icons';
import { Spinner } from 'flowbite-react';
import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';

export const BookEditPage: FC = () => {
  const router = useParams<{ bookId: string }>();
  const bookId = router.bookId;

  const { data: book, isLoading, isError } = useGetBookByIdQuery(bookId);
  const [updateBook, { isSuccess }] = useUpdateBookMutation();

  const formSchema = z.object({
    name: z.string().min(2, {
      message: 'name must be at least 2 characters.',
    }),
    language: z.string().min(2, {
      message: 'language must be at least 2 characters.',
    }),
  });

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      language: '',
    },
  });

  // Set form default values after book data is fetched
  useEffect(() => {
    if (book) {
      form.reset({
        name: book.name,
        language: book.language,
      });
    }
  }, [book, form]);

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    if (bookId) {
      updateBook({ id: bookId, ...values });
    }
  }
  useEffect(() => {
    if (isSuccess) {
      toast.success('Book updated successfully');
    }
  }, [isSuccess]);

  if (isError) {
    return <div>Error...</div>;
  }

  return (
    <Layout>
      {isLoading ? (
        <div className="h-screen w-full grid place-items-center">
          <Spinner />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Book Name</FormLabel>
                    <FormControl>
                      <Input placeholder="book name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="turkish">Turkish 🇹🇷</SelectItem>
                          <SelectItem value="english">English 🇬🇧</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <Button type="submit" variant="dark">
                Update
                <UpdateIcon className="ms-2" />
              </Button>
            </form>
          </Form>
        </div>
      )}
    </Layout>
  );
};
