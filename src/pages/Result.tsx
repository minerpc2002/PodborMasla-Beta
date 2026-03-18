import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Heart, Copy, Info, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { mockCars } from '../data/mockData';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Result() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { favorites, addFavorite, removeFavorite, addToHistory, dynamicCars } = useAppStore();
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});
  
  const car = mockCars.find(c => c.id === id) || dynamicCars.find(c => c.id === id);
  const isFavorite = favorites.some(f => f.id === id);
  const isDynamic = !mockCars.some(c => c.id === id);

  useEffect(() => {
    if (car) {
      addToHistory(car);
    }
  }, [car, addToHistory]);

  if (!car) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64 gap-4"
      >
        <h2 className="text-xl font-bold">Автомобиль не найден</h2>
        <Button onClick={() => navigate('/search')} variant="outline">Вернуться к поиску</Button>
      </motion.div>
    );
  }

  const toggleFavorite = () => {
    if (isFavorite) {
      removeFavorite(car.id);
    } else {
      addFavorite(car);
    }
  };

  const toggleBrand = (unitIdx: number, brand: string) => {
    const key = `${unitIdx}-${brand}`;
    setExpandedBrands(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Масла для ${car.brand} ${car.model}`,
          text: `Подбор масел для ${car.brand} ${car.model} ${car.engine}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6 pb-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft size={24} />
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 size={20} />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFavorite} className={isFavorite ? "text-red-500" : ""}>
            <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
          </Button>
        </div>
      </div>

      {/* Car Info */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="space-y-1"
      >
        <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${isDynamic ? 'bg-purple-600 text-white hover:bg-purple-600/80' : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-800/90'}`}>
          {isDynamic ? 'AI Подбор по VIN' : 'Точное совпадение'}
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-2">
          {car.brand} {car.model}
        </h1>
        <p className="text-zinc-400 text-lg">
          {car.generation} ({car.year_from}-{car.year_to})
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="px-2 py-1 bg-white/5 backdrop-blur-sm border border-white/5 rounded-md text-sm font-medium">
            {car.engine} {car.engine_type === 'petrol' ? 'Бензин' : car.engine_type === 'diesel' ? 'Дизель' : car.engine_type === 'hybrid' ? 'Гибрид' : 'Газ'}
          </span>
          <span className="px-2 py-1 bg-white/5 backdrop-blur-sm border border-white/5 rounded-md text-sm font-medium">
            Код: {car.engine_code}
          </span>
          <span className="px-2 py-1 bg-white/5 backdrop-blur-sm border border-white/5 rounded-md text-sm font-medium">
            КПП: {car.transmission_type.toUpperCase()}
          </span>
        </div>
      </motion.div>

      {/* Recommendations */}
      <div className="space-y-6 mt-4">
        {car.recommendations.map((rec, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
          >
            <Card className="overflow-hidden border-white/5 liquid-glass">
              <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-semibold text-lg">{rec.unit}</h3>
                <span className="text-sm font-mono bg-black/40 px-2 py-1 rounded shadow-sm border border-white/5">
                  {rec.volume_liters} л
                </span>
              </div>
              <CardContent className="p-0">
                <div className="p-4 grid grid-cols-2 gap-4 text-sm border-b border-zinc-800/50">
                  <div>
                    <p className="text-zinc-400 mb-1">Допуск</p>
                    <p className="font-medium">{rec.approval}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 mb-1">Интервал замены</p>
                    <p className="font-medium">{rec.replacement_interval}</p>
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-4 p-3 bg-blue-900/10 rounded-xl border border-blue-900/20">
                    <div>
                      <p className="text-blue-400/70 text-[10px] uppercase font-bold tracking-wider mb-1">Заводская вязкость</p>
                      <p className="font-bold text-blue-100">{rec.factory_viscosity}</p>
                    </div>
                    <div>
                      <p className="text-emerald-400/70 text-[10px] uppercase font-bold tracking-wider mb-1">Рекомендованная ИИ</p>
                      <p className="font-bold text-emerald-400">{rec.recommended_viscosity}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-900/20">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    Рекомендуемые продукты
                  </h4>
                  
                  <div className="pt-1">
                    {rec.products && rec.products.length > 0 ? (
                      <Tabs defaultValue={rec.products[0]?.brand_name} className="w-full">
                        <TabsList className="w-full flex flex-wrap h-auto p-1 bg-zinc-950/50 border border-zinc-800 rounded-xl mb-4">
                          {Array.from(new Set(rec.products.map(p => p.brand_name))).map(brand => (
                            <TabsTrigger 
                              key={brand} 
                              value={brand} 
                              className="flex-1 min-w-[80px] text-[10px] uppercase font-bold tracking-wider py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                            >
                              {brand}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        
                        {Array.from(new Set(rec.products.map(p => p.brand_name))).map(brand => {
                          const brandProducts = rec.products.filter(p => p.brand_name === brand);
                          const isExpanded = expandedBrands[`${idx}-${brand}`];
                          
                          return (
                            <TabsContent key={brand} value={brand} className="space-y-3 mt-0">
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={brand}
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {/* Show first product */}
                                  {brandProducts.length > 0 && (
                                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-sm mb-3">
                                      <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-bold text-blue-400 leading-tight">
                                          {brandProducts[0].product_name}
                                        </h5>
                                      </div>
                                      <p className="text-xs text-zinc-400 mb-2">
                                        {brandProducts[0].description}
                                      </p>
                                      <div className="grid grid-cols-2 gap-2 mb-3">
                                        {brandProducts[0].base_technology && (
                                          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                                            База: <span className="text-zinc-100">{brandProducts[0].base_technology}</span>
                                          </div>
                                        )}
                                        {brandProducts[0].article_number && (
                                          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                                            Артикул: <span className="text-zinc-100">{brandProducts[0].article_number}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {brandProducts[0].approvals.map(app => (
                                          <span key={app} className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">
                                            {app}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Shutter for more products */}
                                  {brandProducts.length > 1 && (
                                    <>
                                      <button 
                                        onClick={() => toggleBrand(idx, brand)}
                                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors border border-dashed border-zinc-800 rounded-lg mb-3"
                                      >
                                        {isExpanded ? (
                                          <>Скрыть варианты <ChevronUp size={14} /></>
                                        ) : (
                                          <>Показать еще {brandProducts.length - 1} вар. <ChevronDown size={14} /></>
                                        )}
                                      </button>

                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden space-y-3"
                                          >
                                            {brandProducts.slice(1).map(product => (
                                              <div key={product.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                  <h5 className="font-bold text-blue-400 leading-tight">
                                                    {product.product_name}
                                                  </h5>
                                                </div>
                                                <p className="text-xs text-zinc-400 mb-2">
                                                  {product.description}
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 mb-3">
                                                  {product.base_technology && (
                                                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                                                      База: <span className="text-zinc-100">{product.base_technology}</span>
                                                    </div>
                                                  )}
                                                  {product.article_number && (
                                                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                                                      Артикул: <span className="text-zinc-100">{product.article_number}</span>
                                                    </div>
                                                  )}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                  {product.approvals.map(app => (
                                                    <span key={app} className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">
                                                      {app}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </>
                                  )}
                                </motion.div>
                              </AnimatePresence>
                            </TabsContent>
                          );
                        })}
                      </Tabs>
                    ) : (
                      <p className="text-sm text-zinc-500">Нет рекомендованных продуктов</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-amber-950/30 border border-amber-900/50 rounded-2xl p-4 flex gap-3 items-start mt-4"
      >
        <Info className="text-amber-500 shrink-0 mt-0.5" size={20} />
        <div className="space-y-2">
          <p className="text-sm text-amber-400 leading-relaxed">
            Рекомендация основана на официальных каталогах брендов по состоянию на март 2026. Всегда проверяйте актуальную сервисную книжку автомобиля и консультируйтесь с официальным сервисом. Я не заменяю профессиональную диагностику.
          </p>
          <p className="text-xs text-amber-500/70 leading-relaxed">
            Выбор масла и указанные объемы являются справочными. При замене ориентируйтесь на уровень по щупу или контрольному отверстию.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
