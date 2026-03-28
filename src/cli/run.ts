import cac from "cac";
import { version } from "../../package.json" with { type: "json" };
import { add } from "../commands/add";
import { archive } from "../commands/archive";
import { deleteTask } from "../commands/delete";
import { depAdd } from "../commands/dep-add";
import { depDelete } from "../commands/dep-delete";
import { list } from "../commands/list";
import { moveTask } from "../commands/move";
import { next } from "../commands/next";
import { serve } from "../commands/serve";
import { updateTask } from "../commands/update";

class ExitSignal {
  constructor(
    public output: string,
    public exitCode: number,
  ) {}
}

export async function runCli(
  args: string[],
  taskDir: string,
): Promise<{ output: string; exitCode: number }> {
  function respondSuccess(result: unknown): never {
    throw new ExitSignal(JSON.stringify({ ok: true, result }), 0);
  }

  function respondError(
    message: string,
    usage: string | null = null,
    extra: Record<string, unknown> = {},
  ): never {
    throw new ExitSignal(
      JSON.stringify({
        ok: false,
        error: { message, usage, retriable: false, ...extra },
      }),
      1,
    );
  }

  function respondException(e: unknown): never {
    if (e instanceof ExitSignal) throw e;
    respondError(e instanceof Error ? e.message : String(e));
  }

  const cli = cac("task");

  cli.option("-v, --version", "バージョンを表示する");
  cli.option("-h, --help", "コマンド一覧を表示する");

  cli
    .command("add [title]", "タスクを作成する")
    .option("--parent <id>", "親タスクのID")
    .option("--body <content>", "タスクの本文")
    .action(async (title?: string, options: { parent?: string; body?: string } = {}) => {
      if (!title) respondError("title is required", "task add <title>");

      try {
        const parentId = options.parent !== undefined ? parseInt(options.parent, 10) : undefined;
        const result = await add(title, taskDir, parentId, options.body);
        respondSuccess(result);
      } catch (e) {
        respondException(e);
      }
    });

  cli.command("next", "次にやるべきタスクを返す").action(async () => {
    const result = await next(taskDir);
    respondSuccess(result);
  });

  cli.command("list", "タスク一覧を表示する").action(async () => {
    const result = await list(taskDir);
    respondSuccess(result);
  });

  cli
    .command("serve", "Webサーバーを起動する")
    .option("--port <number>", "ポート番号", { default: 3000 })
    .action(async (options: { port: number } = { port: 3000 }) => {
      serve(options.port, taskDir);
      // サーバーは起動し続けるため、永続的に待機する
      await new Promise<never>(() => {});
    });

  cli.command("archive", "完了タスクをアーカイブする").action(async () => {
    const result = await archive(taskDir);
    respondSuccess(result);
  });

  cli.command("delete [id]", "タスクを削除する").action(async (id?: string) => {
    if (!id) respondError("id is required", "task delete <id>");

    try {
      const result = await deleteTask(parseInt(id, 10), taskDir);
      respondSuccess(result);
    } catch (e) {
      respondException(e);
    }
  });

  cli
    .command("update [id]", "タスクを更新する")
    .allowUnknownOptions()
    .action(async (id?: string, options: Record<string, unknown> = {}) => {
      if (!id) {
        respondError("id is required", "task update <id> --<field> <value> [--<field> <value>...]");
      }

      const {
        help: _help,
        h: _h,
        version: _version,
        v: _v,
        "--": _rest,
        ...updates
      } = options as Record<string, unknown>;
      const stringUpdates = Object.fromEntries(
        Object.entries(updates).map(([k, val]) => [k, String(val)]),
      );

      if (Object.keys(stringUpdates).length === 0) {
        respondError(
          "at least one option is required",
          "task update <id> --<field> <value> [--<field> <value>...]",
        );
      }

      try {
        const task = await updateTask(parseInt(id, 10), stringUpdates, taskDir);
        respondSuccess({ task });
      } catch (e) {
        respondException(e);
      }
    });

  cli
    .command("move [id] [number]", "タスクの優先順位・親タスクを変更する")
    .option("--parent <parent-id>", "新しい親タスクのID")
    .action(async (id?: string, number?: string, options: { parent?: string } = {}) => {
      if (!id) respondError("id is required", "task move <id> [<number>] [--parent <parent-id>]");

      try {
        const parentId = options.parent !== undefined ? parseInt(options.parent, 10) : undefined;
        const task = await moveTask(
          parseInt(id, 10),
          {
            number: number !== undefined ? parseInt(number, 10) : undefined,
            parentId,
          },
          taskDir,
        );
        respondSuccess({ task });
      } catch (e) {
        respondException(e);
      }
    });

  cli
    .command("dep [subcommand] [id] [...depIds]", "依存関係を管理する")
    .allowUnknownOptions()
    .action(async (subcommand?: string, id?: string, depIds: string[] = []) => {
      if (subcommand === "add") {
        if (!id || depIds.length === 0) {
          respondError("id and dependency-id are required", "task dep add <id> <dependency-id>...");
        }

        try {
          const result = await depAdd(
            parseInt(id, 10),
            depIds.map((d) => parseInt(d, 10)),
            taskDir,
          );
          respondSuccess(result);
        } catch (e) {
          respondException(e);
        }
      } else if (subcommand === "delete") {
        if (!id || depIds.length === 0) {
          respondError(
            "id and dependency-id are required",
            "task dep delete <id> <dependency-id>...",
          );
        }

        try {
          const result = await depDelete(
            parseInt(id, 10),
            depIds.map((d) => parseInt(d, 10)),
            taskDir,
          );
          respondSuccess(result);
        } catch (e) {
          respondException(e);
        }
      } else {
        respondError("subcommand is required", "task dep <subcommand>", {
          subcommands: [
            { name: "add", description: "依存関係を追加する" },
            { name: "delete", description: "依存関係を削除する" },
          ],
        });
      }
    });

  const subcommands = [
    { name: "add", description: "タスクを作成する" },
    { name: "next", description: "次にやるべきタスクを返す" },
    { name: "list", description: "タスク一覧を表示する" },
    { name: "archive", description: "完了タスクをアーカイブする" },
    { name: "delete", description: "タスクを削除する" },
    { name: "update", description: "タスクを更新する" },
    { name: "move", description: "タスクの優先順位・親タスクを変更する" },
    { name: "dep", description: "依存関係を管理する" },
    { name: "serve", description: "Webサーバーを起動する" },
  ];

  cli.command("").action(() => {
    respondError("command is required", "task <subcommand>", { subcommands });
  });

  try {
    const { options: parsedOptions } = cli.parse(["node", "task", ...args], {
      run: false,
    });

    if (parsedOptions.version) {
      return { output: version, exitCode: 0 };
    }

    if (parsedOptions.help) {
      respondSuccess({ usage: "task <subcommand>", subcommands });
    }

    await cli.runMatchedCommand();
  } catch (e) {
    if (e instanceof ExitSignal) {
      return { output: e.output, exitCode: e.exitCode };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return {
      output: JSON.stringify({
        ok: false,
        error: { message: msg, usage: null, retriable: false },
      }),
      exitCode: 1,
    };
  }

  return { output: "", exitCode: 0 };
}
