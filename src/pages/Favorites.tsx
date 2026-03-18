import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Heart, ChevronRight, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Favorites() {
  const { favorites } = useAppStore();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Heart className="text-red-500" fill="currentColor" />
          Избранное
        </h1>
        <p className="text-zinc-400">
          Сохраненные автомобили для быстрого доступа
        </p>
      </div>

      {favorites.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 gap-4 text-zinc-400"
        >
          <Car size={48} className="opacity-20" />
          <p>Список избранного пуст</p>
          <Link to="/search" className="text-blue-400 font-medium hover:underline">
            Перейти к подбору
          </Link>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {favorites.map((car, idx) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                <Link to={`/result/${car.id}`}>
                  <Card className="hover:border-blue-500 transition-colors cursor-pointer group">
                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-lg">{car.brand} {car.model}</CardTitle>
                        <CardDescription className="mt-1">
                          {car.year_from}-{car.year_to} • {car.engine} ({car.engine_code})
                        </CardDescription>
                      </div>
                      <ChevronRight className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
