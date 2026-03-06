'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Link as LinkIcon
} from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
    content: string
    onChange: (html: string) => void
    onFocus?: () => void
    placeholder?: string
    disabled?: boolean
}

export function RichTextEditor({ content, onChange, onFocus, placeholder, disabled }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({
                placeholder: placeholder || 'Write your reply...',
                emptyEditorClass: 'is-editor-empty',
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
        ],
        content,
        editorProps: {
            attributes: {
                class: cn(
                    'tiptap prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] px-4 pt-3 pb-1 text-sm text-foreground/80',
                    disabled && 'opacity-50 cursor-not-allowed'
                ),
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        onFocus,
        editable: !disabled,
    })

    // Update content if changed externally (i.e. reset after send)
    useEffect(() => {
        if (editor && content === '' && editor.getHTML() !== '<p></p>') {
            editor.commands.setContent('')
        }
    }, [content, editor])

    const setLink = useCallback(() => {
        if (!editor) return
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        if (url === null) {
            return
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    if (!editor) {
        return null
    }

    return (
        <div className="flex flex-col w-full h-full">
            <EditorContent editor={editor} className="flex-1 overflow-y-auto" />

            {/* Toolbar */}
            <div className="flex items-center gap-1 border-t border-foreground/5 bg-foreground/[0.02] px-3 py-2">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={disabled}
                    className={cn('p-1.5 rounded hover:bg-foreground/10 transition-colors', editor.isActive('bold') && 'bg-foreground/10 text-foreground')}
                    type="button"
                >
                    <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={disabled}
                    className={cn('p-1.5 rounded hover:bg-foreground/10 transition-colors', editor.isActive('italic') && 'bg-foreground/10 text-foreground')}
                    type="button"
                >
                    <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    disabled={disabled}
                    className={cn('p-1.5 rounded hover:bg-foreground/10 transition-colors', editor.isActive('underline') && 'bg-foreground/10 text-foreground')}
                    type="button"
                >
                    <UnderlineIcon className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-4 bg-foreground/10 mx-1" />
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    disabled={disabled}
                    className={cn('p-1.5 rounded hover:bg-foreground/10 transition-colors', editor.isActive('bulletList') && 'bg-foreground/10 text-foreground')}
                    type="button"
                >
                    <List className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    disabled={disabled}
                    className={cn('p-1.5 rounded hover:bg-foreground/10 transition-colors', editor.isActive('orderedList') && 'bg-foreground/10 text-foreground')}
                    type="button"
                >
                    <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-4 bg-foreground/10 mx-1" />
                <button
                    onClick={setLink}
                    disabled={disabled}
                    className={cn('p-1.5 rounded hover:bg-foreground/10 transition-colors', editor.isActive('link') && 'bg-foreground/10 text-foreground')}
                    type="button"
                >
                    <LinkIcon className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}
