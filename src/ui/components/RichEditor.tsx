import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { useEffect, useRef } from "react";

const lowlight = createLowlight(common);

type Props = {
  content: string;
  onSave: (markdown: string) => void;
};

export function RichEditor({ content, onSave }: Props) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Markdown,
    ],
    content,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: "outline-none",
        spellcheck: "false",
      },
    },
    onUpdate: ({ editor: e }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        onSave(e.getMarkdown());
      }, 800);
    },
  });

  // 別タスクを選択したとき（contentが外部から変わったとき）に更新する
  useEffect(() => {
    if (!editor) return;
    if (editor.getMarkdown() === content) return;
    editor.commands.setContent(content, {
      contentType: "markdown",
      emitUpdate: false,
    });
  }, [editor, content]);

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
