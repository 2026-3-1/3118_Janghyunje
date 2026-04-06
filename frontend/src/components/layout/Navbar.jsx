import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import useThemeStore from '../../store/useThemeStore'
import useAuthStore from '../../store/useAuthStore'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { dark, toggle } = useThemeStore()
  const { user, logout } = useAuthStore()
  const dropdownRef = useRef(null)
  const savedColor = localStorage.getItem('avatarColor') || 'bg-indigo-500'

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const navLinks = [
    { path: '/',           label: '홈' },
    { path: '/lectures',   label: '강의 목록' },
    { path: '/community',  label: '커뮤니티' },
    { path: '/mypage',     label: '내 수강' },
  ]

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    navigate('/')
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white dark:bg-[#13161e] border-b border-gray-100 dark:border-[#1e2235]">
        <div className="flex items-center max-w-6xl gap-4 px-4 mx-auto" style={{height:'52px'}}>
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center justify-center text-xs font-bold text-white rounded-lg w-7 h-7 bg-brand-500">G</div>
            <span className="text-base font-extrabold tracking-tight text-brand-500">GCP</span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ path, label }) => (
              <Link key={path} to={path}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                  ${isActive(path)
                    ? 'text-brand-500 bg-brand-50 dark:bg-[#1e2235] font-medium'
                    : 'text-gray-500 dark:text-[#8892a4] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1a1d2e]'
                  }`}>
                {label}
              </Link>
            ))}
            {user?.role === 'coach' && (
              <Link to="/coach/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                  ${isActive('/coach')
                    ? 'text-brand-500 bg-brand-50 dark:bg-[#1e2235] font-medium'
                    : 'text-gray-500 dark:text-[#8892a4] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1a1d2e]'
                  }`}>
                수강 관리
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button onClick={toggle}
              className="w-8 h-8 rounded-lg border border-gray-200 dark:border-[#2a2d3e] bg-white dark:bg-[#1a1d2e]
                         flex items-center justify-center text-base hover:border-brand-400 transition-colors">
              {dark ? '☀️' : '🌙'}
            </button>

            {user ? (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1d2e] transition-colors"
                >
                  <div className={`w-6 h-6 rounded-full ${savedColor} flex items-center justify-center text-[11px] font-bold text-white select-none`}>
                    {user.nickname?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{user.nickname}</span>
                  {user.role === 'coach' && (
                    <span className="text-xs bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded-md font-medium">코치</span>
                  )}
                  <span className={`text-gray-400 text-xs transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>▾</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-[#1a1d2e] border border-gray-100 dark:border-[#2a2d3e] rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-50 dark:border-[#2a2d3e]">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-full ${savedColor} flex items-center justify-center text-sm font-bold text-white select-none shrink-0`}>
                          {user.nickname?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate dark:text-white">{user.nickname}</p>
                          <p className="text-xs text-gray-400 dark:text-[#6b7280] truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1.5">
                      <button onClick={() => { setDropdownOpen(false); navigate('/mypage') }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-[#13161e] hover:text-brand-500 transition-colors text-left">
                        <span className="text-base">📋</span> 내 수강 목록
                      </button>
                      <button onClick={() => { setDropdownOpen(false); navigate('/community') }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-[#13161e] hover:text-brand-500 transition-colors text-left">
                        <span className="text-base">💬</span> 커뮤니티
                      </button>
                      <button onClick={() => { setDropdownOpen(false); navigate('/profile') }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-[#13161e] hover:text-brand-500 transition-colors text-left">
                        <span className="text-base">⚙️</span> 프로필 설정
                      </button>
                      {user.role === 'coach' && (
                        <>
                          <button onClick={() => { setDropdownOpen(false); navigate('/coach/lecture/new') }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-[#13161e] hover:text-brand-500 transition-colors text-left">
                            <span className="text-base">➕</span> 강의 등록
                          </button>
                          <button onClick={() => { setDropdownOpen(false); navigate('/coach/dashboard') }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-[#13161e] hover:text-brand-500 transition-colors text-left">
                            <span className="text-base">🏆</span> 수강 신청 관리
                          </button>
                        </>
                      )}
                    </div>

                    <div className="border-t border-gray-50 dark:border-[#2a2d3e] py-1.5">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left">
                        <span className="text-base">🚪</span> 로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="items-center hidden gap-2 md:flex">
                <Link to="/login" className="px-3 py-1.5 text-sm text-gray-600 dark:text-[#8892a4] hover:text-brand-500 transition-colors">
                  로그인
                </Link>
                <Link to="/register" className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors">
                  회원가입
                </Link>
              </div>
            )}

            <button className="md:hidden p-2 text-gray-400 dark:text-[#8892a4] hover:text-gray-700 dark:hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}>
              <div className="space-y-1.5 w-5">
                <span className={`block h-0.5 bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block h-0.5 bg-current transition-all ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-[#1e2235] bg-white dark:bg-[#13161e] px-4 py-2">
            {navLinks.map(({ path, label }) => (
              <Link key={path} to={path} onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm transition-colors
                  ${isActive(path) ? 'text-brand-500' : 'text-gray-600 dark:text-[#8892a4] hover:text-gray-900 dark:hover:text-white'}`}>
                {label}
              </Link>
            ))}
            {user ? (
              <>
                <button onClick={() => { setMenuOpen(false); navigate('/profile') }}
                  className="block w-full text-left px-3 py-2.5 text-sm text-gray-600 dark:text-[#8892a4] hover:text-brand-500">
                  ⚙️ 프로필 설정
                </button>
                <button onClick={() => { handleLogout(); setMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2.5 text-sm text-red-500">
                  🚪 로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600 dark:text-[#8892a4]">로그인</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-brand-500 font-medium">회원가입</Link>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  )
}
