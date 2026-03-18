import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, setDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { UserProfile, PromoCode, UserRole } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Users, Ticket, Plus, Trash2, Shield, ShieldAlert, ShieldCheck, Loader2, User, Search, Crown } from 'lucide-react';
import UserAdminModal from '../components/UserAdminModal';

export default function Dashboard() {
  const { userProfile } = useAppStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // User list state
  const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'moderator' | 'pro' | 'user'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

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

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUsers(users.map(u => u.uid === updatedUser.uid ? updatedUser : u));
    setSelectedUser(updatedUser);
  };

  const filteredUsers = users.filter(user => {
    // Filter by role/status
    if (userFilter === 'admin' && user.role !== 'admin') return false;
    if (userFilter === 'moderator' && user.role !== 'moderator') return false;
    if (userFilter === 'user' && user.role !== 'user') return false;
    if (userFilter === 'pro') {
      const isPro = user.activePromoCode && user.activePromoCode.expiresAt > Date.now();
      if (!isPro) return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return user.nickname.toLowerCase().includes(query) || 
             user.email.toLowerCase().includes(query) ||
             user.uid.toLowerCase().includes(query);
    }

    return true;
  });

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
        <TabsList className="bg-zinc-900/40 p-1 border border-white/5 backdrop-blur-xl rounded-2xl flex w-full sm:w-auto overflow-x-auto no-scrollbar justify-start">
          <TabsTrigger value="profile" className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all whitespace-nowrap">
            <User size={18} />
            <span>Профиль</span>
          </TabsTrigger>
          {isStaff && (
            <>
              <TabsTrigger value="users" className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all whitespace-nowrap">
                <Users size={18} />
                <span>Пользователи</span>
              </TabsTrigger>
              <TabsTrigger value="promo" className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all whitespace-nowrap">
                <Ticket size={18} />
                <span>Промокоды</span>
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
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <Input 
                        placeholder="Поиск по имени, email или ID..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-black/20 border-white/10"
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                      <Button 
                        variant={userFilter === 'all' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setUserFilter('all')}
                        className={userFilter === 'all' ? 'bg-blue-600' : 'border-white/10'}
                      >
                        Все
                      </Button>
                      <Button 
                        variant={userFilter === 'admin' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setUserFilter('admin')}
                        className={userFilter === 'admin' ? 'bg-red-600' : 'border-white/10'}
                      >
                        Админ
                      </Button>
                      <Button 
                        variant={userFilter === 'moderator' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setUserFilter('moderator')}
                        className={userFilter === 'moderator' ? 'bg-blue-600' : 'border-white/10'}
                      >
                        Модератор
                      </Button>
                      <Button 
                        variant={userFilter === 'pro' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setUserFilter('pro')}
                        className={userFilter === 'pro' ? 'bg-amber-600 text-white' : 'border-white/10 text-amber-500'}
                      >
                        PRO User
                      </Button>
                      <Button 
                        variant={userFilter === 'user' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setUserFilter('user')}
                        className={userFilter === 'user' ? 'bg-zinc-600' : 'border-white/10'}
                      >
                        Юзер
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredUsers.map((user) => {
                      const isPro = user.activePromoCode && user.activePromoCode.expiresAt > Date.now();
                      return (
                        <div 
                          key={user.uid} 
                          onClick={() => setSelectedUser(user)}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border cursor-pointer gap-4 ${isPro ? 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-white/5'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nickname}`} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-100 text-base">{user.nickname}</span>
                                {isPro && (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase rounded border border-amber-500/30">
                                    <Crown size={10} /> PRO
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-zinc-400">{user.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
                              {user.role === 'admin' && <ShieldAlert size={14} className="text-red-400" />}
                              {user.role === 'moderator' && <ShieldCheck size={14} className="text-blue-400" />}
                              {user.role === 'user' && <Users size={14} className="text-zinc-400" />}
                              <span className={
                                user.role === 'admin' ? 'text-red-400 text-xs font-bold uppercase tracking-wider' : 
                                user.role === 'moderator' ? 'text-blue-400 text-xs font-bold uppercase tracking-wider' : 'text-zinc-400 text-xs font-bold uppercase tracking-wider'
                              }>
                                {user.role}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <div className="py-8 text-center text-zinc-500">
                        Пользователи не найдены
                      </div>
                    )}
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
                  <div className="space-y-3">
                    {promoCodes.map((promo) => {
                      const isExpired = promo.expiresAt < Date.now();
                      return (
                        <div key={promo.code} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/5 gap-4">
                          <div className="flex flex-col">
                            <button 
                              onClick={() => copyToClipboard(promo.code)}
                              className="font-mono font-bold text-blue-400 text-left hover:underline text-lg tracking-widest"
                              title="Копировать"
                            >
                              {promo.code}
                            </button>
                            <span className="text-xs text-zinc-400 mt-1">Истекает: {new Date(promo.expiresAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                            <div className="flex flex-col items-start sm:items-end bg-black/20 px-3 py-1.5 rounded-lg">
                              <span className="text-xs text-zinc-300 font-medium">Попыток: {promo.maxAttempts}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider mt-1 ${
                                isExpired ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                              }`}>
                                {isExpired ? 'Истек' : 'Активен'}
                              </span>
                            </div>
                            {isAdmin && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-9 w-9 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 bg-white/5 border border-white/5 shrink-0"
                                onClick={() => handleDeletePromo(promo.code)}
                                disabled={actionLoading === promo.code}
                              >
                                {actionLoading === promo.code ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {promoCodes.length === 0 && (
                      <div className="py-8 text-center text-zinc-500">
                        Промокоды не найдены
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>

      {selectedUser && (
        <UserAdminModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdateUser={handleUpdateUser}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
