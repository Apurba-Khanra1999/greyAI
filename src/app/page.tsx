"use client";

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, PlusCircle, Bot, User, BrainCircuit } from 'lucide-react';
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
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-2">
            <BrainCircuit className="text-primary h-6 w-6" />
            <h1 className="text-xl font-bold font-headline">IndigoChat</h1>
        </div>
        <Button variant="outline" onClick={handleNewConversation}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
      </header>

      <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col p-4 md:p-6">
              <Card className="flex-1 flex flex-col shadow-lg rounded-xl">
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
                                                  : 'bg-card border'
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
                                   <div className="max-w-md rounded-xl p-3 bg-card border">
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
                  <CardFooter className="p-4 border-t">
                      <form onSubmit={handleSubmit} className="w-full flex items-center gap-4">
                          <Input
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              placeholder="Type your message to IndigoChat..."
                              disabled={isLoading}
                              className="flex-1 rounded-full focus-visible:ring-primary"
                              autoComplete="off"
                          />
                          <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="rounded-full">
                              <Send className="h-5 w-5" />
                              <span className="sr-only">Send message</span>
                          </Button>
                      </form>
                  </CardFooter>
              </Card>
          </div>
      </main>
    </div>
  );
}
