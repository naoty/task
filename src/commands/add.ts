import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { readIndex, writeIndex } from "../index-file";
import { extractTaskIds } from "../task";

export async function add(title: string, taskDir: string): Promise<{ id: number }> {
  mkdirSync(taskDir, { recursive: true });

  const files = readdirSync(taskDir);
  const ids = extractTaskIds(files);
  const id = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  const content = `---\ntitle: ${title}\nstatus: todo\n---\n`;
  writeFileSync(resolve(taskDir, `${id}.md`), content);

  const index = readIndex(taskDir);
  index.push(id);
  writeIndex(taskDir, index);

  return { id };
}
