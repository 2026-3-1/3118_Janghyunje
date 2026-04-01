export default function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-[#1e2235] mt-16">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-500 rounded-md flex items-center justify-center text-xs font-bold text-white">G</div>
          <span className="text-gray-400 dark:text-[#8892a4] text-sm font-medium">Game Coaching Platform</span>
        </div>
        <p className="text-gray-300 dark:text-[#4a5568] text-xs">© 2026 GCP · 3학년 1학기 프로젝트 실습</p>
      </div>
    </footer>
  )
}
