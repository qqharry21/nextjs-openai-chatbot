'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Message, useChat } from 'ai/react';
import { Bot, Download, Plus, Send, Trash, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type ChatSession = {
  id: string;
  name: string;
  messages: Message[];
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: handleChatSubmit,
    setMessages,
    isLoading,
  } = useChat();

  useEffect(() => {
    // Load chat sessions from local storage
    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) {
      setChatSessions(JSON.parse(savedSessions));
    }
  }, []);

  useEffect(() => {
    // Save chat sessions to local storage
    localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  const updateSessionTitle = useCallback((sessionId: string, newTitle: string) => {
    setChatSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId ? { ...session, name: newTitle } : session
      )
    );
  }, []);

  useEffect(() => {
    // Update the current session's messages and title
    if (currentSessionId) {
      setChatSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === currentSessionId ? { ...session, messages: messages } : session
        )
      );

      // Update the title based on the last AI response
      const lastAiMessage = messages.filter((m) => m.role === 'assistant').pop();
      if (lastAiMessage) {
        const newTitle = lastAiMessage.content.split(' ').slice(0, 5).join(' ') + '...';
        updateSessionTitle(currentSessionId, newTitle);
      }
    }
  }, [messages, currentSessionId, updateSessionTitle]);

  const createNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      name: `New Chat`,
      messages: [],
    };
    setChatSessions([...chatSessions, newSession]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session) {
      setMessages(session.messages);
    }
  };

  const deleteSession = (sessionId: string) => {
    setChatSessions((prevSessions) => prevSessions.filter((session) => session.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remainingSessions = chatSessions.filter((session) => session.id !== sessionId);
      if (remainingSessions.length > 0) {
        switchSession(remainingSessions[0].id);
      } else {
        setCurrentSessionId(null);
        setMessages([]);
      }
    }
    toast({
      title: 'Chat session deleted',
      description: 'The selected chat session has been removed.',
    });
  };

  const exportChatHistory = () => {
    const currentSession = chatSessions.find((session) => session.id === currentSessionId);
    if (currentSession) {
      const chatHistory = currentSession.messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n\n');
      const blob = new Blob([chatHistory], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_history_${currentSession.name}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Chat history exported',
        description: 'Your chat history has been downloaded as a text file.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentSessionId) {
      createNewSession();
    }
    await handleChatSubmit(e);
  };

  return (
    <>
      <Button
        className='fixed bottom-4 right-4 rounded-full p-4'
        onClick={() => setIsOpen(!isOpen)}>
        <Bot className='h-6 w-6' />
        <span className='sr-only'>Toggle chatbot</span>
      </Button>
      {isOpen && (
        <Card className='fixed bottom-20 right-4 w-[800px] h-[600px] flex flex-row'>
          {/* Sidebar */}
          <div className='w-1/4 border-r border-gray-200 p-4'>
            <Button
              onClick={createNewSession}
              className='w-full mb-4'>
              <Plus className='h-4 w-4 mr-2' /> New Chat
            </Button>
            <ScrollArea className='h-[500px]'>
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className='flex items-center mb-2'>
                  <Button
                    variant={currentSessionId === session.id ? 'secondary' : 'ghost'}
                    className='w-full justify-start mr-2 truncate'
                    onClick={() => switchSession(session.id)}>
                    {session.name}
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => deleteSession(session.id)}>
                    <Trash className='h-4 w-4' />
                    <span className='sr-only'>Delete session</span>
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Main chat area */}
          <div className='w-3/4 flex flex-col'>
            <CardHeader className='flex flex-row items-center'>
              <CardTitle>Chatbot</CardTitle>
              <Button
                variant='ghost'
                className='ml-auto mr-2'
                onClick={exportChatHistory}
                disabled={!currentSessionId}>
                <Download className='h-4 w-4 mr-2' />
                Export Chat
              </Button>
              <Button
                variant='ghost'
                onClick={() => setIsOpen(false)}>
                <X className='h-4 w-4' />
                <span className='sr-only'>Close</span>
              </Button>
            </CardHeader>
            <CardContent className='flex-grow overflow-hidden'>
              <ScrollArea className='h-[400px]'>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-2 mb-4 ${
                      message.role === 'assistant' ? 'justify-start' : 'justify-end'
                    }`}>
                    {message.role === 'assistant' && <Bot className='h-6 w-6 mt-1 text-blue-500' />}
                    <div
                      className={`rounded-lg p-2 ${
                        message.role === 'assistant' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                      {message.content}
                    </div>
                    {message.role === 'user' && <User className='h-6 w-6 mt-1 text-green-500' />}
                  </div>
                ))}
                {isLoading && (
                  <div className='flex items-start space-x-2 mb-4'>
                    <Bot className='h-6 w-6 mt-1 text-blue-500' />
                    <div className='rounded-lg p-2 bg-blue-100'>
                      <Skeleton className='h-4 w-[200px] mb-2' />
                      <Skeleton className='h-4 w-[150px] mb-2' />
                      <Skeleton className='h-4 w-[100px]' />
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <form
                onSubmit={handleSubmit}
                className='flex w-full space-x-2'>
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder='Type your message...'
                  disabled={isLoading}
                />
                <Button
                  type='submit'
                  disabled={isLoading}>
                  <Send className='h-4 w-4' />
                  <span className='sr-only'>Send</span>
                </Button>
              </form>
            </CardFooter>
          </div>
        </Card>
      )}
    </>
  );
}
