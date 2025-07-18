import type { Person } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface TaskColumnsProps {
  people: Person[];
  onToggleTask: (personId: string, taskId: string) => void;
}

export function TaskColumns({ people, onToggleTask }: TaskColumnsProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold font-headline mb-4">Assigned Tasks</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {people.map((person) => (
          <Card key={person.id} className="flex flex-col shadow-md">
            <CardHeader>
              <CardTitle>{person.name}'s Tasks</CardTitle>
              <CardDescription>Active Workload: {person.totalHours.toFixed(1)} hours</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ScrollArea className="h-72 w-full">
                <div className="pr-4 space-y-4">
                  {person.tasks.length > 0 ? (
                    [...person.tasks]
                    .sort((a,b) => (a.isCompleted ? 1 : -1) - (b.isCompleted ? 1 : -1) || a.description.localeCompare(b.description))
                    .map((task) => (
                      <Card key={task.id} className={cn("border-l-4", task.isCompleted ? "border-transparent bg-muted/50" : "border-accent")}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center gap-2">
                             <div className="flex items-center gap-3 flex-1">
                                <Checkbox
                                  id={`task-${task.id}`}
                                  checked={task.isCompleted}
                                  onCheckedChange={() => onToggleTask(person.id, task.id)}
                                  aria-label="Mark task as complete"
                                />
                                <label
                                  htmlFor={`task-${task.id}`}
                                  className={cn("font-medium pr-2 break-words flex-1 cursor-pointer", task.isCompleted && "line-through text-muted-foreground")}
                                >
                                  {task.description}
                                </label>
                              </div>
                            <Badge variant={task.isCompleted ? "secondary" : "default"} className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 whitespace-nowrap">
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
