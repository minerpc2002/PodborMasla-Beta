import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, Globe, ShieldCheck, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FAQModal({ isOpen, onClose }: FAQModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden"
          >
            <Card className="border-none shadow-2xl bg-zinc-900 flex flex-col max-h-[90vh]">
              <CardHeader className="relative pb-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded-full hover:bg-zinc-800 z-10"
                >
                  <X size={20} />
                </Button>
                <div className="w-12 h-12 bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <HelpCircle className="text-blue-400" size={28} />
                </div>
                <CardTitle className="text-2xl font-display font-bold">Часто задаваемые вопросы</CardTitle>
                <CardDescription>Помощь по работе сервиса MasloMARKET AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-2xl bg-zinc-800/50 border border-zinc-800">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-900/30 rounded-xl flex items-center justify-center">
                      <Globe className="text-emerald-400" size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Проблемы с доступом к ИИ?</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        В отдельных случаях корректная работа бота по подбору масел возможна только при использовании альтернативных способов подключения к сети (например, через защищённое соединение).
                        <br /><br />
                        Обратите внимание:
                        <br /><br />
                        • Мы не рекламируем, не продвигаем и не поддерживаем какие‑либо сервисы VPN или аналогичные инструменты
                        <br /><br />
                        • Выбор способа подключения — ваше личное решение
                        <br /><br />
                        • Использование любых технологий должно соответствовать действующему законодательству РФ.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-2xl bg-zinc-800/50 border border-zinc-800">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="text-blue-400" size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Насколько точен подбор?</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Наш ИИ анализирует официальные спецификации производителей и кросс-номера MasloMarket для обеспечения максимальной точности.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-2xl bg-zinc-800/50 border border-zinc-800">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <Info className="text-purple-400" size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Как работают лимиты?</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Бесплатные поиски ограничены по времени. Вы можете увеличить лимиты, введя промокод от продавцов MasloMarket.
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={onClose} className="w-full bg-zinc-100 text-zinc-900 rounded-xl h-12 font-semibold">
                  Понятно
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
