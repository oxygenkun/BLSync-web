import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { TaskList } from "./pages/TaskList";
import { AddTask } from "./pages/AddTask";
import { Settings } from "./pages/Settings";
import { About } from "./pages/About";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<TaskList />} />
            <Route path="/add" element={<AddTask />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
