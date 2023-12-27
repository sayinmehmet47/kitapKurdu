import { CardHeader, CardContent, Card } from '@/components/ui/card';
import emailjs from '@emailjs/browser';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BiSend } from 'react-icons/bi';
import { toast } from 'sonner';

export function ContactUs() {
  const formSchema = z.object({
    name: z.string().min(2, {
      message: 'Name must be at least 2 characters.',
    }),
    email: z.string().email({
      message: 'Please enter a valid email address.',
    }),
    feedback: z.string().min(2, {
      message: 'Feedback must be at least 2 characters.',
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      feedback: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    emailjs
      .send(
        process.env.REACT_APP_PUBLIC_EMAILJS_SERVICE_ID as string,
        process.env.REACT_APP_PUBLIC_EMAILJS_TEMPLATE_ID as string,
        {
          name: values.name,
          email: values.email,
          feedback: values.feedback,
        },
        process.env.REACT_APP_PUBLIC_EMAILJS_PUBLIC_KEY as string
      )
      .then(
        (result) => {
          console.log(result.text);
        },
        (error) => {
          console.log(error.text);
        }
      );

    form.reset();

    toast.success('Feedback sent successfully');
  }
  return (
    <Layout>
      <main className="container mx-auto px-2 py-10">
        <div className="flex flex-col space-y-8">
          <h1 className="text-4xl font-bold text-center">Contact Us</h1>
          <p className="text-lg text-gray-500 text-center">
            We would love to hear your feedback and suggestions. Please fill out
            the form below.
          </p>
          <div className="max-w-2xl mx-auto">
            <Card className="p-6 space-y-4">
              <CardHeader>
                <h2 className="text-2xl font-semibold">Feedback Form</h2>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                  >
                    <div className="space-y-3 md:w-[400px]">
                      <div className="space-y-1">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Name:</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Email:</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your email"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <FormField
                          control={form.control}
                          name="feedback"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Feedback:</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Write your feedback here !!!"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        variant="default"
                        className="w-full"
                      >
                        <div className="flex gap-2 items-center">
                          Submit
                          <BiSend />
                        </div>
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </Layout>
  );
}
