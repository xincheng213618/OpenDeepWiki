import './App.css'
import { ThemeProvider } from "@/components/theme-provider"
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import routes from './routes'


function App() {

  return (
    <ThemeProvider>
      <RouterProvider router={createBrowserRouter(routes)} />
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  )
}

export default App
