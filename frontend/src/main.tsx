import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import { AuthProvider } from "./context/Authcontext"
import ProtectedRoute from "./components/layout/ProtectedRoute"
import { Dashboard } from "./pages/Dashboard"
import '../styles/globals.css'  
import AcademiejarenPage from "./pages/AcademiejarenPage"
import EvenementenPage from "./pages/EvenementenPage"
import DataAnalysePage from "./pages/DataAnalysePage"
import TrashPage from "./pages/TrashPage"
import Matthias from "./pages/Matthias"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/academiejaren",
        element: <AcademiejarenPage />,
      },
      {
        path: "/evenementen",
        element: <EvenementenPage  />,
      },
      {
        path: "/analyse", 
        element: <DataAnalysePage />,
      },
      {
        path: "/prullenbak",
        element: <TrashPage />,
      },      
      {
        path: "/matthias",
        element: <Matthias />,
      },      
    ],
  },
])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
)