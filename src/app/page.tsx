
"use client";

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Plus, Bot, User, PanelLeft, MessageSquare, Trash2, Pencil, Check, X, Paperclip, XCircle, Sparkles, FileText, Archive, ArchiveRestore } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

const GreyAiIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-8 w-8 text-primary"
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);


type Message = {
  role: 'user' | 'assistant';
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  isArchived?: boolean;
}

export default function Home() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<{url: string, name: string, type: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const [editingMessage, setEditingMessage] = useState<{ convoId: string; msgIndex: number; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Load conversations from localStorage on initial render
  useEffect(() => {
    try {
      const savedConversations = localStorage.getItem('conversations');
      if (savedConversations) {
        const parsedConversations: Conversation[] = JSON.parse(savedConversations);
        if (Array.isArray(parsedConversations) && parsedConversations.length > 0) {
          setConversations(parsedConversations);
          const activeConvo = parsedConversations.find(c => !c.isArchived);
          if (activeConvo) {
            setActiveConversationId(activeConvo.id);
          } else if (parsedConversations.some(c => c.isArchived)) {
            // If all are archived, show archived list by default
            setShowArchived(true);
            setActiveConversationId(parsedConversations.find(c => c.isArchived)!.id);
          } else {
            handleNewConversation();
          }
        } else {
          handleNewConversation();
        }
      } else {
          handleNewConversation();
      }
    } catch (error) {
      console.error("Failed to parse conversations from localStorage", error);
      handleNewConversation();
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
    setTimeout(scrollToBottom, 100);
  }, [messages, isLoading]);

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      isArchived: false,
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setShowArchived(false);
    setInput('');
    setFile(null);
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
        const nextConvo = newConversations.find(c => c.isArchived === showArchived) || newConversations.find(c => c.isArchived !== showArchived);
        if (nextConvo) {
             setActiveConversationId(nextConvo.id);
        } else {
             setActiveConversationId(null);
        }
      }
      return newConversations;
    });
  }

  const handleArchiveConversation = (id: string, archive: boolean) => {
    setConversations(prev => {
      const newConversations = prev.map(c => c.id === id ? { ...c, isArchived: archive } : c);
      if (activeConversationId === id && archive) {
        const nextActive = newConversations.find(c => !c.isArchived);
        if (nextActive) {
          setActiveConversationId(nextActive.id);
        } else {
          setActiveConversationId(null); 
          setShowArchived(true); // Switch to archived view if no active chats left
        }
      } else if (!archive) {
        // When unarchiving, ensure we switch back to the active view
        setShowArchived(false);
      }
      return newConversations;
    });
  };

  useEffect(() => {
    if (activeConversationId === null && conversations.length > 0) {
      const nextConvo = conversations.find(c => c.isArchived === showArchived) || conversations.find(c => c.isArchived !== showArchived);
      if (nextConvo) {
        setActiveConversationId(nextConvo.id);
        setShowArchived(!!nextConvo.isArchived);
      } else {
         handleNewConversation();
      }
    } else if (conversations.length === 0) {
        handleNewConversation();
    }
  }, [activeConversationId, conversations, showArchived]);


  const handleEditSubmit = async (convoId: string, msgIndex: number, newContent: string) => {
    if (!newContent.trim()) return;

    const originalConversations = conversations;
    setEditingMessage(null);
    setIsLoading(true);

    try {
        const targetConvo = conversations.find(c => c.id === convoId);
        if (!targetConvo) throw new Error("Conversation not found");
        
        const historyToResubmit = targetConvo.messages.slice(0, msgIndex);
        historyToResubmit.push({ role: 'user', content: newContent, fileUrl: null, fileName: null });

        setConversations(prev =>
            prev.map(c =>
                c.id === convoId
                    ? { ...c, messages: historyToResubmit }
                    : c
            )
        );

        const response = await getAiResponse(historyToResubmit);
        const assistantMessage: Message = { role: 'assistant', content: response };

        setConversations(prev =>
            prev.map(c =>
                c.id === convoId
                    ? { ...c, messages: [...historyToResubmit, assistantMessage] }
                    : c
            )
        );

    } catch (error) {
        console.error(error);
        setConversations(originalConversations);
        toast({
            variant: "destructive",
            title: "An error occurred",
            description: "Failed to get a response from the AI after editing. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  };


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!input.trim() && !file) || isLoading || !activeConversationId) return;

    const currentInput = input;
    const currentFile = file;
    const userMessage: Message = { 
      role: 'user', 
      content: currentInput, 
      fileUrl: currentFile?.url,
      fileName: currentFile?.name,
    };
    
    const tempConversationId = activeConversationId;
    const originalConversations = conversations;

    setConversations(prev => {
      const newConversations = prev.map(c => {
        if (c.id === tempConversationId) {
          const updatedMessages = [...c.messages, userMessage];
          const newTitle = c.messages.length === 0 ? currentInput.substring(0, 30) : c.title;
          return { ...c, messages: updatedMessages, title: newTitle === "New Chat" && updatedMessages.length === 1 ? currentInput.substring(0, 30) : newTitle }
        }
        return c;
      });
      return newConversations;
    });
    
    setInput('');
    setFile(null);
    setIsLoading(true);

    try {
      const currentConversation = conversations.find(c => c.id === tempConversationId);
      const updatedMessages = currentConversation ? [...currentConversation.messages, userMessage] : [userMessage];
      
      const response = await getAiResponse(updatedMessages);
      const assistantMessage: Message = { role: 'assistant', content: response };
       
       setConversations(prev => prev.map(c => 
        c.id === tempConversationId ? { ...c, messages: [...updatedMessages, assistantMessage] } : c
      ));

    } catch (error) {
       console.error(error);
       setConversations(originalConversations);
       setInput(currentInput); 
       setFile(currentFile);
       toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to get a response from the AI. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      if (uploadedFile.size > 4 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a file smaller than 4MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFile({
            url: reader.result as string,
            name: uploadedFile.name,
            type: uploadedFile.type
        });
      };
      reader.readAsDataURL(uploadedFile);
    }
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const isImage = (fileType: string) => fileType.startsWith('image/');

  const activeConvos = conversations.filter(c => !c.isArchived);
  const archivedConvos = conversations.filter(c => c.isArchived);

  const SidebarContent = () => (
     <div className="flex flex-col h-full bg-card border-r overflow-hidden">
        <div className="flex items-center justify-between gap-2 p-4 border-b shrink-0">
            <div className="flex items-center gap-2">
              <GreyAiIcon />
              <h1 className="text-2xl font-semibold tracking-tighter">GreyAI</h1>
            </div>
        </div>
        <div className="p-2 border-b shrink-0">
            <Button variant="outline" className="w-full justify-start text-base font-medium" onClick={handleNewConversation}>
              <Plus className="mr-2 h-5 w-5" />
              New Chat
            </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {(showArchived ? archivedConvos : activeConvos).map(convo => (
              <div key={convo.id} className="group relative">
                <Button
                    variant={activeConversationId === convo.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-base pl-3 pr-20 truncate"
                    onClick={() => handleSelectConversation(convo.id)}
                >
                    <MessageSquare className="mr-3 h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{convo.title}</span>
                </Button>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 h-8 flex items-center opacity-0 group-hover:opacity-100 bg-gradient-to-l from-card via-card to-transparent pl-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); handleArchiveConversation(convo.id, !convo.isArchived)}}>
                      {convo.isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </Button>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
              </div>
            ))}
          </div>
        </ScrollArea>
        {conversations.some(c => c.isArchived) && (
          <>
            <Separator />
            <div className="p-2">
              <Button variant="ghost" className="w-full justify-start text-base" onClick={() => setShowArchived(!showArchived)}>
                {showArchived ? <MessageSquare className="mr-2 h-5 w-5" /> : <Archive className="mr-2 h-5 w-5" />}
                {showArchived ? 'Back to Active Chats' : `View Archived (${archivedConvos.length})`}
              </Button>
            </div>
          </>
        )}
      </div>
  );


  return (
    <div className="flex h-screen bg-background text-foreground bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
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
        <aside className={cn("transition-all duration-300 ease-in-out h-full", isSidebarOpen ? 'w-80' : 'w-0')}>
           <SidebarContent />
        </aside>
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
         <Card className="flex-1 flex flex-col shadow-none rounded-none bg-transparent border-0 h-full">
            <CardHeader className="flex flex-row items-center p-4 border-b h-16 shrink-0 bg-background/80 backdrop-blur-sm">
                {!isMobile && (
                  <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    <PanelLeft size={24}/>
                  </Button>
                )}
                <div className="flex-1 ml-4">
                    <h2 className="text-lg font-semibold truncate">{activeConversation?.title}</h2>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-4 md:p-6 space-y-8">
                        {messages.length === 0 && !isLoading && (
                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full pt-20">
                                <Sparkles size={64} className="mb-4 text-primary opacity-50" />
                                <p className="text-2xl font-medium">Welcome to GreyAI</p>
                                <p>Start a conversation by typing or uploading a file below.</p>
                            </div>
                        )}
                        {messages.map((message, index) => {
                          const isEditing = editingMessage?.convoId === activeConversationId && editingMessage?.msgIndex === index;
                          return (
                            <div
                                key={index}
                                className={cn("flex items-start gap-4 animate-in fade-in group", 
                                  message.role === 'user' ? 'justify-end' : '')}
                            >
                                {message.role === 'assistant' && (
                                    <Avatar className="h-10 w-10 border-2 border-primary/40">
                                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={22}/></AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn("flex items-center gap-2", message.role === 'user' ? "flex-row-reverse" : "")}>
                                  <div
                                      className={cn("max-w-2xl rounded-2xl shadow-md w-full",
                                          !isEditing && "p-4",
                                          message.role === 'user'
                                              ? 'bg-primary text-primary-foreground'
                                              : 'bg-card border'
                                      )}
                                  >
                                      {isEditing ? (
                                        <div className="space-y-2 p-2">
                                          <Textarea 
                                            value={editingMessage.content}
                                            onChange={(e) => setEditingMessage({...editingMessage, content: e.target.value})}
                                            className="bg-background text-foreground text-base"
                                            rows={3}
                                          />
                                          <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => setEditingMessage(null)}><X className="h-5 w-5"/></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleEditSubmit(editingMessage.convoId, editingMessage.msgIndex, editingMessage.content)}><Check className="h-5 w-5"/></Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          {message.fileUrl && isImage(message.fileUrl.split(':')[1].split(';')[0]) && (
                                            <div className="mb-2">
                                              <Image src={message.fileUrl} alt="User upload" width={300} height={300} className="rounded-lg" />
                                            </div>
                                          )}
                                          {message.fileName && !isImage(message.fileUrl!.split(':')[1].split(';')[0]) && (
                                            <div className="mb-2 flex items-center gap-2 rounded-lg bg-black/10 p-2">
                                              <FileText className="h-6 w-6" />
                                              <span className="truncate font-medium">{message.fileName}</span>
                                            </div>
                                          )}
                                          <ReactMarkdown className="prose prose-sm sm:prose-base max-w-none text-current dark:prose-invert prose-p:my-2 prose-headings:my-4 prose-ol:my-2 prose-ul:my-2 prose-li:my-0">{message.content}</ReactMarkdown>
                                        </>
                                      )}
                                  </div>
                                  {message.role === 'user' && !message.fileUrl && (
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity self-start">
                                        {!isEditing && !isLoading && (
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingMessage({convoId: activeConversationId!, msgIndex: index, content: message.content })}>
                                              <Pencil className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                  )}
                                </div>
                                {message.role === 'user' && (
                                    <Avatar className="h-10 w-10 border bg-background">
                                        <AvatarFallback><User size={22}/></AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                          );
                        })}
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
            <CardFooter className="p-4 border-t bg-background/80 backdrop-blur-sm shrink-0">
                <div className="relative w-full max-w-3xl mx-auto">
                   {file && (
                     <div className="relative mb-2 p-2 border rounded-lg bg-muted/50 w-fit">
                        {isImage(file.type) ? (
                            <Image src={file.url} alt="Image preview" width={80} height={80} className="rounded-md" />
                        ) : (
                            <div className="flex items-center gap-3 p-2">
                               <FileText className="h-8 w-8 text-muted-foreground" />
                               <span className="text-sm font-medium text-muted-foreground max-w-xs truncate">{file.name}</span>
                            </div>
                        )}
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-3 -right-3 h-7 w-7 rounded-full"
                            onClick={() => setFile(null)}
                        >
                            <XCircle className="h-5 w-5" />
                        </Button>
                     </div>
                   )}
                  <form onSubmit={handleSubmit} className="flex items-center">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/webp, application/pdf" 
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || !!file}
                        className="mr-2"
                      >
                         <Paperclip className="h-6 w-6" />
                         <span className="sr-only">Attach a file</span>
                      </Button>
                      <Input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Type your message to GreyAI..."
                          disabled={isLoading || !activeConversationId}
                          className="w-full rounded-full h-14 pr-16 text-base bg-muted border-transparent focus-visible:ring-primary/50 focus-visible:border-primary"
                          autoComplete="off"
                      />
                      <Button type="submit" disabled={isLoading || (!input.trim() && !file) || !activeConversationId} size="icon" className="rounded-full absolute right-2.5 top-1/2 -translate-y-1/2 h-10 w-10">
                          <Send className="h-6 w-6" />
                          <span className="sr-only">Send message</span>
                      </Button>
                  </form>
                </div>
            </CardFooter>
        </Card>
      </main>
    </div>
  );
}
