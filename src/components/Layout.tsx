import { Link, useLocation } from "react-router-dom";
import { LayoutList, PlusCircle, Settings } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "任务列表", icon: LayoutList },
    { path: "/add", label: "添加任务", icon: PlusCircle },
    { path: "/settings", label: "配置", icon: Settings },
  ];

  return (
    <div className="min-h-screen">
      {/* 导航栏 */}
      <nav className="glass-strong sticky top-0 z-50 h-16 border-b border-stone-900/8 dark:border-white/10">
        <div className="mx-auto h-full max-w-6xl px-6">
          <div className="flex h-full items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center transition-transform duration-300 group-hover:-rotate-6">
                <span className="text-accent font-display italic font-bold text-sm leading-none translate-y-px">
                  B
                </span>
              </div>
              <span className="text-lg font-bold tracking-tight text-ink">
                BL<span className="text-accent-deep">Sync</span>
              </span>
            </Link>

            {/* 导航链接 + 主题切换 */}
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-ink text-paper shadow-sm"
                          : "text-stone-500 dark:text-stone-400 hover:text-ink hover:bg-stone-900/5 dark:hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={isActive ? 2.2 : 1.8} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="animate-fade-in">{children}</main>
    </div>
  );
}
