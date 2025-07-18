import type { Person } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface TaskColumnsProps {
  people: Person[];
}

export function TaskColumns({ people }: TaskColumnsProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold font-headline mb-4">Assigned Tasks</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {people.map((person) => (
          <Card key={person.id} className="flex flex-col shadow-md">
            <CardHeader>
              <CardTitle>{person.name}'s Tasks</CardTitle>
              <CardDescription>Total: {person.totalHours.toFixed(1)} hours</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ScrollArea className="h-72 w-full">
                <div className="pr-4 space-y-4">
                  {person.tasks.length > 0 ? (
                    person.tasks.map((task) => (
                      <Card key={task.id} className="border-l-4 border-accent">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-medium pr-2 break-words flex-1">{task.description}</p>
                            <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 whitespace-nowrap">
                              {task.duration}h
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground rounded-lg border-2 border-dashed h-60">
                      <p>No tasks assigned yet.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
