export type Task = {
  id: number;
  title: string;
  status: string;
};

export function extractTaskIds(files: string[]): number[] {
  return files
    .map((f) => f.match(/^(\d+)\.md$/))
    .filter((m) => m !== null)
    .map((m) => parseInt(m[1], 10));
}
