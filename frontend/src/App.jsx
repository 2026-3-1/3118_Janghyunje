import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0d0f14] text-gray-900 dark:text-slate-100">
        <Navbar />
        <GameTabs />
        <main className="flex-1">
          <Routes>
            <Route path="/"                                    element={<MainPage />} />
            <Route path="/lectures"                            element={<LectureListPage />} />
            <Route path="/lectures/:id"                        element={<LectureDetailPage />} />
            <Route path="/lectures/:lectureId/contents"        element={<LectureContentPage />} />
            <Route path="/lectures/:lectureId/manage"          element={<LectureContentManagePage />} />
            <Route path="/mypage"                              element={<MyPage />} />
            <Route path="/profile"                             element={<ProfilePage />} />
            <Route path="/login"                               element={<LoginPage />} />
            <Route path="/register"                            element={<RegisterPage />} />
            <Route path="/coach/dashboard"                     element={<CoachDashboard />} />
            <Route path="/coach/lecture/new"                   element={<LectureRegisterPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
