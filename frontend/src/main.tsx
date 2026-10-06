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
import Ticketing from "./pages/Ticketing"
import QRGenerator from "./pages/qr/QRGenerator"
import PublicEventsPage from "./pages/public/PublicEventsPage"
import PublicEventDetailPage from "./pages/public/PublicEventDetailPage"
import PublicTicketPage from "./pages/public/PublicTicketPage"
import PublicCancelPage from "./pages/public/PublicCancelPage"
import PublicPastEventsPage from "./pages/public/PublicPastEventsPage"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  // Public ticketing — home is "/" (afcgent-tickettool)
  {
    path: "/",
    element: <PublicEventsPage />,
  },
  {
    path: "/inschrijven",
    element: <Navigate to="/" replace />,
  },
  {
    path: "/inschrijven/afgelopen",
    element: <Navigate to="/afgelopen" replace />,
  },
  {
    path: "/events/:slug",
    element: <PublicEventDetailPage />,
  },
  {
    path: "/inschrijven/:slug",
    element: <PublicEventDetailPage />,
  },
  {
    path: "/afgelopen",
    element: <PublicPastEventsPage />,
  },
  {
    path: "/ticket/:eventSlug/:token",
    element: <PublicTicketPage />,
  },
  {
    path: "/uitschrijven/:token",
    element: <PublicCancelPage />,
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
        element: <EvenementenPage />,
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
        path: "/ticketing",
        element: <Ticketing />,
      },
      {
        path: "/qrgenerator",
        element: <QRGenerator />,
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
