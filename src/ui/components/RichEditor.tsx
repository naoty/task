import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";

type Props = {
  content: string;
  onSave: (markdown: string) => void;
};

export function RichEditor({ content, onSave }: Props) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    onCreate: ({ editor: e }) => {
      e.commands.setContent(contentRef.current, false, {
        contentType: "markdown",
      });
    },
    editorProps: {
      attributes: {
        class: "outline-none",
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
    editor.commands.setContent(content, false, { contentType: "markdown" });
  }, [editor, content]);

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
