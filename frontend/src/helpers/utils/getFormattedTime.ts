export const getFormattedTime = (date: Date | null) => {
  if (!date) return "Never";
  return date.toLocaleTimeString();
};
