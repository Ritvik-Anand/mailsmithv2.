'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Sparkles,
    Send,
    User,
    Bot,
    Loader2,
    TrendingUp,
    Target,
    Lightbulb,
    BarChart3,
    ArrowLeft,
    RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { askAIAssistant } from '@/server/actions/ai-assistant'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

const SUGGESTED_QUESTIONS = [
    { icon: TrendingUp, text: "How is my campaign performing?", category: "Performance" },
    { icon: Target, text: "Which leads are most engaged?", category: "Leads" },
    { icon: Lightbulb, text: "How can I improve my open rates?", category: "Tips" },
    { icon: BarChart3, text: "Give me a summary of my outreach", category: "Summary" },
]

export default function AIAssistantPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! I'm your MailSmith AI assistant. I can help you understand your campaign performance, analyze lead engagement, and provide recommendations to improve your outreach. What would you like to know?",
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

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
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await askAIAssistant(messageText)

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.success
                    ? response.answer!
                    : "I'm sorry, I encountered an error processing your request. Please try again.",
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, something went wrong. Please try again later.",
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const clearConversation = () => {
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: "Conversation cleared! How can I help you today?",
            timestamp: new Date()
        }])
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/portal">
                        <Button variant="ghost" size="icon" className="text-white/50 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-primary" />
                            AI Assistant
                        </h1>
                        <p className="text-sm text-white/50">Ask questions about your outreach performance</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={clearConversation}
                    className="text-white/50 border-white/10 hover:text-white"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    New Chat
                </Button>
            </div>

            {/* Chat Container */}
            <Card className="bg-white/[0.02] border-white/5 min-h-[500px] flex flex-col">
                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-y-auto max-h-[500px]">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                                        <Bot className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                            ? 'bg-primary text-white'
                                            : 'bg-white/5 text-white/90'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/60' : 'text-white/30'
                                        }`}>
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                {message.role === 'user' && (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                                        <User className="h-4 w-4 text-white/60" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                                    <Bot className="h-4 w-4 text-primary" />
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
                </CardContent>

                {/* Suggested Questions - Only show at start */}
                {messages.length === 1 && (
                    <div className="px-4 pb-4">
                        <p className="text-xs text-white/40 mb-3">Suggested questions:</p>
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTED_QUESTIONS.map((q, i) => (
                                <Button
                                    key={i}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSend(q.text)}
                                    className="text-white/70 border-white/10 hover:text-white hover:bg-white/5"
                                >
                                    <q.icon className="h-3 w-3 mr-2" />
                                    {q.text}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-white/5">
                    <div className="flex gap-3">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask about your campaigns, leads, or performance..."
                            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            disabled={isLoading}
                        />
                        <Button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="bg-primary hover:bg-primary/90"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-white/30 mt-2 text-center">
                        AI responses are based on your account data and general best practices
                    </p>
                </div>
            </Card>

            {/* Tips Card */}
            <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Pro Tips</p>
                            <p className="text-xs text-white/50 mt-1">
                                Ask specific questions for better insights. Try: "What's my best performing campaign?"
                                or "Which industry has the highest reply rate?"
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
