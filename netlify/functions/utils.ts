function calculateDueDate(duration: number, startDate = new Date()): Date {
  const HOURS_PER_DAY = 8;
  const MS_PER_HOUR = 60 * 60 * 1000;
  
  // Si la tarea empieza después de las 5 PM, empezar al siguiente día a las 9 AM
  let currentDate = new Date(startDate);
  if (currentDate.getHours() >= 17) {
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(9, 0, 0, 0);
  } else if (currentDate.getHours() < 9) {
    // Si la tarea empieza antes de las 9 AM, empezar a las 9 AM del mismo día
    currentDate.setHours(9, 0, 0, 0);
  }

  let remainingHours = duration;
  
  while (remainingHours > 0) {
    // Verificar si es fin de semana
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Si es fin de semana, saltar al siguiente día laboral
      currentDate.setDate(currentDate.getDate() + (dayOfWeek === 0 ? 1 : 2));
      currentDate.setHours(9, 0, 0, 0);
      continue;
    }

    const currentHour = currentDate.getHours();
    
    // Si estamos fuera del horario laboral (9 AM - 5 PM)
    if (currentHour < 9) {
      currentDate.setHours(9, 0, 0, 0);
      continue;
    }
    if (currentHour >= 17) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(9, 0, 0, 0);
      continue;
    }

    // Calcular horas restantes en el día actual
    const hoursLeftInDay = 17 - currentHour;
    const hoursToAdd = Math.min(hoursLeftInDay, remainingHours);
    
    currentDate = new Date(currentDate.getTime() + (hoursToAdd * MS_PER_HOUR));
    remainingHours -= hoursToAdd;
    
    // Si quedan horas después del día laboral, pasar al siguiente día
    if (remainingHours > 0 && currentDate.getHours() >= 17) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(9, 0, 0, 0);
    }
  }

  return currentDate;
}

export { calculateDueDate };
