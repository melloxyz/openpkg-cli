export const clampIndex = (value: number, length: number) => {
  if (length <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(value, length - 1));
};

export const getWindowedRows = <TValue>(values: TValue[], selectedIndex: number, size: number) => {
  const pageSize = Math.max(1, size);

  if (values.length <= pageSize) {
    return values.map((value, index) => ({ value, index }));
  }

  const safeIndex = clampIndex(selectedIndex, values.length);
  const start = Math.floor(safeIndex / pageSize) * pageSize;

  return values.slice(start, start + pageSize).map((value, index) => ({
    value,
    index: start + index
  }));
};
