export const getLocalISOString = (date?: Date): string => {
  const now = date ?? new Date();
  const offset = now.getTimezoneOffset();
  const localTime = new Date(now.getTime() - offset * 60 * 1000);
  return localTime.toISOString().slice(0, 16);
};
