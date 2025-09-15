
import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// 懒加载页面组件
const HomePage = lazy(() => import('@/pages/home/index'))
const LoginPage = lazy(() => import('@/pages/auth/Login'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const AboutPage = lazy(() => import('@/pages/about/index'))
const ProfilePage = lazy(() => import('@/pages/profile/index'))
const RepositoryLayout = lazy(() => import('@/components/layout/RepositoryLayout/index'))
const RepositoryDetailPage = lazy(() => import('@/pages/repository/RepositoryDetailPage/index'))
const DocumentPage = lazy(() => import('@/pages/repository/DocumentPage/index'))

// 加载组件
const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
)

const routes = [
  {
    path: "/",
    element: (
      <Suspense fallback={<Loading />}>
        <HomePage />
      </Suspense>
    ),
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<Loading />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/register",
    element: (
      <Suspense fallback={<Loading />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    path: "/settings",
    element: (
      <Suspense fallback={<Loading />}>
        <SettingsPage />
      </Suspense>
    ),
  },
  {
    path: "/about",
    element: (
      <Suspense fallback={<Loading />}>
        <AboutPage />
      </Suspense>
    ),
  },
  {
    path: "/profile",
    element: (
      <Suspense fallback={<Loading />}>
        <ProfilePage />
      </Suspense>
    ),
  },
  {
    path: "/:owner/:name",
    element: (
      <Suspense fallback={<Loading />}>
        <RepositoryLayout />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loading />}>
            <RepositoryDetailPage />
          </Suspense>
        ),
      },
      {
        path: "*",
        element: (
          <Suspense fallback={<Loading />}>
            <DocumentPage />
          </Suspense>
        ),
      },
    ]
  },
]

export default routes