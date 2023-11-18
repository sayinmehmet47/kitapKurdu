import { useEffect, useState } from 'react';
import { ReloadIcon } from '@radix-ui/react-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useLazySearchBooksQuery } from '../redux/services/book.api';
import { DataTable } from '../book-table/data-table';
import { columns } from '../book-table/column';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Form, FormControl, FormField, FormItem } from './ui/form';

const formSchema = z.object({
  name: z.string().min(2).max(50),
});

export const Search = () => {
  const [searchBook, { data: books, isLoading, isError }] =
    useLazySearchBooksQuery();
  const [page, setPage] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    searchBook({ name: values.name, page: 1 });
  }

  useEffect(() => {
    searchBook({ name: form.getValues('name'), page });
  }, [form, page, searchBook]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Something went wrong</div>;
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-96 mx-auto mt-6 flex items-center gap-2 my-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="
                    Search for a book example: 'George Orwell'
                    "
                    {...field}
                    className="w-96"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {!isLoading && <Button type="submit">Submit</Button>}
          {isLoading && (
            <Button type="submit" disabled>
              <ReloadIcon />
              Please wait
            </Button>
          )}
        </form>
      </Form>
      {books && (
        <DataTable
          columns={columns}
          data={books?.results}
          setPage={setPage}
          previous={books.previous}
          next={books.next}
        />
      )}
    </>
  );
};
