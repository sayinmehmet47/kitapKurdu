import { ReloadIcon } from '@radix-ui/react-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLazySearchBooksQuery } from '../redux/services/book.api';
import { columns } from '../book-table/column';
import { Input } from './ui/input';
import { Form, FormControl, FormField, FormItem } from './ui/form';
import { DataTable } from 'book-table/data-table';
import { Button, LoadingSpinner } from './ui';
import Layout from './Layout';

const formSchema = z.object({
  name: z.string().min(2).max(50),
});

export const Search = () => {
  const [searchBook, { data: books, isLoading, isError }] =
    useLazySearchBooksQuery();
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const bookName = searchParams.get('name');
  const bookPage = searchParams.get('page');

  const { setValue, getValues, control, handleSubmit, ...form } = useForm<
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setPage(1);
    setSearchParams({ name: values.name, page: page.toString() });
    searchBook({ name: values.name, page });
  }

  useEffect(() => {
    if (getValues('name')) {
      setSearchParams({ name: getValues('name'), page: page.toString() });
    }
    if (bookName) {
      setValue('name', bookName);
      searchBook({ name: bookName, page: parseInt(bookPage ?? '1') });
    }
  }, [
    getValues,
    page,
    setSearchParams,
    searchParams,
    searchBook,
    bookName,
    bookPage,
    setValue,
  ]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return <div>Something went wrong</div>;
  }

  return (
    <>
      <Form
        {...form}
        setValue={setValue}
        getValues={getValues}
        control={control}
        handleSubmit={handleSubmit}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-96 mx-auto mt-6 flex-col flex md:flex-row items-center gap-2 my-4"
        >
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="
                    Search for a book example: 'George Orwell'
                    "
                    {...field}
                    className="w-80"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {!isLoading && (
            <Button type="submit" className="w-80">
              Submit
            </Button>
          )}
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
