import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, setDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { UserProfile, PromoCode, UserRole } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Users, Ticket, Plus, Trash2, Shield, ShieldAlert, ShieldCheck, Loader2, User } from 'lucide-react';

export default function Dashboard() {
  const { userProfile } = useAppStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Promo code form state
  const [newCode, setNewCode] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [maxAttempts, setMaxAttempts] = useState('10');

  const isAdmin = userProfile?.role === 'admin' || userProfile?.email?.toLowerCase() === 'minerpc2002@gmail.com';
  const isStaff = isAdmin || userProfile?.role === 'moderator';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // For users, we only fetch if staff
      if (isStaff) {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersList = usersSnap.docs.map(doc => doc.data() as UserProfile);
        setUsers(usersList.sort((a, b) => b.createdAt - a.createdAt));

        const promoSnap = await getDocs(query(collection(db, 'promocodes'), orderBy('createdAt', 'desc')));
        const promoList = promoSnap.docs.map(doc => doc.data() as PromoCode);
        setPromoCodes(promoList);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: UserRole) => {
    if (!isAdmin) return;
    setActionLoading(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Error updating role:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(result);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Optional: show a small toast
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !userProfile) return;
    
    setActionLoading('create-promo');
    try {
      const code = newCode.trim().toUpperCase();
      const expiresAt = Date.now() + (parseInt(expiresInDays) * 24 * 60 * 60 * 1000);
      
      const promo: PromoCode = {
        code,
        expiresAt,
        maxAttempts: parseInt(maxAttempts),
        createdBy: userProfile.uid,
        createdAt: Date.now()
      };

      console.log('Creating promo:', promo);
      await setDoc(doc(db, 'promocodes', code), promo);
      setPromoCodes(prev => [promo, ...prev.filter(p => p.code !== code)]);
      setNewCode('');
    } catch (err) {
      console.error('Error creating promo code:', err);
      alert('Ошибка при создании промокода. Проверьте права доступа или соединение.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePromo = async (code: string) => {
    if (!isAdmin) return;
    setActionLoading(code);
    try {
      await deleteDoc(doc(db, 'promocodes', code));
      setPromoCodes(promoCodes.filter(p => p.code !== code));
    } catch (err) {
      console.error('Error deleting promo code:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Личный кабинет</h1>
          <p className="text-zinc-400 mt-1">Управление профилем и системными настройками</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-md self-start md:self-center">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-semibold uppercase tracking-wider text-blue-400">{userProfile?.role}</span>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-zinc-900/40 p-1 border border-white/5 backdrop-blur-xl rounded-2xl inline-flex">
          <TabsTrigger value="profile" className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            <User size={18} />
            <span className="hidden sm:inline">Профиль</span>
          </TabsTrigger>
          {isStaff && (
            <>
              <TabsTrigger value="users" className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                <Users size={18} />
                <span className="hidden sm:inline">Пользователи</span>
              </TabsTrigger>
              <TabsTrigger value="promo" className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                <Ticket size={18} />
                <span className="hidden sm:inline">Промокоды</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile">
          <Card className="liquid-glass border-none">
            <CardHeader>
              <CardTitle>Ваш профиль</CardTitle>
              <CardDescription>Основная информация о вашем аккаунте</CardDescription>
            </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-1.5 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Никнейм</p>
                      <p className="text-lg font-bold text-zinc-100">{userProfile?.nickname}</p>
                    </div>
                    <div className="space-y-1.5 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Email</p>
                      <p className="text-lg font-bold text-zinc-100 truncate" title={userProfile?.email}>{userProfile?.email}</p>
                    </div>
                    <div className="space-y-1.5 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Роль</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-zinc-100 capitalize">{userProfile?.role}</p>
                        {userProfile?.email?.toLowerCase() === 'minerpc2002@gmail.com' && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase rounded-lg border border-amber-500/30">
                            Владелец
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Регистрация</p>
                      <p className="text-lg font-bold text-zinc-100">
                        {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
          </Card>
        </TabsContent>

        {isStaff && (
          <>
            <TabsContent value="users">
              <Card className="liquid-glass border-none">
                <CardHeader>
                  <CardTitle>Пользователи системы</CardTitle>
                  <CardDescription>Список всех зарегистрированных пользователей</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full text-left min-w-[600px]">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 text-sm">
                          <th className="pb-4 font-medium">Никнейм</th>
                          <th className="pb-4 font-medium">Email</th>
                          <th className="pb-4 font-medium">Роль</th>
                          {isAdmin && <th className="pb-4 font-medium text-right">Действия</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {users.map((user) => (
                          <tr key={user.uid} className="text-sm group hover:bg-white/5 transition-colors">
                            <td className="py-4 font-medium">{user.nickname}</td>
                            <td className="py-4 text-zinc-400">{user.email}</td>
                            <td className="py-4">
                              <div className="flex items-center gap-1.5">
                                {user.role === 'admin' && <ShieldAlert size={14} className="text-red-400" />}
                                {user.role === 'moderator' && <ShieldCheck size={14} className="text-blue-400" />}
                                {user.role === 'user' && <Users size={14} className="text-zinc-400" />}
                                <span className={
                                  user.role === 'admin' ? 'text-red-400' : 
                                  user.role === 'moderator' ? 'text-blue-400' : 'text-zinc-400'
                                }>
                                  {user.role}
                                </span>
                              </div>
                            </td>
                            {isAdmin && (
                              <td className="py-4 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {user.role !== 'admin' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-8 text-xs border-red-500/30 hover:bg-red-500/10"
                                      onClick={() => handleUpdateRole(user.uid, 'admin')}
                                      disabled={actionLoading === user.uid}
                                    >
                                      Админ
                                    </Button>
                                  )}
                                  {user.role !== 'moderator' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-8 text-xs border-blue-500/30 hover:bg-blue-500/10"
                                      onClick={() => handleUpdateRole(user.uid, 'moderator')}
                                      disabled={actionLoading === user.uid}
                                    >
                                      Модератор
                                    </Button>
                                  )}
                                  {user.role !== 'user' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-8 text-xs border-zinc-500/30 hover:bg-zinc-500/10"
                                      onClick={() => handleUpdateRole(user.uid, 'user')}
                                      disabled={actionLoading === user.uid}
                                    >
                                      Юзер
                                    </Button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="promo" className="space-y-6">
              <Card className="liquid-glass border-none">
                <CardHeader>
                  <CardTitle>Создать промокод</CardTitle>
                  <CardDescription>Генерация нового промокода для пользователей</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePromo} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Код (любой длины)</label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="SUMMER2024" 
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                            className="uppercase font-mono"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={generateRandomCode}
                            className="shrink-0 border-zinc-700 hover:bg-zinc-800"
                            title="Сгенерировать 10-значный код"
                          >
                            Ген.
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Дней действия</label>
                        <Input 
                          type="number" 
                          value={expiresInDays}
                          onChange={(e) => setExpiresInDays(e.target.value)}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Попыток поиска</label>
                        <Input 
                          type="number" 
                          value={maxAttempts}
                          onChange={(e) => setMaxAttempts(e.target.value)}
                          min="1"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="bg-blue-600 hover:bg-blue-700 px-8"
                        disabled={actionLoading === 'create-promo'}
                      >
                        {actionLoading === 'create-promo' ? <Loader2 className="animate-spin mr-2" size={18} /> : <Plus size={18} className="mr-2" />}
                        Создать промокод
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="liquid-glass border-none">
                <CardHeader>
                  <CardTitle>Активные промокоды</CardTitle>
                  <CardDescription>Список всех созданных промокодов</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full text-left min-w-[600px]">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 text-sm">
                          <th className="pb-4 font-medium">Код</th>
                          <th className="pb-4 font-medium">Попыток</th>
                          <th className="pb-4 font-medium">Истекает</th>
                          <th className="pb-4 font-medium">Статус</th>
                          {isAdmin && <th className="pb-4 font-medium text-right">Действия</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {promoCodes.map((promo) => {
                          const isExpired = promo.expiresAt < Date.now();
                          return (
                            <tr key={promo.code} className="text-sm group hover:bg-white/5 transition-colors">
                              <td className="py-4 font-mono font-bold text-blue-400">
                                <button 
                                  onClick={() => copyToClipboard(promo.code)}
                                  className="hover:underline cursor-pointer"
                                  title="Копировать"
                                >
                                  {promo.code}
                                </button>
                              </td>
                              <td className="py-4">{promo.maxAttempts}</td>
                              <td className="py-4 text-zinc-400">
                                {new Date(promo.expiresAt).toLocaleDateString()}
                              </td>
                              <td className="py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isExpired ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                }`}>
                                  {isExpired ? 'Истек' : 'Активен'}
                                </span>
                              </td>
                              {isAdmin && (
                                <td className="py-4 text-right">
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeletePromo(promo.code)}
                                    disabled={actionLoading === promo.code}
                                  >
                                    {actionLoading === promo.code ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                                  </Button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                        {promoCodes.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-zinc-500">
                              Промокоды не найдены
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
