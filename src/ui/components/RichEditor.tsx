import { Markdown } from "@tiptap/markdown";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";

type Props = {
  content: string;
  onSave: (markdown: string) => void;
};

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-border-elevated">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded text-xs font-bold ${editor.isActive("bold") ? "bg-surface text-text" : "text-muted hover:text-text"}`}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded text-xs italic ${editor.isActive("italic") ? "bg-surface text-text" : "text-muted hover:text-text"}`}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-2 py-1 rounded text-xs line-through ${editor.isActive("strike") ? "bg-surface text-text" : "text-muted hover:text-text"}`}
      >
        S
      </button>
      <span className="w-px bg-border self-stretch mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 rounded text-xs font-semibold ${editor.isActive("heading", { level: 2 }) ? "bg-surface text-text" : "text-muted hover:text-text"}`}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2 py-1 rounded text-xs font-semibold ${editor.isActive("heading", { level: 3 }) ? "bg-surface text-text" : "text-muted hover:text-text"}`}
      >
        H3
      </button>
      <span className="w-px bg-border self-stretch mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded text-xs ${editor.isActive("bulletList") ? "bg-surface text-text" : "text-muted hover:text-text"}`}
      >
        •
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 rounded text-xs ${editor.isActive("orderedList") ? "bg-surface text-text" : "text-muted hover:text-text"}`}
      >
        1.
      </button>
      <span className="w-px bg-border self-stretch mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`px-2 py-1 rounded text-xs font-mono ${editor.isActive("code") ? "bg-surface text-text" : "text-muted hover:text-text"}`}
      >
        {"`"}
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-2 py-1 rounded text-xs ${editor.isActive("blockquote") ? "bg-surface text-text" : "text-muted hover:text-text"}`}
      >
        "
      </button>
    </div>
  );
}

export function RichEditor({ content, onSave }: Props) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content,
    contentType: "markdown",
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

  // contentが外部から変わったとき（別タスクを選択したとき）に更新する
  useEffect(() => {
    if (!editor) return;
    if (editor.getMarkdown() !== content) {
      editor.commands.setContent(content, false, {
        preserveWhitespace: "full",
      });
    }
  }, [editor, content]);

  if (!editor) return null;

  return (
    <div className="flex flex-col border border-border rounded-lg overflow-hidden">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
