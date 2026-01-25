'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkles, X, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { askAIAssistant } from '@/server/actions/ai-assistant'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

const suggestedQuestions = [
    "How are my campaigns performing?",
    "What's my reply rate this month?",
    "Which campaign has the best results?",
    "How can I improve my open rates?",
]

export function AiAssistantWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm your MailSmith AI Assistant. I can answer questions about your campaigns, leads, and performance metrics. How can I help you today?",
            timestamp: new Date(),
        }
    ])
    const [isLoading, setIsLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Only render portal on client side
    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (question?: string) => {
        const messageText = question || input.trim()
        if (!messageText || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await askAIAssistant(messageText)
            console.log('[AI Widget] Response:', response)

            let content: string
            if (response.success && response.answer) {
                content = response.answer
            } else if (response.success && !response.answer) {
                content = "I received your question but couldn't generate a response. Please try asking in a different way."
            } else {
                content = `I encountered an error: ${response.error || 'Unknown error'}. Please try again.`
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content,
                timestamp: new Date(),
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (error: any) {
            console.error('[AI Widget] Error:', error)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Something went wrong: ${error.message || 'Unknown error'}`,
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSuggestedQuestion = (question: string) => {
        handleSend(question)
    }

    const clearConversation = () => {
        setMessages([{
            id: '1',
            role: 'assistant',
            content: "Conversation cleared! How can I help you today?",
            timestamp: new Date(),
        }])
    }

    // Don't render anything on server
    if (!mounted) return null

    const widgetContent = (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99999 }}>
            {/* Tab Handle - Always visible on right edge */}
            <button
                onClick={() => setIsOpen(true)}
                style={{ pointerEvents: 'auto' }}
                className={cn(
                    "fixed right-0 top-1/2 -translate-y-1/2",
                    "flex items-center gap-2 py-4 px-2 rounded-l-xl",
                    "bg-gradient-to-r from-primary to-primary/80 text-white",
                    "shadow-lg shadow-primary/30 hover:shadow-primary/50",
                    "transition-all duration-300 hover:px-3",
                    "border border-r-0 border-white/10",
                    isOpen && "opacity-0 pointer-events-none"
                )}
            >
                <Sparkles className="h-5 w-5" />
                <span className="writing-vertical text-xs font-medium tracking-wider">AI ASSISTANT</span>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    style={{ pointerEvents: 'auto' }}
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Slide-out Panel */}
            <div
                style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
                className={cn(
                    "fixed right-0 top-0 h-full w-[400px]",
                    "bg-black border-l border-white/10",
                    "shadow-2xl shadow-black/50",
                    "transform transition-transform duration-300 ease-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">AI Assistant</h3>
                            <p className="text-xs text-white/40">Ask me anything</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => clearConversation()}
                            className="text-xs px-3 py-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="h-10 w-10 flex items-center justify-center text-white bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                            aria-label="Close AI Assistant"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <ScrollArea className="h-[calc(100vh-180px)] p-4">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-3",
                                    message.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {message.role === 'assistant' && (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                                        message.role === 'user'
                                            ? "bg-primary text-white"
                                            : "bg-white/5 text-white/90"
                                    )}
                                >
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                    <p className={cn(
                                        "text-xs mt-2",
                                        message.role === 'user' ? "text-white/60" : "text-white/30"
                                    )}>
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                                </div>
                                <div className="bg-white/5 rounded-2xl px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        <span className="text-sm text-white/50">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested Questions */}
                    {messages.length <= 2 && !isLoading && (
                        <div className="mt-6 space-y-2">
                            <p className="text-xs text-white/40 mb-3">Suggested questions:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSuggestedQuestion(question)}
                                        className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-primary/50 hover:bg-primary/10 transition-colors"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </ScrollArea>

                {/* Input */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSend()
                        }}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your campaigns..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="h-12 w-12 rounded-xl shrink-0"
                            disabled={!input.trim() || isLoading}
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            </div>

            {/* Vertical text CSS */}
            <style jsx>{`
                .writing-vertical {
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                }
            `}</style>
        </div>
    )

    // Use portal to render directly to body
    return createPortal(widgetContent, document.body)
}
