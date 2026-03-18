import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Gift, X, CheckCircle2, Clock, Search, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { PromoCode } from '../types';
import { logUserAction } from '../lib/logger';

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PromoModal({ isOpen, onClose }: PromoModalProps) {
  const { activePromoCode, setActivePromoCode, getSearchStatus, userProfile } = useAppStore();
  const [promoInput, setPromoInput] = useState('');
  const [status, setStatus] = useState({ remainingAttempts: 2, totalAttempts: 2, minutesUntilReset: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPromo, setPendingPromo] = useState<PromoCode | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus(getSearchStatus());
      setIsReplacing(false);
      setShowConfirm(false);
      setPendingPromo(null);
      setPromoInput('');
      setError('');
    }
  }, [isOpen, getSearchStatus]);

  if (!isOpen) return null;

  const isPromoActive = activePromoCode && activePromoCode.expiresAt > Date.now();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setError('');

    try {
      const promoDoc = await getDoc(doc(db, 'promocodes', code));
      if (!promoDoc.exists()) {
        setError('Промокод не найден');
        return;
      }

      const promoData = promoDoc.data() as PromoCode;
      if (promoData.expiresAt < Date.now()) {
        setError('Срок действия промокода истек');
        return;
      }

      if (isPromoActive) {
        setPendingPromo(promoData);
        setShowConfirm(true);
      } else {
        applyPromoCode(promoData);
      }
    } catch (err) {
      console.error('Error activating promo code:', err);
      setError('Ошибка при активации промокода');
    } finally {
      setLoading(false);
    }
  };

  const applyPromoCode = async (promoData: PromoCode) => {
    setActivePromoCode(promoData);
    setStatus(getSearchStatus());
    
    if (userProfile?.uid) {
      try {
        await updateDoc(doc(db, 'users', userProfile.uid), {
          activePromoCode: promoData
        });
        logUserAction('activate_promo', `Активирован код: ${promoData.code}, лимит: ${promoData.maxAttempts}, до: ${new Date(promoData.expiresAt).toLocaleString()}`);
      } catch (err) {
        console.error('Failed to save promo code to user profile:', err);
      }
    }
    
    onClose();
  };

  const handleConfirmReplace = () => {
    if (pendingPromo) {
      applyPromoCode(pendingPromo);
    }
  };

  const getDaysLeft = () => {
    if (!activePromoCode) return 0;
    const timeLeft = activePromoCode.expiresAt - Date.now();
    return Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
  };

  const formatResetTime = (minutes: number) => {
    if (minutes <= 0) return '0 мин';
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ч ${mins} мин`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-none shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-300 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <X size={20} />
        </button>
        
        {showConfirm ? (
          <>
            <CardHeader className="space-y-3 pb-4 pt-8">
              <div className="w-12 h-12 bg-amber-900/30 rounded-full flex items-center justify-center mb-2 mx-auto">
                <Gift className="text-amber-400" size={24} />
              </div>
              <CardTitle className="text-2xl text-center font-display text-amber-500">Внимание</CardTitle>
              <CardDescription className="text-center text-base">
                У вас уже активен промокод <span className="font-bold text-zinc-100">{activePromoCode?.code}</span>. 
                При активации нового промокода <span className="font-bold text-zinc-100">{pendingPromo?.code}</span>, старый будет сброшен.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleConfirmReplace}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
                size="lg"
              >
                Подтвердить и заменить
              </Button>
              <Button 
                onClick={() => {
                  setShowConfirm(false);
                  setPendingPromo(null);
                }}
                variant="ghost"
                className="w-full text-zinc-400 hover:text-white" 
                size="lg"
              >
                Отмена
              </Button>
            </CardContent>
          </>
        ) : isPromoActive && !isReplacing ? (
          <>
            <CardHeader className="space-y-3 pb-4 pt-8">
              <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mb-2 mx-auto">
                <CheckCircle2 className="text-emerald-400" size={24} />
              </div>
              <CardTitle className="text-2xl text-center font-display">PRO Аккаунт активен</CardTitle>
              <CardDescription className="text-center text-base">
                У вас активирован промокод <span className="font-bold text-zinc-100">{activePromoCode?.code}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-emerald-900/20 p-4 rounded-xl text-center space-y-2 mb-4">
                <p className="text-sm font-medium text-emerald-300">
                  Вам доступно {status.totalAttempts} поисков раз в 20 минут.
                </p>
                <p className="text-xs text-emerald-400">
                  Осталось дней: <span className="font-bold">{getDaysLeft()}</span>
                </p>
              </div>

              <div className="bg-zinc-900/50 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Search size={16} className="text-blue-500" />
                    <span>Осталось попыток:</span>
                  </div>
                  <span className="font-bold text-lg">{status.remainingAttempts} / {status.totalAttempts}</span>
                </div>
                {status.minutesUntilReset > 0 && (
                  <div className="flex items-center justify-between text-zinc-400">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} />
                      <span>Обновление через:</span>
                    </div>
                    <span className="text-sm font-medium">{formatResetTime(status.minutesUntilReset)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 mt-6">
                <Button 
                  onClick={onClose}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900" 
                  size="lg"
                >
                  Отлично
                </Button>
                <Button 
                  onClick={() => setIsReplacing(true)}
                  variant="ghost"
                  className="w-full text-zinc-400 hover:text-white" 
                  size="sm"
                >
                  Ввести другой промокод
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="space-y-3 pb-4 pt-8">
              <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mb-2 mx-auto">
                <Gift className="text-emerald-400" size={24} />
              </div>
              <CardTitle className="text-2xl text-center font-display">Активация промокода</CardTitle>
              <CardDescription className="text-center text-base">
                Введите промокод от продавца MasloMarket, чтобы увеличить лимит поисков.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-900/50 p-4 rounded-xl space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Search size={16} className="text-blue-500" />
                    <span>Осталось попыток:</span>
                  </div>
                  <span className="font-bold text-lg">{status.remainingAttempts} / {status.totalAttempts}</span>
                </div>
                {status.minutesUntilReset > 0 && (
                  <div className="flex items-center justify-between text-zinc-400">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} />
                      <span>Обновление через:</span>
                    </div>
                    <span className="text-sm font-medium">{formatResetTime(status.minutesUntilReset)}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input 
                    placeholder="Введите промокод" 
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="uppercase text-center font-bold tracking-widest"
                    autoFocus
                    disabled={loading}
                  />
                  {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                    size="lg"
                    disabled={!promoInput.trim() || loading}
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Активировать'}
                  </Button>
                  {isReplacing && (
                    <Button 
                      type="button"
                      variant="ghost"
                      onClick={() => setIsReplacing(false)}
                      className="w-full text-zinc-400 hover:text-white" 
                      size="sm"
                    >
                      Назад
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
