import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import useThemeStore from '../../store/useThemeStore'
import useAuthStore from '../../store/useAuthStore'
import api from '../../services/api'

export default function Navbar() {
  const location = useNavigate()
  const navigate  = useNavigate()
  const loc       = useLocation()
  const [menuOpen, setMenuOpen]         = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [cartCount, setCartCount]       = useState(0)
  const { dark, toggle } = useThemeStore()
  const { user, logout } = useAuthStore()
  const dropdownRef = useRef(null)
  const savedColor  = localStorage.getItem('avatarColor') || 'bg-indigo-500'

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!user || !token || user.role !== 'student') { setCartCount(0); return }
    api.get('/cart')
      .then(res => setCartCount((res.data.data || []).length))
      .catch(() => {})
  }, [user, loc.pathname])

  const isActive = (path) =>
    path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(path)

  const handleLogout = () => {
    logout(); setDropdownOpen(false); navigate('/')
  }

  const navLink = (path, label) => (
    <Link key={path} to={path}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors
        ${isActive(path)
          ? 'text-brand-500 bg-brand-50 dark:bg-[#1e2235] font-medium'
          : 'text-gray-500 dark:text-[#8892a4] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1a1d2e]'}`}>
      {label}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-[#13161e] border-b border-gray-100 dark:border-[#1e2235]">
      <div className="flex items-center max-w-6xl gap-4 px-4 mx-auto" style={{ height: '52px' }}>

        {/* 로고 */}
        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center justify-center text-xs font-bold text-white rounded-lg w-7 h-7 bg-brand-500">G</div>
          <span className="text-base font-extrabold tracking-tight text-brand-500">GCP</span>
        </Link>

        {/* 상단 메뉴 */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLink('/', '홈')}
          {navLink('/lectures', '강의 목록')}
          {navLink('/community', '커뮤니티')}
          {user?.role === 'student' && navLink('/mypage', '내 수강')}
          {user?.role === 'student' && navLink('/growth', '성장 분석')}
          {user?.role === 'coach'   && navLink('/coach/dashboard', '수강 관리')}
          {user?.role === 'admin'   && navLink('/admin', '🛡️ 관리자')}
        </div>

        {/* 우측 아이콘 영역 */}
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={toggle}
            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-[#2a2d3e] bg-white dark:bg-[#1a1d2e]
                       flex items-center justify-center text-base hover:border-brand-400 transition-colors">
            {dark ? '☀️' : '🌙'}
          </button>

          {user?.role === 'student' && (
            <button onClick={() => navigate('/cart')}
              className="relative w-8 h-8 rounded-lg border border-gray-200 dark:border-[#2a2d3e] bg-white dark:bg-[#1a1d2e]
                         flex items-center justify-center text-base hover:border-brand-400 transition-colors">
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          )}

          {user ? (
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1d2e] transition-colors">
                <div className={`w-6 h-6 rounded-full ${savedColor} flex items-center justify-center text-[11px] font-bold text-white select-none`}>
                  {user.nickname?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{user.nickname}</span>
                {user.role === 'coach' && (
                  <span className="text-xs bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded-md font-medium">코치</span>
                )}
                {user.role === 'admin' && (
                  <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-md font-medium">관리자</span>
                )}
                <span className={`text-gray-400 text-xs transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-[#1a1d2e] border border-gray-100 dark:border-[#2a2d3e] rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-50 dark:border-[#2a2d3e]">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full ${savedColor} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                        {user.nickname?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.nickname}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1.5">
                    {/* 학생 전용 */}
                    {user.role === 'student' && (
                      <>
                        {[
                          { path: '/mypage', icon: '📋', label: '내 수강 목록' },
                          { path: '/cart',   icon: '🛒', label: '장바구니', badge: cartCount },
                          { path: '/growth', icon: '📊', label: '성장 분석' },
                        ].map(m => (
                          <button key={m.path} onClick={() => { setDropdownOpen(false); navigate(m.path) }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-[#13161e] hover:text-brand-500 transition-colors text-left">
                            <span className="text-base">{m.icon}</span> {m.label}
                            {m.badge > 0 && <span className="ml-auto text-xs px-1.5 py-0.5 bg-brand-500 text-white rounded-full">{m.badge}</span>}
                          </button>
                        ))}
                      </>
                    )}

                    {/* 코치 전용 */}
                    {user.role === 'coach' && (
                      <>
                        {[
                          { path: '/coach/dashboard',    icon: '🏆', label: '수강 관리' },
                          { path: '/coach/lecture/new',  icon: '➕', label: '강의 등록' },
                        ].map(m => (
                          <button key={m.path} onClick={() => { setDropdownOpen(false); navigate(m.path) }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-[#13161e] hover:text-brand-500 transition-colors text-left">
                            <span className="text-base">{m.icon}</span> {m.label}
                          </button>
                        ))}
                      </>
                    )}

                    {/* 관리자 전용 */}
                    {user.role === 'admin' && (
                      <button onClick={() => { setDropdownOpen(false); navigate('/admin') }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left">
                        <span className="text-base">🛡️</span> 관리자 대시보드
                      </button>
                    )}

                    {/* 공통 */}
                    {[
                      { path: '/community', icon: '💬', label: '커뮤니티' },
                      { path: '/profile',   icon: '⚙️', label: '프로필 설정' },
                    ].map(m => (
                      <button key={m.path} onClick={() => { setDropdownOpen(false); navigate(m.path) }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-[#13161e] hover:text-brand-500 transition-colors text-left">
                        <span className="text-base">{m.icon}</span> {m.label}
                      </button>
                    ))}
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
              <Link to="/login" className="px-3 py-1.5 text-sm text-gray-600 dark:text-[#8892a4] hover:text-brand-500 transition-colors">로그인</Link>
              <Link to="/register" className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors">회원가입</Link>
            </div>
          )}

          <button className="md:hidden p-2 text-gray-400" onClick={() => setMenuOpen(!menuOpen)}>
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
          {[['/', '홈'], ['/lectures', '강의 목록'], ['/community', '커뮤니티']].map(([p, l]) => (
            <Link key={p} to={p} onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm ${isActive(p) ? 'text-brand-500' : 'text-gray-600 dark:text-[#8892a4]'}`}>{l}</Link>
          ))}
          {user?.role === 'student' && <>
            <Link to="/mypage" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600">📋 내 수강</Link>
            <Link to="/cart" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600">🛒 장바구니{cartCount > 0 && ` (${cartCount})`}</Link>
            <Link to="/growth" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600">📊 성장 분석</Link>
          </>}
          {user?.role === 'coach' && <>
            <Link to="/coach/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600">🏆 수강 관리</Link>
            <Link to="/coach/lecture/new" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600">➕ 강의 등록</Link>
          </>}
          {user?.role === 'admin' && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-red-600">🛡️ 관리자 대시보드</Link>
          )}
          {user ? <>
            <button onClick={() => { navigate('/profile'); setMenuOpen(false) }} className="block w-full text-left px-3 py-2.5 text-sm text-gray-600">⚙️ 프로필 설정</button>
            <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="block w-full text-left px-3 py-2.5 text-sm text-red-500">🚪 로그아웃</button>
          </> : <>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600">로그인</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-brand-500 font-medium">회원가입</Link>
          </>}
        </div>
      )}
    </nav>
  )
}
