import * as _sort from 'fast-sort';
// This is a workaround for this issue: https://github.com/snovakovic/fast-sort/issues/34
export const arraySort = (_sort as unknown) as typeof _sort.default;

export function hoursToMilliseconds(hours: number): number {
   return hours * 60 * 60 * 1000;
}
