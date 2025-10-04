import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LandingLayout from './components/LandingLayout';
import ChatLayout from './components/ChatLayout';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TranslationProvider } from './i18n/TranslationContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (
          (error as any)?.response?.status === 401 ||
          (error as any)?.response?.status === 403
        ) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page Routes */}
            <Route path="/" element={<LandingLayout />}>
              <Route index element={<LandingPage />} />
            </Route>

            {/* Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Chat Routes - Protected */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ChatPage />} />
              <Route path=":chat_uid" element={<ChatPage />} />
              <Route path="new" element={<ChatPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TranslationProvider>
    </QueryClientProvider>
  );
}

export default App;
