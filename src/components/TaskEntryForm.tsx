"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle } from 'lucide-react';

const formSchema = z.object({
  description: z.string().min(1, 'Task description is required.'),
  duration: z.coerce.number().min(0.1, 'Duration must be at least 0.1 hours.'),
});

interface TaskEntryFormProps {
  onAddTask: (description: string, duration: number) => void;
}

export function TaskEntryForm({ onAddTask }: TaskEntryFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      duration: 1,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddTask(values.description, values.duration);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Task Description</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Design the new landing page" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (hours)</FormLabel>
              <FormControl>
                <Input type="number" step="0.5" placeholder="e.g., 2.5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="md:col-start-3 w-full">
          <PlusCircle className="mr-2 h-4 w-4" /> Add & Assign Task
        </Button>
      </form>
    </Form>
  );
}
