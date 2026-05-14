const ELLIPSIS = '...';

export const truncateText = (value: string, maxLength: number) => {
  if (maxLength <= 0) {
    return '';
  }

  if (value.length <= maxLength) {
    return value;
  }

  if (maxLength <= ELLIPSIS.length) {
    return value.slice(0, maxLength);
  }

  return `${value.slice(0, maxLength - ELLIPSIS.length)}${ELLIPSIS}`;
};

export const fitText = (value: string, width: number) =>
  truncateText(value, width).padEnd(Math.max(0, width));

export const truncatePath = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  if (maxLength <= ELLIPSIS.length + 4) {
    return truncateText(value, maxLength);
  }

  const tailLength = maxLength - ELLIPSIS.length;
  return `${ELLIPSIS}${value.slice(-tailLength)}`;
};
