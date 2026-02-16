import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useEffect } from "react";
import EditorToolbar from "./EditorToolbar";

interface MarkdownEditorProps {
  html: string;
  onChange: (html: string) => void;
}

export default function MarkdownEditor({ html, onChange }: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: html,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && html !== editor.getHTML()) {
      editor.commands.setContent(html);
    }
  }, [html]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden">
      <EditorToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose prose-invert prose-sm max-w-none p-4 min-h-[200px] focus:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[180px]"
      />
    </div>
  );
}
