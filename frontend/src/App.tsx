import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingLayout from './components/LandingLayout';
import ChatLayout from './components/ChatLayout';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { TranslationProvider } from './i18n/TranslationContext';

function App() {
  return (
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

          {/* Chat Routes */}
          <Route path="/chat" element={<ChatLayout />}>
            <Route index element={<ChatPage />} />
            <Route path=":chat_uid" element={<ChatPage />} />
            <Route path="new" element={<ChatPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TranslationProvider>
  );
}

export default App;
