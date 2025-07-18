export interface Task {
  id: string;
  description: string;
  duration: number; // in hours
}

export interface Person {
  id: string;
  name: string;
  tasks: Task[];
  totalHours: number;
}
