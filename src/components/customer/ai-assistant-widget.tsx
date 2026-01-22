'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkles, X, Send, Minimize2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

const suggestedQuestions = [
    "How are my campaigns performing?",
    "What's my reply rate this month?",
    "Generate a weekly report",
    "Which campaign has the best results?",
]

export function AiAssistantWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
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

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        // TODO: Implement actual AI chat API call
        // For now, simulate a response
        setTimeout(() => {
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm analyzing your data... This is a placeholder response. The full AI integration will be implemented in Phase 3.",
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, assistantMessage])
            setIsLoading(false)
        }, 1500)
    }

    const handleSuggestedQuestion = (question: string) => {
        setInput(question)
    }

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105 z-50"
            >
                <Sparkles className="h-6 w-6" />
                <span className="sr-only">Open AI Assistant</span>
            </Button>
        )
    }

    return (
        <Card className={cn(
            "fixed z-50 flex flex-col bg-black/95 border-white/10 shadow-2xl transition-all duration-300",
            isExpanded
                ? "bottom-0 right-0 w-full h-full md:bottom-4 md:right-4 md:w-[500px] md:h-[700px] md:rounded-2xl"
                : "bottom-4 right-4 w-[380px] h-[500px] rounded-2xl"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">AI Assistant</h3>
                        <p className="text-xs text-white/40">Powered by Claude</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
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
                                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                                    message.role === 'user'
                                        ? "bg-primary text-white"
                                        : "bg-white/5 text-white/90"
                                )}
                            >
                                {message.content}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                            </div>
                            <div className="bg-white/5 rounded-2xl px-4 py-3">
                                <div className="flex gap-1">
                                    <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Suggested Questions (only show when few messages) */}
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
            <div className="p-4 border-t border-white/10">
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
        </Card>
    )
}
