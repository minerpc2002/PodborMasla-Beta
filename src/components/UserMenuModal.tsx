import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { X, LogOut, Gift, User, ShieldCheck, AlertCircle } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

interface UserMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPromo: () => void;
}

export default function UserMenuModal({ isOpen, onClose, onOpenPromo }: UserMenuModalProps) {
  const { userProfile } = useAppStore();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  if (!isOpen) return null;

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
    window.location.reload(); // Force reload to ensure clean state as requested
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm"
      >
        <Card className="border-none shadow-2xl relative overflow-hidden liquid-glass-heavy">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-300 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>

          <CardHeader className="pb-4 pt-8 text-center">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
              <img 
                src={auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.nickname}`} 
                alt="Profile" 
                className="relative w-20 h-20 rounded-full border-2 border-blue-500/50 object-cover shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <CardTitle className="text-xl font-display">{userProfile?.nickname}</CardTitle>
            <CardDescription className="text-zinc-400 text-xs truncate max-w-[200px] mx-auto">
              {userProfile?.email}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <AnimatePresence mode="wait">
              {!showConfirmLogout ? (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-white/5 text-zinc-200"
                    onClick={() => {
                      onClose();
                      onOpenPromo();
                    }}
                  >
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <Gift size={18} className="text-emerald-400" />
                    </div>
                    <span>Промокод и лимиты</span>
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-red-500/10 text-red-400"
                    onClick={() => setShowConfirmLogout(true)}
                  >
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <LogOut size={18} />
                    </div>
                    <span>Выйти из аккаунта</span>
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-4"
                >
                  <div className="flex items-center gap-3 text-red-400">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold">Вы уверены?</p>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Вы действительно хотите выйти из своего аккаунта? Вам придется войти снова для доступа к истории и избранному.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowConfirmLogout(false)}
                      className="text-zinc-400 hover:text-white"
                    >
                      Отмена
                    </Button>
                    <Button 
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Да, выйти
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-4 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-widest">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>M.A.R.A.T Guard Protected</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
