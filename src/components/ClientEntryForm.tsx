"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UserPlus } from 'lucide-react';

const formSchema = z.object({
  clientName: z.string().min(1, 'El nombre del cliente es requerido.'),
});

interface ClientEntryFormProps {
  onAddClient: (clientName: string) => void;
}

export function ClientEntryForm({ onAddClient }: ClientEntryFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddClient(values.clientName);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel>Nombre del Cliente</FormLabel>
              <FormControl>
                <Input placeholder="p. ej., Diseños Futura" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">
          <UserPlus className="mr-2 h-4 w-4" /> Añadir Cliente
        </Button>
      </form>
    </Form>
  );
}
