import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import GameTabs from './components/GameTabs'
import MainPage from './pages/MainPage'
import LectureListPage from './pages/LectureListPage'
import LectureDetailPage from './pages/LectureDetailPage'
import LectureContentPage from './pages/LectureContentPage'
import LectureContentManagePage from './pages/LectureContentManagePage'
import MyPage from './pages/MyPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CoachDashboard from './pages/CoachDashboard'
import LectureRegisterPage from './pages/LectureRegisterPage'
import CommunityPage from './pages/CommunityPage'
import CommunityDetailPage from './pages/CommunityDetailPage'
import CommunityWritePage from './pages/CommunityWritePage'
import GrowthPage from './pages/GrowthPage'
import CartPage from './pages/CartPage'
import useAuthStore from './store/useAuthStore'

function PrivateRoute({ children }) {
  const { user } = useAuthStore()
  return user ? children : <Navigate to="/login" replace />
}

function RoleRoute({ children, role }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0d0f14] text-gray-900 dark:text-slate-100">
        <Navbar />
        <GameTabs />
        <main className="flex-1">
          <Routes>
            {/* 공개 */}
            <Route path="/"                 element={<MainPage />} />
            <Route path="/lectures"         element={<LectureListPage />} />
            <Route path="/lectures/:id"     element={<LectureDetailPage />} />
            <Route path="/login"            element={<LoginPage />} />
            <Route path="/register"         element={<RegisterPage />} />
            <Route path="/community"        element={<CommunityPage />} />
            <Route path="/community/:id"    element={<CommunityDetailPage />} />

            {/* 로그인 필요 */}
            <Route path="/mypage"    element={<PrivateRoute><MyPage /></PrivateRoute>} />
            <Route path="/profile"   element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/cart"      element={<PrivateRoute><CartPage /></PrivateRoute>} />
            <Route path="/growth"    element={<PrivateRoute><GrowthPage /></PrivateRoute>} />
            <Route path="/community/write"    element={<PrivateRoute><CommunityWritePage /></PrivateRoute>} />
            <Route path="/community/edit/:id" element={<PrivateRoute><CommunityWritePage /></PrivateRoute>} />
            <Route path="/lectures/:lectureId/contents" element={<PrivateRoute><LectureContentPage /></PrivateRoute>} />

            {/* 코치 전용 */}
            <Route path="/coach/dashboard"          element={<RoleRoute role="coach"><CoachDashboard /></RoleRoute>} />
            <Route path="/coach/lecture/new"         element={<RoleRoute role="coach"><LectureRegisterPage /></RoleRoute>} />
            <Route path="/coach/lecture/edit/:id"    element={<RoleRoute role="coach"><LectureRegisterPage /></RoleRoute>} />
            <Route path="/lectures/:lectureId/manage" element={<RoleRoute role="coach"><LectureContentManagePage /></RoleRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
