import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sun,
  Moon,
  MessageCircle,
  LogIn,
  UserPlus,
  Globe,
  LogOut,
} from 'lucide-react';
import { SidebarTrigger } from './ui/sidebar';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const { language, setLanguage, t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat');

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleTheme = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Left: Sidebar + Brand */}
        <div className="flex items-center gap-4">
          {isChatPage && <SidebarTrigger />}
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <span className="text-xl font-bold tracking-tight">
              <span className="text-primary">AI</span> Chatbot
            </span>
          </Link>
        </div>

        {/* Center: Navigation (only on landing page) */}
        {!isChatPage && (
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium hover:text-primary transition"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/chat"
              className="text-sm font-medium hover:text-primary transition"
            >
              {t('nav.chat')}
            </Link>
          </nav>
        )}

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="hover:bg-muted transition px-3"
          >
            <Globe className="h-4 w-4 me-1" />
            {language.toUpperCase()}
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-muted transition"
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Chat Link (only on landing page) */}
          {!isChatPage && (
            <Button asChild size="sm" className="ms-2">
              <Link to="/chat">
                <MessageCircle className="h-4 w-4 me-1" />
                {t('nav.startChat')}
              </Link>
            </Button>
          )}

          {/* Auth Controls */}
          <div className="hidden sm:flex items-center gap-2 ms-2">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, {user?.username}
                </span>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="hover:shadow-sm"
                >
                  <LogOut className="h-4 w-4 me-1" />
                  {t('nav.signOut')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="hover:shadow-sm"
                >
                  <Link to="/login">
                    <LogIn className="h-4 w-4 me-1" />
                    {t('nav.signIn')}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="hover:shadow-sm"
                >
                  <Link to="/signup">
                    <UserPlus className="h-4 w-4 me-1" />
                    {t('nav.signUp')}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
