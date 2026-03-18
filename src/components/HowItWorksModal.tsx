import { motion, AnimatePresence } from 'motion/react';
import { X, Info, CheckCircle2, Zap, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  const steps = [
    {
      icon: <Zap className="text-amber-500" size={20} />,
      title: "Мгновенный анализ",
      description: "Наши нейросети анализируют ваш VIN или параметры авто за считанные секунды."
    },
    {
      icon: <CheckCircle2 className="text-emerald-500" size={20} />,
      title: "Официальные каталоги",
      description: "Мы сверяем данные напрямую с базами Ravenol, Motul и Bardahl для максимальной точности."
    },
    {
      icon: <ShieldCheck className="text-blue-500" size={20} />,
      title: "Гарантия совместимости",
      description: "Алгоритм учитывает допуски OEM, вязкость и условия эксплуатации вашего двигателя."
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-800"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-900/30 rounded-xl">
                    <Info className="text-blue-400" size={20} />
                  </div>
                  <h2 className="text-xl font-bold">Как это работает?</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {steps.map((step, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="shrink-0 mt-1">{step.icon}</div>
                    <div>
                      <h3 className="font-bold text-sm mb-1">{step.title}</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8">
                <Button onClick={onClose} className="w-full rounded-2xl h-12 text-sm font-bold">
                  Понятно
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
