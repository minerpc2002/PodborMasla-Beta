import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ShieldCheck, User, LogIn, Loader2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { UserProfile, PromoCode } from '../types';

export default function AuthModal() {
  const { userProfile, isAuthReady, setActivePromoCode } = useAppStore();
  const [nameInput, setNameInput] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsNickname, setNeedsNickname] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (isAuthReady && auth.currentUser && !userProfile) {
      setNeedsNickname(true);
      setCurrentUser(auth.currentUser);
    } else {
      setNeedsNickname(false);
    }
  }, [isAuthReady, auth.currentUser, userProfile]);

  if (!isAuthReady) return null;
  if (userProfile) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        setNeedsNickname(true);
        setCurrentUser(user);
      }
    } catch (err: any) {
      console.error(err);
      setError('Ошибка при входе через Google');
    } finally {
      setLoading(false);
    }
  };

  const handleFirestoreError = (error: any, operation: string, path: string) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType: operation,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const nickname = nameInput.trim();
    if (nickname.length < 3) {
      setError('Никнейм должен содержать минимум 3 символа');
      return;
    }
    if (nickname.length > 20) {
      setError('Никнейм должен содержать максимум 20 символов');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await runTransaction(db, async (transaction) => {
        const nicknameDocRef = doc(db, 'nicknames', nickname.toLowerCase());
        const nicknameDoc = await transaction.get(nicknameDocRef);
        
        if (nicknameDoc.exists()) {
          throw new Error('Этот никнейм уже занят');
        }

        const userProfile: UserProfile = {
          uid: currentUser.uid,
          nickname: nickname,
          email: currentUser.email || '',
          role: currentUser.email?.toLowerCase() === 'minerpc2002@gmail.com' ? 'admin' : 'user',
          createdAt: Date.now()
        };

        transaction.set(nicknameDocRef, { uid: currentUser.uid });
        transaction.set(doc(db, 'users', currentUser.uid), userProfile);
      });

      // Handle initial promo code if provided
      if (promoInput.trim()) {
        const promoCode = promoInput.trim().toUpperCase();
        const promoDoc = await getDoc(doc(db, 'promocodes', promoCode));
        if (promoDoc.exists()) {
          const promoData = promoDoc.data() as PromoCode;
          if (promoData.expiresAt > Date.now()) {
            setActivePromoCode(promoData);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('permission')) {
        handleFirestoreError(err, 'write', `users/${currentUser.uid}`);
      }
      setError(err.message || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setNeedsNickname(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-none shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="space-y-3 pb-4">
          <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center mb-2 mx-auto">
            <User className="text-blue-400" size={24} />
          </div>
          <CardTitle className="text-2xl text-center font-display">
            {needsNickname ? 'Завершение регистрации' : 'Авторизация'}
          </CardTitle>
          <CardDescription className="text-center text-base">
            {needsNickname 
              ? 'Выберите уникальный никнейм для вашего профиля' 
              : 'Пожалуйста, войдите для использования сервиса подбора'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!needsNickname ? (
            <div className="space-y-4">
              <Button 
                onClick={handleGoogleLogin} 
                disabled={loading}
                className="w-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center gap-2"
                size="lg"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                Войти через Google
              </Button>
              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
              <p className="text-xs text-zinc-500 text-center leading-relaxed">
                Используйте ваш Google аккаунт для быстрого и безопасного входа.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ваш никнейм *</label>
                <Input 
                  placeholder="Например: Alex99" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoFocus
                  disabled={loading}
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
              
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">Промокод (опционально)</label>
                <Input 
                  placeholder="Введите промокод" 
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="uppercase"
                  disabled={loading}
                />
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Промокод увеличивает лимит поисков.
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  size="lg"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Завершить регистрацию'}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full text-zinc-400 hover:text-white"
                >
                  Отмена
                </Button>
              </div>
            </form>
          )}
          
          <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 mt-6">
            <ShieldCheck size={14} />
            <span>Данные защищены M.A.R.A.T Guard</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
