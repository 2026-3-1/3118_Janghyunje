import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import GameTabs from './components/GameTabs'
import useAuthStore from './store/useAuthStore'

import MainPage from './pages/MainPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

const LectureListPage          = lazy(() => import('./pages/LectureListPage'))
const LectureDetailPage        = lazy(() => import('./pages/LectureDetailPage'))
const LectureContentPage       = lazy(() => import('./pages/LectureContentPage'))
const LectureContentManagePage = lazy(() => import('./pages/LectureContentManagePage'))
const LectureRegisterPage      = lazy(() => import('./pages/LectureRegisterPage'))
const MyPage                   = lazy(() => import('./pages/MyPage'))
const ProfilePage              = lazy(() => import('./pages/ProfilePage'))
const CoachDashboard           = lazy(() => import('./pages/CoachDashboard'))
const CommunityPage            = lazy(() => import('./pages/CommunityPage'))
const CommunityDetailPage      = lazy(() => import('./pages/CommunityDetailPage'))
const CommunityWritePage       = lazy(() => import('./pages/CommunityWritePage'))
const GrowthPage               = lazy(() => import('./pages/GrowthPage'))
const CartPage                 = lazy(() => import('./pages/CartPage'))
const CheckoutPage             = lazy(() => import('./pages/CheckoutPage'))
const CheckoutSuccessPage      = lazy(() => import('./pages/CheckoutSuccessPage'))
const CheckoutFailPage         = lazy(() => import('./pages/CheckoutFailPage'))
const AdminDashboard           = lazy(() => import('./pages/AdminDashboard'))
const LectureQnAPage           = lazy(() => import('./pages/LectureQnAPage'))
const LectureQnADetailPage     = lazy(() => import('./pages/LectureQnADetailPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user } = useAuthStore()
  return user ? children : <Navigate to="/login" replace />
}

function RoleRoute({ children, role }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (Array.isArray(role) ? !role.includes(user.role) : user.role !== role)
    return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0d0f14] text-gray-900 dark:text-slate-100">
        <Navbar />
        <GameTabs />
        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* 공개 */}
              <Route path="/"              element={<MainPage />} />
              <Route path="/lectures"      element={<LectureListPage />} />
              <Route path="/lectures/:id"  element={<LectureDetailPage />} />
              <Route path="/login"         element={<LoginPage />} />
              <Route path="/register"      element={<RegisterPage />} />
              <Route path="/community"     element={<CommunityPage />} />
              <Route path="/community/:id" element={<CommunityDetailPage />} />

              {/* 결제 성공/실패 — 토스 리다이렉트용 (PrivateRoute 밖에 있어야 함) */}
              <Route path="/checkout/success" element={<PrivateRoute><CheckoutSuccessPage /></PrivateRoute>} />
              <Route path="/checkout/fail"    element={<CheckoutFailPage />} />

              {/* 로그인 필요 */}
              <Route path="/mypage"    element={<PrivateRoute><MyPage /></PrivateRoute>} />
              <Route path="/profile"   element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="/cart"      element={<PrivateRoute><CartPage /></PrivateRoute>} />
              <Route path="/checkout"  element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
              <Route path="/growth"    element={<PrivateRoute><GrowthPage /></PrivateRoute>} />
              <Route path="/community/write"    element={<PrivateRoute><CommunityWritePage /></PrivateRoute>} />
              <Route path="/community/edit/:id" element={<PrivateRoute><CommunityWritePage /></PrivateRoute>} />
              <Route path="/lectures/:lectureId/contents"    element={<PrivateRoute><LectureContentPage /></PrivateRoute>} />
              <Route path="/lectures/:lectureId/qna"         element={<PrivateRoute><LectureQnAPage /></PrivateRoute>} />
              <Route path="/lectures/:lectureId/qna/:postId" element={<PrivateRoute><LectureQnADetailPage /></PrivateRoute>} />

              {/* 코치 전용 */}
              <Route path="/coach/dashboard"            element={<RoleRoute role="coach"><CoachDashboard /></RoleRoute>} />
              <Route path="/coach/lecture/new"           element={<RoleRoute role="coach"><LectureRegisterPage /></RoleRoute>} />
              <Route path="/coach/lecture/edit/:id"      element={<RoleRoute role="coach"><LectureRegisterPage /></RoleRoute>} />
              <Route path="/lectures/:lectureId/manage"  element={<RoleRoute role="coach"><LectureContentManagePage /></RoleRoute>} />

              {/* 관리자 전용 */}
              <Route path="/admin" element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
