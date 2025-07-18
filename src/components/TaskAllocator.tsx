"use client";

import { useState } from 'react';
import type { Person, Task } from '@/lib/types';
import { TaskEntryForm } from './TaskEntryForm';
import { WorkloadDashboard } from './WorkloadDashboard';
import { TaskColumns } from './TaskColumns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const initialPeople: Person[] = [
  { id: '1', name: 'Omar', tasks: [], totalHours: 0 },
  { id: '2', name: 'Fernando', tasks: [], totalHours: 0 },
  { id: '3', name: 'Julio', tasks: [], totalHours: 0 },
];

export function TaskAllocator() {
  const [people, setPeople] = useState<Person[]>(initialPeople);

  const handleAddTask = (taskDescription: string, taskDuration: number) => {
    // Find person with the least workload
    const personWithLeastWorkload = [...people].sort(
      (a, b) => a.totalHours - b.totalHours
    )[0];

    const newTask: Task = {
      id: crypto.randomUUID(),
      description: taskDescription,
      duration: taskDuration,
    };

    setPeople((currentPeople) =>
      currentPeople.map((person) => {
        if (person.id === personWithLeastWorkload.id) {
          const updatedTasks = [...person.tasks, newTask];
          return {
            ...person,
            tasks: updatedTasks,
            totalHours: person.totalHours + taskDuration,
          };
        }
        return person;
      })
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold font-headline" style={{ color: 'hsl(var(--primary))' }}>TaskFlow Allocator</h1>
          <p className="text-muted-foreground mt-2">Intelligently assign tasks based on workload.</p>
        </header>

        <main className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Add a New Task</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskEntryForm onAddTask={handleAddTask} />
            </CardContent>
          </Card>

          <WorkloadDashboard people={people} />

          <TaskColumns people={people} />
        </main>
      </div>
    </div>
  );
}
