import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DocumentProvider } from "@/contexts/DocumentContext";
import AuthGuard from "./components/AuthGuard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Documents from "./pages/Documents";
import AIPrompt from "./pages/AIPrompt";
import CreateCourse from "./pages/CreateCourse";
import Courses from "./pages/Courses";
import CourseView from "./pages/CourseView";
import NotFound from "./pages/NotFound";
import AdminGuard from "./components/AdminGuard";
import UsersPage from "./pages/Users";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RoleProvider>
        <LanguageProvider>
          <DocumentProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<AuthGuard><Index /></AuthGuard>} />
                <Route path="/documents" element={<AuthGuard><Documents /></AuthGuard>} />
                <Route path="/ai-prompt" element={<AuthGuard><AIPrompt /></AuthGuard>} />
                <Route path="/create-course" element={<AuthGuard><CreateCourse /></AuthGuard>} />
                <Route path="/courses" element={<AuthGuard><Courses /></AuthGuard>} />
                <Route path="/courses/:id" element={<AuthGuard><CourseView /></AuthGuard>} />
                <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                <Route path="/users" element={<AuthGuard><AdminGuard><UsersPage/></AdminGuard></AuthGuard> } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DocumentProvider>
        </LanguageProvider>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
