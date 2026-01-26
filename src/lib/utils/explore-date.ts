export const toDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateShort = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year!, month! - 1, day);
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${month}/${day}(${dayOfWeek})`;
};

export const getTodayDate = (): string => toDateString(new Date());

export const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toDateString(tomorrow);
};

export const getWeekendDates = (): string[] => {
  const today = new Date();
  const dates: string[] = [];
  const dayOfWeek = today.getDay();
  if (dayOfWeek === 0) {
    dates.push(toDateString(today));
  } else if (dayOfWeek === 6) {
    dates.push(toDateString(today));
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + 1);
    dates.push(toDateString(sunday));
  } else {
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + (6 - dayOfWeek));
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    dates.push(toDateString(saturday));
    dates.push(toDateString(sunday));
  }
  return dates;
};

export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const getTodayDayKey = (): string => DAY_KEYS[new Date().getDay()]!;

export const getTomorrowDayKey = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return DAY_KEYS[tomorrow.getDay()]!;
};

export const getWeekendDayKeys = () => ['sat', 'sun'];

export const getDayKeyFromDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year!, month! - 1, day);
  return DAY_KEYS[date.getDay()]!;
};

export const isDateSelectable = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

export const generateCalendarDays = (currentMonth: Date): (Date | null)[] => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  return days;
};