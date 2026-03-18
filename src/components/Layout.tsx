import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, History, Heart, ShieldCheck, User, Gift, HelpCircle, Info, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { setupTelegram } from '../lib/telegram';
import AuthModal from './AuthModal';
import UserMenuModal from './UserMenuModal';
import PromoModal from './PromoModal';
import { auth } from '../firebase';
import FAQModal from './FAQModal';
import HowItWorksModal from './HowItWorksModal';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';
import { signOut } from 'firebase/auth';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, activePromoCode } = useAppStore();
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    setupTelegram();
  }, []);

  const navItems = [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/search', icon: Search, label: 'Подбор' },
    { path: '/history', icon: History, label: 'История' },
    { path: '/favorites', icon: Heart, label: 'Избранное' },
  ];

  const isPromoActive = activePromoCode && activePromoCode.expiresAt > Date.now();
  const isStaff = userProfile?.role === 'admin' || 
                  userProfile?.role === 'moderator' || 
                  userProfile?.email?.toLowerCase() === 'minerpc2002@gmail.com';

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-zinc-50 font-sans transition-colors duration-300">
      <AuthModal />
      <UserMenuModal 
        isOpen={isUserMenuOpen} 
        onClose={() => setIsUserMenuOpen(false)} 
        onOpenPromo={() => setIsPromoModalOpen(true)}
      />
      <PromoModal isOpen={isPromoModalOpen} onClose={() => setIsPromoModalOpen(false)} />
      <FAQModal isOpen={isFAQModalOpen} onClose={() => setIsFAQModalOpen(false)} />
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 w-full liquid-glass border-b border-white/5 shadow-xl"
      >
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 max-w-md mx-auto w-full">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-sm tracking-tight shrink-0">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 text-white p-1.5 rounded-xl shadow-lg shadow-blue-500/20"
            >
              <Search size={16} strokeWidth={2.5} />
            </motion.div>
            <div className="flex flex-col leading-none">
              <span className="text-zinc-50 text-[13px]">MasloMARKET</span>
              <span className="text-[8px] uppercase tracking-widest mt-0.5 font-black">
                ПОДБОР <span className="shimmer-ai">AI</span>
              </span>
            </div>
          </Link>
          
          <div className="flex items-center gap-1 shrink-0">
            {isStaff && (
              <Link to="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "p-2 transition-colors",
                    location.pathname === '/dashboard' ? "text-blue-400" : "text-zinc-400 hover:text-blue-600"
                  )}
                  title="Личный кабинет (Админ)"
                >
                  <LayoutDashboard size={20} />
                </motion.button>
              </Link>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFAQModalOpen(true)}
              className="p-2 text-zinc-400 hover:text-blue-600 transition-colors"
              title="Часто задаваемые вопросы"
            >
              <HelpCircle size={20} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsHowItWorksOpen(true)}
              className="p-2 text-zinc-400 hover:text-blue-600 transition-colors"
              title="Как это работает"
            >
              <Info size={20} />
            </motion.button>

            {userProfile ? (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsUserMenuOpen(true)}
                className="flex items-center gap-2.5 p-1.5 pr-3 bg-zinc-900/40 hover:bg-zinc-800/60 border border-white/5 rounded-full transition-all group ml-1"
              >
                <div className="relative shrink-0">
                  <img 
                    src={auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.nickname}`} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full border border-white/10 object-cover shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#000002] rounded-full" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xs font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">
                    {userProfile.nickname}
                  </span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-tighter mt-0.5">
                    {userProfile.role === 'admin' ? 'Admin' : 'Pro'}
                  </span>
                </div>
              </motion.button>
            ) : null}
          </div>
        </div>
      </motion.header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 pb-8">
        <div className={cn("w-full mx-auto", location.pathname === '/dashboard' ? "max-w-none" : "max-w-md")}>
          <Outlet />
          
          <footer className="mt-12 mb-24 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Конфиденциально и защищено M.A.R.A.T Guard</span>
            </div>
            <p className="text-[10px] text-zinc-500 max-w-[280px] leading-relaxed">
              Проверка идет по official базе данных MasloMarket.
              <br />
              &copy; {new Date().getFullYear()} MasloMarket. Все права защищены.
            </p>
          </footer>
        </div>
      </main>

      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-6 left-0 right-0 z-50 px-4 pb-safe pointer-events-none"
      >
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="flex h-16 items-center justify-around px-2 liquid-glass-heavy rounded-full nav-shadow border border-white/10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center w-16 h-full gap-1 text-[10px] font-medium transition-all duration-200",
                    isActive 
                      ? "text-blue-400 scale-105" 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <motion.div
                    animate={isActive ? { y: -2 } : { y: 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </div>
  );
}
