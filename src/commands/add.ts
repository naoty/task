import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { parseFrontmatter, serializeFrontmatter } from "../frontmatter";
import type { Index } from "../index-file";
import { getParentKey, readIndex, writeIndex } from "../index-file";
import { extractTaskIds } from "../task";

function revertDoneAncestors(
  parentId: number,
  index: Index,
  taskDir: string,
): void {
  const parentFile = resolve(taskDir, `${parentId}.md`);
  if (!existsSync(parentFile)) return;

  const content = readFileSync(parentFile, "utf-8");
  const fields = parseFrontmatter(content);
  if (fields.status !== "done") return;

  const bodyMatch = content.match(/^---\n[\s\S]*?\n---\n\n?([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1] : "";
  fields.status = "doing";
  writeFileSync(parentFile, serializeFrontmatter(fields, body));

  const grandParentKey = getParentKey(index, parentId);
  if (grandParentKey && grandParentKey !== "root") {
    revertDoneAncestors(Number(grandParentKey), index, taskDir);
  }
}

export async function add(
  title: string,
  taskDir: string,
  parentId?: number,
  body?: string,
): Promise<{ id: number }> {
  mkdirSync(taskDir, { recursive: true });

  const files = readdirSync(taskDir);
  const ids = extractTaskIds(files);
  const id = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  const content = serializeFrontmatter({ title, status: "todo" }, body ?? "");
  writeFileSync(resolve(taskDir, `${id}.md`), content);

  const index = readIndex(taskDir);

  if (parentId !== undefined) {
    const parentFile = resolve(taskDir, `${parentId}.md`);
    if (!existsSync(parentFile)) {
      throw new Error(`Task ${parentId} not found`);
    }
    if (getParentKey(index, parentId) === null) {
      throw new Error(`Task ${parentId} is archived`);
    }
    const parentChildren = index.children[String(parentId)] ?? [];
    writeIndex(taskDir, {
      ...index,
      children: {
        ...index.children,
        [String(parentId)]: [...parentChildren, id],
      },
    });
    revertDoneAncestors(parentId, index, taskDir);
  } else {
    const rootChildren = index.children.root ?? [];
    writeIndex(taskDir, {
      ...index,
      children: { ...index.children, root: [...rootChildren, id] },
    });
  }

  return { id };
}
