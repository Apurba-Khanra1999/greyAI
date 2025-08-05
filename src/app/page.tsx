"use client";

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Plus, Bot, User, BrainCircuit, PanelLeft } from 'lucide-react';
import { getAiResponse } from './actions';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useIsMobile } from '@/hooks/use-mobile';


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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = useIsMobile();


  useEffect(() => {
    if(!isMobile) {
      setIsSidebarOpen(true)
    } else {
      setIsSidebarOpen(false)
    }
  }, [isMobile]);

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
    
    // Optimistically update the UI with the user's message
    setMessages((prev) => [...prev, userMessage]);
    
    setInput('');
    setIsLoading(true);

    try {
      const history = [...messages, userMessage];
      const response = await getAiResponse(history.slice(0, -1), currentInput);
      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
       console.error(error);
      // If the API call fails, remove the optimistic user message
      setMessages((prev) => prev.slice(0, prev.length - 1));
      setInput(currentInput); // Restore the input
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to get a response from the AI. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const SidebarContent = () => (
     <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-4">
            <BrainCircuit className="text-primary h-8 w-8" />
            <h1 className="text-2xl font-bold">IndigoChat</h1>
        </div>
        <div className="flex-1 mt-4 space-y-2 p-2">
           <Button variant="ghost" className="w-full justify-start text-base" onClick={handleNewConversation}>
              <Plus className="mr-2 h-5 w-5" />
              New Chat
            </Button>
        </div>
      </div>
  );


  return (
    <div className="flex h-screen bg-background text-foreground">
      {isMobile ? (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
             <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-10">
                <PanelLeft size={24}/>
             </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 bg-muted/40">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      ) : (
        <aside className={cn("transition-all duration-300 ease-in-out", isSidebarOpen ? 'w-80' : 'w-0')}>
           {isSidebarOpen && <SidebarContent />}
        </aside>
      )}

      <main className="flex-1 flex flex-col bg-card/40">
         <header className="flex items-center p-4 border-b h-16">
            {!isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                <PanelLeft size={24}/>
              </Button>
            )}
         </header>
          <div className="h-full flex flex-col p-4 md:p-6">
              <Card className="flex-1 flex flex-col shadow-none rounded-xl bg-transparent border-0">
                  <CardContent className="flex-1 p-0">
                      <ScrollArea className="h-full">
                          <div className="p-6 space-y-8">
                              {messages.length === 0 && !isLoading && (
                                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-20 h-full">
                                      <BrainCircuit size={64} className="mb-4 text-primary opacity-50" />
                                      <p className="text-2xl font-medium">Welcome to IndigoChat</p>
                                      <p>Start a conversation by typing a message below.</p>
                                  </div>
                              )}
                              {messages.map((message, index) => (
                                  <div
                                      key={index}
                                      className={cn("flex items-start gap-4 animate-in fade-in transition-all duration-300", 
                                        message.role === 'user' ? 'justify-end' : '')}
                                  >
                                      {message.role === 'assistant' && (
                                          <Avatar className="h-10 w-10 border-2 border-primary/40">
                                              <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={22}/></AvatarFallback>
                                          </Avatar>
                                      )}
                                      <div
                                          className={cn("max-w-2xl rounded-2xl p-4 shadow-sm",
                                              message.role === 'user'
                                                  ? 'bg-primary text-primary-foreground'
                                                  : 'bg-muted'
                                          )}
                                      >
                                          <p className="text-base leading-relaxed">{message.content}</p>
                                      </div>
                                      {message.role === 'user' && (
                                          <Avatar className="h-10 w-10 border">
                                              <AvatarFallback><User size={22}/></AvatarFallback>
                                          </Avatar>
                                      )}
                                  </div>
                              ))}
                              {isLoading && (
                                 <div className="flex items-start gap-4 animate-in fade-in">
                                   <Avatar className="h-10 w-10 border-2 border-primary/40">
                                      <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={22}/></AvatarFallback>
                                   </Avatar>
                                   <div className="max-w-md rounded-2xl p-4 bg-muted">
                                       <div className="flex items-center space-x-2">
                                           <span className="h-2.5 w-2.5 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                           <span className="h-2.5 w-2.5 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                           <span className="h-2.5 w-2.5 bg-primary rounded-full animate-pulse"></span>
                                       </div>
                                   </div>
                                 </div>
                              )}
                              <div ref={messagesEndRef} />
                          </div>
                      </ScrollArea>
                  </CardContent>
                  <CardFooter className="p-4 border-t-0 bg-transparent">
                      <div className="relative w-full max-w-3xl mx-auto">
                        <form onSubmit={handleSubmit}>
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message to IndigoChat..."
                                disabled={isLoading}
                                className="w-full rounded-full h-14 pr-16 text-base bg-muted focus-visible:ring-primary/50"
                                autoComplete="off"
                            />
                            <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="rounded-full absolute right-2.5 top-1/2 -translate-y-1/2 h-10 w-10">
                                <Send className="h-6 w-6" />
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
