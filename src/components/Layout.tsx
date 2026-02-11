import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "任务列表" },
    { path: "/add", label: "添加任务" },
  ];

  return (
    <div className="min-h-screen">
      {/* 导航栏 - 玻璃态效果 */}
      <nav className="glass-strong sticky top-0 z-50 border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all duration-300">
                <span className="text-white font-bold text-sm">BL</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                BLSync
              </span>
            </Link>

            {/* 导航链接 */}
            <div className="flex gap-1 bg-slate-100/50 p-1 rounded-xl">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="animate-fade-in">{children}</main>
    </div>
  );
}
