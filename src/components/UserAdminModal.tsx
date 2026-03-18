import React, { useState, useEffect } from 'react';
import { UserProfile, PromoCode, UserRole, CarData } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Shield, ShieldAlert, ShieldCheck, Users, Ticket, Clock, Search, Loader2, Activity } from 'lucide-react';
import { UserLog } from '../lib/logger';

interface UserAdminModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  isAdmin: boolean;
}

export default function UserAdminModal({ user, isOpen, onClose, onUpdateUser, isAdmin }: UserAdminModalProps) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // PRO grant state
  const [proDays, setProDays] = useState('7');
  const [proAttempts, setProAttempts] = useState('10');

  useEffect(() => {
    if (isOpen) {
      fetchUserLogs();
    }
  }, [isOpen, user.uid]);

  const fetchUserLogs = async () => {
    setLogsLoading(true);
    try {
      const q = query(
        collection(db, 'user_logs'),
        where('userId', '==', user.uid),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const fetchedLogs = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as UserLog[];
      
      // Sort client-side to avoid requiring a composite index
      fetchedLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setLogs(fetchedLogs);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleUpdateRole = async (newRole: UserRole) => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { role: newRole });
      onUpdateUser({ ...user, role: newRole });
    } catch (err) {
      console.error('Error updating role:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPro = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const expiresAt = Date.now() + parseInt(proDays) * 24 * 60 * 60 * 1000;
      const promo: PromoCode = {
        code: `ADMIN_GRANT_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        expiresAt,
        maxAttempts: parseInt(proAttempts),
        createdBy: 'admin',
        createdAt: Date.now()
      };

      await updateDoc(doc(db, 'users', user.uid), { activePromoCode: promo });
      onUpdateUser({ ...user, activePromoCode: promo });
    } catch (err) {
      console.error('Error granting PRO:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokePro = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { activePromoCode: null });
      onUpdateUser({ ...user, activePromoCode: null });
    } catch (err) {
      console.error('Error revoking PRO:', err);
    } finally {
      setLoading(false);
    }
  };

  const isProActive = user.activePromoCode && user.activePromoCode.expiresAt > Date.now();

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto pt-10 pb-20">
      <Card className="w-full max-w-2xl border-none shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative my-auto">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2.5 text-zinc-400 hover:text-zinc-300 rounded-full bg-zinc-900/80 hover:bg-zinc-800 transition-colors z-20 border border-white/10 shadow-lg"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        
        <CardHeader className="pb-4 pt-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nickname}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-2xl font-display flex items-center gap-2 flex-wrap">
                <span className="truncate">{user.nickname}</span>
                {isProActive && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase rounded-lg border border-amber-500/30 shrink-0">
                    PRO
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-base truncate">{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Role Management */}
          {isAdmin && (
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 space-y-3">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Управление ролью</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant={user.role === 'admin' ? 'default' : 'outline'}
                  className={user.role === 'admin' ? 'bg-red-600 hover:bg-red-700' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'}
                  onClick={() => handleUpdateRole('admin')}
                  disabled={loading || user.role === 'admin'}
                >
                  <ShieldAlert size={16} className="mr-2" /> Админ
                </Button>
                <Button 
                  size="sm" 
                  variant={user.role === 'moderator' ? 'default' : 'outline'}
                  className={user.role === 'moderator' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10'}
                  onClick={() => handleUpdateRole('moderator')}
                  disabled={loading || user.role === 'moderator'}
                >
                  <ShieldCheck size={16} className="mr-2" /> Модератор
                </Button>
                <Button 
                  size="sm" 
                  variant={user.role === 'user' ? 'default' : 'outline'}
                  className={user.role === 'user' ? 'bg-zinc-600 hover:bg-zinc-700' : 'border-zinc-500/30 text-zinc-300 hover:bg-zinc-500/10'}
                  onClick={() => handleUpdateRole('user')}
                  disabled={loading || user.role === 'user'}
                >
                  <Users size={16} className="mr-2" /> Пользователь
                </Button>
              </div>
            </div>
          )}

          {/* PRO Account Management */}
          {isAdmin && (
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">PRO Аккаунт</h3>
                {isProActive && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={handleRevokePro}
                    disabled={loading}
                    className="h-7 text-xs"
                  >
                    Отключить PRO
                  </Button>
                )}
              </div>

              {isProActive ? (
                <div className="bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/20">
                  <p className="text-sm text-emerald-400 mb-1">
                    Активен до: <span className="font-bold text-emerald-300">{new Date(user.activePromoCode!.expiresAt).toLocaleString()}</span>
                  </p>
                  <p className="text-sm text-emerald-400 mb-1">
                    Лимит поисков: <span className="font-bold text-emerald-300">{user.activePromoCode!.maxAttempts}</span>
                  </p>
                  <p className="text-xs text-emerald-500/70">
                    Код: {user.activePromoCode!.code}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Дней</label>
                    <Input 
                      type="number" 
                      value={proDays} 
                      onChange={(e) => setProDays(e.target.value)}
                      min="1"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Попыток</label>
                    <Input 
                      type="number" 
                      value={proAttempts} 
                      onChange={(e) => setProAttempts(e.target.value)}
                      min="1"
                      className="h-9"
                    />
                  </div>
                  <Button 
                    onClick={handleGrantPro}
                    disabled={loading}
                    className="h-9 bg-amber-600 hover:bg-amber-700 text-white w-full"
                  >
                    Выдать PRO
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Activity Logs */}
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} /> Последние действия
            </h3>
            
            {logsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 size={20} className="animate-spin text-zinc-500" />
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {logs.map((log, index) => (
                  <div key={index} className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-zinc-300">
                        {log.action === 'search_vin' && 'Поиск по VIN'}
                        {log.action === 'search_manual' && 'Ручной поиск'}
                        {log.action === 'activate_promo' && 'Активация промокода'}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {log.timestamp instanceof Date ? log.timestamp.toLocaleString() : 'Неизвестно'}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400">{log.details}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-zinc-500">
                Нет записей об активности
              </div>
            )}
          </div>

          <div className="pt-4">
            <Button 
              variant="outline" 
              className="w-full border-zinc-700 text-zinc-400 hover:text-white"
              onClick={onClose}
            >
              Закрыть
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
