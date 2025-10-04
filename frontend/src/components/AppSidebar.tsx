import { MessageSquare, MessageSquarePlus } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link, NavLink } from 'react-router-dom';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import {
  useTodaysChats,
  useYesterdaysChats,
  useWeekChats,
} from '@/hooks/api/useChat';
import type { Chat } from '@/services/types';

interface ChatItemProps {
  chat: Chat;
  isActive?: boolean;
}

const ChatItem = ({ chat, isActive }: ChatItemProps) => {
  return (
    <SidebarMenuItem>
      <NavLink to={`/chat/${chat.id}`}>
        {({ isActive: navIsActive }) => (
          <SidebarMenuButton
            className={cn(
              'flex items-center gap-3 px-4 py-2 rounded-md transition cursor-pointer w-full',
              navIsActive || isActive ? 'bg-muted' : 'hover:bg-muted'
            )}
          >
            <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm truncate flex-1 text-left">
              {chat.title || 'New Chat'}
            </span>
          </SidebarMenuButton>
        )}
      </NavLink>
    </SidebarMenuItem>
  );
};

export function AppSidebar() {
  const { language } = useTranslation();

  // Fetch chat history using existing hooks
  const { data: todaysChats = [], isLoading: loadingToday } = useTodaysChats();
  const { data: yesterdaysChats = [], isLoading: loadingYesterday } =
    useYesterdaysChats();
  const { data: weekChats = [], isLoading: loadingWeek } = useWeekChats();

  return (
    <Sidebar
      className="bg-background text-foreground border-r"
      side={language === 'en' ? 'left' : 'right'}
    >
      <SidebarContent className="flex flex-col h-full">
        {/* New Chat Button */}
        <div className="p-4">
          <Button
            variant="default"
            className="w-full justify-start gap-2"
            asChild
          >
            <Link to="/chat/new">
              <MessageSquarePlus className="w-4 h-4" />
              New Chat
            </Link>
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto">
          {/* Today's Chats */}
          {(loadingToday || todaysChats.length > 0) && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-muted-foreground uppercase px-4 pb-2">
                Today
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {loadingToday ? (
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    todaysChats.map((chat) => (
                      <ChatItem key={chat.id} chat={chat} />
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Yesterday's Chats */}
          {(loadingYesterday || yesterdaysChats.length > 0) && (
            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs text-muted-foreground uppercase px-4 pb-2">
                Yesterday
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {loadingYesterday ? (
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    yesterdaysChats.map((chat) => (
                      <ChatItem key={chat.id} chat={chat} />
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* This Week's Chats */}
          {(loadingWeek || weekChats.length > 0) && (
            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs text-muted-foreground uppercase px-4 pb-2">
                Previous 7 Days
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {loadingWeek ? (
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    weekChats.map((chat) => (
                      <ChatItem key={chat.id} chat={chat} />
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Empty State */}
          {!loadingToday &&
            !loadingYesterday &&
            !loadingWeek &&
            todaysChats.length === 0 &&
            yesterdaysChats.length === 0 &&
            weekChats.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start a new chat to begin</p>
              </div>
            )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
