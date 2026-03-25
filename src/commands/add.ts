import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { readIndex, writeIndex } from "../index-file";
import { extractTaskIds } from "../task";

export async function add(
  title: string,
  taskDir: string,
  parentId?: number,
): Promise<{ id: number }> {
  mkdirSync(taskDir, { recursive: true });

  const files = readdirSync(taskDir);
  const ids = extractTaskIds(files);
  const id = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  const content = `---\ntitle: ${title}\nstatus: todo\n---\n`;
  writeFileSync(resolve(taskDir, `${id}.md`), content);

  const index = readIndex(taskDir);

  if (parentId !== undefined) {
    const parentFile = resolve(taskDir, `${parentId}.md`);
    if (!existsSync(parentFile)) {
      throw new Error(`Task ${parentId} not found`);
    }
    const parentChildren = index.children[String(parentId)] ?? [];
    writeIndex(taskDir, {
      ...index,
      children: { ...index.children, [String(parentId)]: [...parentChildren, id] },
    });
  } else {
    const rootChildren = index.children["root"] ?? [];
    writeIndex(taskDir, {
      ...index,
      children: { ...index.children, root: [...rootChildren, id] },
    });
  }

  return { id };
}
