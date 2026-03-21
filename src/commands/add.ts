import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export async function add(title: string, taskDir: string): Promise<{ id: number }> {
  mkdirSync(taskDir, { recursive: true });

  const files = readdirSync(taskDir);
  const ids = files
    .map((f) => f.match(/^(\d+)\.md$/))
    .filter((m) => m !== null)
    .map((m) => parseInt(m[1], 10));
  const id = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  const content = `---\ntitle: ${title}\nstatus: todo\n---\n`;
  writeFileSync(resolve(taskDir, `${id}.md`), content);

  const indexPath = resolve(taskDir, "index.json");
  let index: number[] = [];
  try {
    index = JSON.parse(readFileSync(indexPath, "utf-8"));
  } catch {
    // ファイルが存在しない場合は空配列のまま
  }
  index.push(id);
  writeFileSync(indexPath, JSON.stringify(index));

  return { id };
}
