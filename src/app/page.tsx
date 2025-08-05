
"use client";

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Plus, Bot, User, BrainCircuit, PanelLeft, MessageSquare, Trash2 } from 'lucide-react';
import { getAiResponse } from './actions';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useIsMobile } from '@/hooks/use-mobile';
import ReactMarkdown from 'react-markdown';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
}

export default function Home() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  // Load conversations from localStorage on initial render
  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      const parsedConversations: Conversation[] = JSON.parse(savedConversations);
      setConversations(parsedConversations);
      if (parsedConversations.length > 0) {
        setActiveConversationId(parsedConversations[0].id);
      }
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('conversations', JSON.stringify(conversations));
    } else {
      localStorage.removeItem('conversations');
    }
  }, [conversations]);


  useEffect(() => {
    if(!isMobile) {
      setIsSidebarOpen(true)
    } else {
      setIsSidebarOpen(false)
    }
  }, [isMobile]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const messages = activeConversation?.messages ?? [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setInput('');
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => {
      const newConversations = prev.filter(c => c.id !== id);
      if (activeConversationId === id) {
        setActiveConversationId(newConversations.length > 0 ? newConversations[0].id : null);
      }
      return newConversations;
    });
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !activeConversationId) return;

    const currentInput = input;
    const userMessage: Message = { role: 'user', content: currentInput };
    
    const updatedMessages = [...messages, userMessage];
    
    setConversations(prev => prev.map(c => 
      c.id === activeConversationId ? { ...c, messages: updatedMessages, title: c.messages.length === 0 ? currentInput.substring(0, 30) : c.title } : c
    ));
    
    setInput('');
    setIsLoading(true);

    try {
      const response = await getAiResponse(updatedMessages);
      const assistantMessage: Message = { role: 'assistant', content: response };
       setConversations(prev => prev.map(c => 
        c.id === activeConversationId ? { ...c, messages: [...updatedMessages, assistantMessage] } : c
      ));

    } catch (error) {
       console.error(error);
       setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, messages } : c));
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
     <div className="flex flex-col h-full bg-muted/40">
        <div className="flex items-center justify-between gap-2 p-4 border-b">
            <div className="flex items-center gap-2">
              <BrainCircuit className="text-primary h-8 w-8" />
              <h1 className="text-2xl font-bold">IndigoChat</h1>
            </div>
        </div>
        <div className="p-2">
            <Button variant="outline" className="w-full justify-start text-base" onClick={handleNewConversation}>
              <Plus className="mr-2 h-5 w-5" />
              New Chat
            </Button>
        </div>
        <ScrollArea className="flex-1">
           <div className="p-2 space-y-1">
             {conversations.map(convo => (
               <div key={convo.id} className="group relative">
                <Button
                    variant={activeConversationId === convo.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-base pl-3 pr-10 truncate"
                    onClick={() => handleSelectConversation(convo.id)}
                >
                    <MessageSquare className="mr-3 h-5 w-5" />
                    <span className="truncate">{convo.title}</span>
                </Button>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100">
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this conversation.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteConversation(convo.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
               </div>
             ))}
           </div>
        </ScrollArea>
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
          <SheetContent side="left" className="p-0 w-80">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      ) : (
        <aside className={cn("transition-all duration-300 ease-in-out h-full border-r", isSidebarOpen ? 'w-80' : 'w-0 hidden')}>
           {isSidebarOpen && <SidebarContent />}
        </aside>
      )}

      <main className="flex-1 flex flex-col bg-card/40">
         <header className="flex items-center p-4 border-b h-16">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <PanelLeft size={24}/>
            </Button>
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
                                      <p>Start a conversation or select one from the sidebar.</p>
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
                                          className={cn("max-w-2xl rounded-2xl p-4 shadow-sm prose-invert prose-p:my-0",
                                              message.role === 'user'
                                                  ? 'bg-primary text-primary-foreground'
                                                  : 'bg-muted'
                                          )}
                                      >
                                          <ReactMarkdown className="prose dark:prose-invert max-w-none text-base leading-relaxed">{message.content}</ReactMarkdown>
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
                  <CardFooter className="p-4 border-t bg-transparent">
                      <div className="relative w-full max-w-3xl mx-auto">
                        <form onSubmit={handleSubmit}>
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message to IndigoChat..."
                                disabled={isLoading || !activeConversationId}
                                className="w-full rounded-full h-14 pr-16 text-base bg-muted focus-visible:ring-primary/50"
                                autoComplete="off"
                            />
                            <Button type="submit" disabled={isLoading || !input.trim() || !activeConversationId} size="icon" className="rounded-full absolute right-2.5 top-1/2 -translate-y-1/2 h-10 w-10">
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

    