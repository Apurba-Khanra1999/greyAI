"use client";

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Plus, Bot, User, BrainCircuit } from 'lucide-react';
import { getAiResponse } from './actions';
import { useToast } from "@/hooks/use-toast";

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleNewConversation = () => {
    setMessages([]);
    setInput('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input;
    const userMessage: Message = { role: 'user', content: currentInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getAiResponse(currentInput);
      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => prev.slice(0, prev.length - 1));
      setInput(currentInput);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to get a response from the AI. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-64 flex-col border-r bg-muted/20 p-4 hidden md:flex">
        <div className="flex items-center gap-2 p-2">
            <BrainCircuit className="text-primary h-6 w-6" />
            <h1 className="text-xl font-bold">IndigoChat</h1>
        </div>
        <div className="flex-1 mt-8 space-y-2">
           <Button variant="ghost" className="w-full justify-start" onClick={handleNewConversation}>
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
          <div className="h-full flex flex-col p-4 md:p-6">
              <Card className="flex-1 flex flex-col shadow-none rounded-xl bg-card border-0">
                  <CardContent className="flex-1 p-0">
                      <ScrollArea className="h-full">
                          <div className="p-6 space-y-6">
                              {messages.length === 0 && !isLoading && (
                                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-20">
                                      <BrainCircuit size={48} className="mb-4 text-primary opacity-50" />
                                      <p className="text-lg font-medium">Welcome to IndigoChat</p>
                                      <p>Start a conversation by typing a message below.</p>
                                  </div>
                              )}
                              {messages.map((message, index) => (
                                  <div
                                      key={index}
                                      className={`flex items-start gap-4 animate-in fade-in transition-all duration-300 ${message.role === 'user' ? 'justify-end' : ''}`}
                                  >
                                      {message.role === 'assistant' && (
                                          <Avatar className="h-9 w-9 border-2 border-primary/20">
                                              <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20}/></AvatarFallback>
                                          </Avatar>
                                      )}
                                      <div
                                          className={`max-w-xl rounded-xl p-3 shadow-sm ${
                                              message.role === 'user'
                                                  ? 'bg-primary text-primary-foreground'
                                                  : 'bg-secondary'
                                          }`}
                                      >
                                          <p className="text-sm leading-relaxed">{message.content}</p>
                                      </div>
                                      {message.role === 'user' && (
                                          <Avatar className="h-9 w-9 border">
                                              <AvatarFallback><User size={20}/></AvatarFallback>
                                          </Avatar>
                                      )}
                                  </div>
                              ))}
                              {isLoading && (
                                 <div className="flex items-start gap-4 animate-in fade-in">
                                   <Avatar className="h-9 w-9 border-2 border-primary/20">
                                      <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20}/></AvatarFallback>
                                   </Avatar>
                                   <div className="max-w-md rounded-xl p-3 bg-secondary">
                                       <div className="flex items-center space-x-2">
                                           <span className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                           <span className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                           <span className="h-2 w-2 bg-primary rounded-full animate-pulse"></span>
                                       </div>
                                   </div>
                                 </div>
                              )}
                              <div ref={messagesEndRef} />
                          </div>
                      </ScrollArea>
                  </CardContent>
                  <CardFooter className="p-4 border-t-0 bg-background/95 backdrop-blur-sm">
                      <div className="relative w-full">
                        <form onSubmit={handleSubmit}>
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message to IndigoChat..."
                                disabled={isLoading}
                                className="w-full rounded-full h-12 pr-14 focus-visible:ring-primary bg-muted"
                                autoComplete="off"
                            />
                            <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="rounded-full absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9">
                                <Send className="h-5 w-5" />
                                <span className="sr-only">Send message</span>
                            </Button>
                        </form>
                      </div>
                  </CardFooter>
              </Card>
          </div>
      </main>
    </div>
  );
}
