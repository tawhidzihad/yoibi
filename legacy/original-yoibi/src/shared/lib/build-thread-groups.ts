export function buildThreadGroups<T extends { replyTo?: number }>(items: T[]): T[][] {
  const groups: T[][] = [];
  let i = 0;
  while (i < items.length) {
    const item = items[i];
    if (!item.replyTo) {
      const thread: T[] = [item];
      let j = i + 1;
      while (j < items.length && items[j].replyTo) {
        thread.push(items[j]);
        j++;
      }
      groups.push(thread);
      i = j;
    } else {
      groups.push([item]);
      i++;
    }
  }
  return groups;
}
