export const formatBytes = (value?: number): string => {
  if (!value || value <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const result = value / 1024 ** exponent;

  return `${result.toFixed(result >= 10 ? 0 : 1)} ${units[exponent]}`;
};

export const formatRelativeDate = (value?: string): string => {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86_400_000);

  if (days <= 0) {
    return 'Today';
  }

  if (days === 1) {
    return '1 day ago';
  }

  if (days < 30) {
    return `${days} days ago`;
  }

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};
