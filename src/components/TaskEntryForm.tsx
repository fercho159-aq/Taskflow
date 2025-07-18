"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle } from 'lucide-react';
import type { Client } from '@/lib/types';

const tags = [{id: 'New Client', label: 'Cliente Nuevo'}, {id: 'Maintenance', label: 'Mantenimiento'}] as const;

const formSchema = z.object({
  description: z.string().min(1, 'La descripción de la tarea es requerida.'),
  duration: z.coerce.number().min(0.1, 'La duración debe ser de al menos 0.1 horas.'),
  clientId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const NONE_VALUE = "none";

interface TaskEntryFormProps {
  onAddTask: (description: string, duration: number, tags: ('New Client' | 'Maintenance')[], clientId?: string) => void;
  clients: Client[];
}

export function TaskEntryForm({ onAddTask, clients }: TaskEntryFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      duration: 1,
      clientId: NONE_VALUE,
      tags: [],
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const clientId = values.clientId === NONE_VALUE ? undefined : values.clientId;
    const selectedTags = (values.tags || []) as ('New Client' | 'Maintenance')[];
    onAddTask(values.description, values.duration, selectedTags, clientId);
    form.reset({ description: '', duration: 1, clientId: NONE_VALUE, tags: [] });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Descripción de la Tarea</FormLabel>
                <FormControl>
                  <Input placeholder="p. ej., Diseñar la nueva página de inicio" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Ninguno</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración (horas)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.5" placeholder="p. ej., 2.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Etiquetas</FormLabel>
                <FormDescription>
                  Selecciona las etiquetas para esta tarea.
                </FormDescription>
              </div>
              <div className="flex items-center space-x-4">
                {tags.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="tags"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir y Asignar Tarea
        </Button>
      </form>
    </Form>
  );
}
