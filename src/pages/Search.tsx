import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search as SearchIcon, ScanLine, Loader2, Settings2, Sparkles, ChevronRight, Info, HelpCircle, X, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { searchByVin, searchByCarDetails, suggestCarBodies, suggestCarModels, suggestCarEngines, suggestEnginePower, suggestTransmissions } from '../lib/gemini';
import { useAppStore } from '../store/useAppStore';
import { logUserAction } from '../lib/logger';
import { motion, AnimatePresence } from 'motion/react';

const POPULAR_BRANDS = [
  'Toyota', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki', 'Lexus', 'Infiniti', 'Acura',
  'Hyundai', 'KIA', 'Genesis',
  'Chery', 'Haval', 'Geely', 'Changan', 'Exeed', 'Omoda', 'Tank', 'Zeekr', 'Li Auto', 'BYD',
  'Volkswagen', 'Audi', 'BMW', 'Mercedes-Benz', 'Skoda', 'Porsche', 'Volvo', 'Land Rover', 'Jaguar', 'Peugeot', 'Renault',
  'Ford', 'Chevrolet', 'Dodge', 'Jeep', 'Cadillac', 'Chrysler', 'Tesla', 'Daihatsu'
].sort();

const YEARS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => (2026 - i).toString());

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addDynamicCar, canSearch, recordSearch } = useAppStore();
  
  const defaultTab = location.state?.tab || 'manual';
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // How it works modal
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  // Manual Search State
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [body, setBody] = useState('');
  const [engine, setEngine] = useState('');
  const [transmission, setTransmission] = useState('');
  const [isSearchingManual, setIsSearchingManual] = useState(false);
  const [manualError, setManualError] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  // Body Suggestions State
  const [bodySuggestions, setBodySuggestions] = useState<string[]>([]);
  const [isLoadingBodies, setIsLoadingBodies] = useState(false);

  // Model Suggestions State
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Engine Suggestions State
  const [engineSuggestions, setEngineSuggestions] = useState<string[]>([]);
  const [isLoadingEngines, setIsLoadingEngines] = useState(false);

  // Power Suggestions State
  const [powerSuggestions, setPowerSuggestions] = useState<string[]>([]);
  const [isLoadingPower, setIsLoadingPower] = useState(false);

  // Transmission Suggestions State
  const [transmissionSuggestions, setTransmissionSuggestions] = useState<string[]>([]);
  const [isLoadingTransmissions, setIsLoadingTransmissions] = useState(false);

  const fetchModels = async () => {
    if (!brand) return;
    setIsLoadingModels(true);
    try {
      const models = await suggestCarModels(brand);
      setModelSuggestions(models);
    } catch (e) {
      console.error('Failed to fetch model suggestions', e);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const fetchBodies = async () => {
    if (!brand || !model || !year) return;
    setIsLoadingBodies(true);
    try {
      const bodies = await suggestCarBodies(brand, model, year);
      setBodySuggestions(bodies);
    } catch (e) {
      console.error('Failed to fetch body suggestions', e);
    } finally {
      setIsLoadingBodies(false);
    }
  };

  const fetchEngines = async () => {
    if (!brand || !model || !year || !body) return;
    setIsLoadingEngines(true);
    try {
      const engines = await suggestCarEngines(brand, model, year, body);
      setEngineSuggestions(engines);
    } catch (e) {
      console.error('Failed to fetch engine suggestions', e);
    } finally {
      setIsLoadingEngines(false);
    }
  };

  const fetchPower = async () => {
    if (!brand || !model || !year || !body || !engine) return;
    setIsLoadingPower(true);
    try {
      const powers = await suggestEnginePower(brand, model, year, body, engine);
      setPowerSuggestions(powers);
    } catch (e) {
      console.error('Failed to fetch power suggestions', e);
    } finally {
      setIsLoadingPower(false);
    }
  };

  const fetchTransmissions = async () => {
    if (!brand || !model || !year || !body || !engine) return;
    setIsLoadingTransmissions(true);
    try {
      const transmissions = await suggestTransmissions(brand, model, year, body, engine);
      setTransmissionSuggestions(transmissions);
    } catch (e) {
      console.error('Failed to fetch transmission suggestions', e);
    } finally {
      setIsLoadingTransmissions(false);
    }
  };

  // VIN Search State
  const [vin, setVin] = useState('');
  const [isSearchingVin, setIsSearchingVin] = useState(false);
  const [vinError, setVinError] = useState('');

  // Common Parameters
  const [mileage, setMileage] = useState('');
  const [conditions, setConditions] = useState('');
  const [power, setPower] = useState('');
  const [handDrive, setHandDrive] = useState('');
  const [fuelType, setFuelType] = useState('');

  const handleManualSearch = async () => {
    if (!brand || !model || !body || !transmission) {
      setManualError('Пожалуйста, заполните марку, модель, кузов и тип трансмиссии');
      return;
    }
    
    const { allowed, remainingMinutes } = canSearch();
    if (!allowed) {
      setManualError(`Лимит поисков исчерпан. Пожалуйста, подождите ${remainingMinutes} мин.`);
      return;
    }
    
    setIsSearchingManual(true);
    setManualError('');
    setSearchStatus('Инициализация...');
    
    try {
      const carData = await searchByCarDetails(brand, model, year, body, engine, transmission, mileage, conditions, power, handDrive, fuelType, (status) => setSearchStatus(status));
      recordSearch();
      addDynamicCar(carData);
      logUserAction('search_manual', `Поиск по авто: ${brand} ${model} ${year} ${body} ${engine} ${transmission}`);
      navigate(`/result/${carData.id}`);
    } catch (error: any) {
      console.error('Manual Search Error:', error);
      setManualError(error.message || 'Не удалось найти данные по этому автомобилю. Проверьте правильность ввода.');
    } finally {
      setIsSearchingManual(false);
      setSearchStatus('');
    }
  };

  const handleVinSearch = async () => {
    if (!vin || vin.length < 10) {
      setVinError('Введите корректный VIN код (минимум 10 символов)');
      return;
    }
    
    const { allowed, remainingMinutes } = canSearch();
    if (!allowed) {
      setVinError(`Лимит поисков исчерпан. Пожалуйста, подождите ${remainingMinutes} мин.`);
      return;
    }
    
    setIsSearchingVin(true);
    setVinError('');
    setSearchStatus('Инициализация...');
    
    try {
      const carData = await searchByVin(vin, mileage, conditions, power, handDrive, fuelType, (status) => setSearchStatus(status));
      recordSearch();
      addDynamicCar(carData);
      logUserAction('search_vin', `Поиск по VIN: ${vin}`);
      navigate(`/result/${carData.id}`);
    } catch (error: any) {
      console.error('VIN Search Error:', error);
      setVinError(error.message || 'Не удалось распознать VIN или найти данные. Попробуйте ручной поиск.');
    } finally {
      setIsSearchingVin(false);
      setSearchStatus('');
    }
  };

  const renderCommonParams = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 pt-4 mt-4 border-t border-zinc-800"
    >
      <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-300">
        <Settings2 size={16} />
        Уточняющие параметры (опционально)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500">Пробег</label>
          <Select value={mileage} onChange={(e) => setMileage(e.target.value)} className="rounded-xl bg-zinc-900/50 border border-white/5 focus:ring-2 focus:ring-blue-500 transition-all">
            <option value="">Не указан</option>
            <option value="До 50 000 км">До 50 000 км</option>
            <option value="50 000 - 100 000 км">50 000 - 100 000 км</option>
            <option value="100 000 - 150 000 км">100 000 - 150 000 км</option>
            <option value="Более 150 000 км">Более 150 000 км</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500">Условия эксплуатации</label>
          <Select value={conditions} onChange={(e) => setConditions(e.target.value)} className="rounded-xl bg-zinc-900/50 border border-white/5 focus:ring-2 focus:ring-blue-500 transition-all">
            <option value="">Обычные</option>
            <option value="Город (пробки)">Город (пробки)</option>
            <option value="Трасса">Трасса</option>
            <option value="Смешанный">Смешанный</option>
            <option value="Тяжелые (бездорожье, прицеп)">Тяжелые (бездорожье, прицеп)</option>
            <option value="Спортивная езда">Спортивная езда</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500">Расположение руля</label>
          <Select value={handDrive} onChange={(e) => setHandDrive(e.target.value)} className="rounded-xl bg-zinc-900/50 border border-white/5 focus:ring-2 focus:ring-blue-500 transition-all">
            <option value="">Не указано</option>
            <option value="Левый">Левый</option>
            <option value="Правый">Правый</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500">Тип топлива</label>
          <Select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="rounded-xl bg-zinc-900/50 border border-white/5 focus:ring-2 focus:ring-blue-500 transition-all">
            <option value="">Не указано</option>
            <option value="Бензин">Бензин</option>
            <option value="Дизель">Дизель</option>
            <option value="Гибрид">Гибрид</option>
          </Select>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-2 flex justify-between items-start"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Выбор авто</h1>
          <p className="text-zinc-400">
            Укажите параметры или введите VIN для точного подбора
          </p>
        </div>
        <button 
          onClick={() => setShowHowItWorks(true)}
          className="p-2 bg-zinc-800 rounded-full text-zinc-300 hover:bg-zinc-700 transition-colors"
          title="Как это работает?"
        >
          <Info size={24} />
        </button>
      </motion.div>

      <AnimatePresence>
        {showHowItWorks && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHowItWorks(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass-heavy rounded-3xl p-6 max-w-md w-full shadow-2xl relative max-h-[80vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowHowItWorks(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="text-blue-500" />
                Как это работает?
              </h2>
              
              <div className="space-y-4 text-zinc-300 text-sm leading-relaxed">
                <p>
                  Наше приложение использует передовые технологии для точного подбора масел и жидкостей для вашего автомобиля.
                </p>
                
                <div className="bg-zinc-800/50 p-4 rounded-2xl space-y-3 border border-zinc-800">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                    <p><strong>Сбор данных:</strong> Вы вводите VIN-код или параметры автомобиля.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                    <p><strong>Поиск в каталоге:</strong> Мы обращаемся к официальным базам данных для получения точных заводских допусков и заправочных объемов.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                    <p><strong>Анализ нейросетью:</strong> ИИ анализирует полученные данные, учитывает ваш пробег и условия эксплуатации.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">4</div>
                    <p><strong>Рекомендации:</strong> Вы получаете список лучших продуктов (Ravenol, Motul, Bardahl), идеально подходящих для вашего авто.</p>
                  </div>
                </div>
                
                <p className="text-xs text-zinc-400 mt-4">
                  Мы гарантируем высокую точность данных благодаря использованию официальных баз и интеллектуальных алгоритмов обработки.
                </p>
              </div>
              
              <Button 
                onClick={() => setShowHowItWorks(false)}
                className="w-full mt-6 rounded-xl h-12 font-semibold"
              >
                Понятно, спасибо
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-blue-900/20 p-4 rounded-2xl border border-blue-800/50 flex gap-3 items-start">
        <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-blue-300 leading-relaxed">
          Для точного подбора жидкостей, пожалуйста, убедитесь, что вы указали корректные данные или правильный VIN-код.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 liquid-glass p-1 rounded-2xl">
          <TabsTrigger value="manual" className="flex items-center gap-1.5 rounded-xl transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            По автомобилю
          </TabsTrigger>
          <TabsTrigger value="vin" className="flex items-center gap-1.5 rounded-xl transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            По VIN коду
            <span className="px-1.5 py-0.5 bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider rounded-md">
              Beta
            </span>
          </TabsTrigger>
        </TabsList>
        
        <AnimatePresence mode="wait">
          {activeTab === 'manual' && (
            <TabsContent value="manual" key="manual" forceMount>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-none shadow-xl liquid-glass rounded-3xl overflow-hidden">
                  <CardContent className="pt-6 space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-300">Марка автомобиля</label>
                      <Input 
                        list="brands-list"
                        placeholder="Например: Toyota" 
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        disabled={isSearchingManual}
                        className="h-12 rounded-xl bg-zinc-800/50 border-none focus:ring-2 focus:ring-blue-500 transition-all text-zinc-100"
                      />
                      <datalist id="brands-list">
                        {POPULAR_BRANDS.map(b => <option key={b} value={b} />)}
                      </datalist>
                    </div>

                    <div className="space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                          Модель
                          {isLoadingModels && <div className="ai-loader" />}
                        </label>
                        {brand && !modelSuggestions.length && !isLoadingModels && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={fetchModels}
                            className="text-[9px] font-bold text-white flex items-center gap-1 shimmer-ai-bg px-2 py-1 rounded-lg hover:opacity-90 transition-all shadow-md shadow-blue-500/10"
                          >
                            <Sparkles size={10} className="animate-pulse" />
                            <span>AI ПОДБОР</span>
                          </motion.button>
                        )}
                      </div>
                      <Input 
                        list="models-list"
                        placeholder="Например: Camry" 
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        disabled={isSearchingManual}
                        className="h-12 rounded-xl bg-zinc-800/50 border-none focus:ring-2 focus:ring-blue-500 transition-all text-zinc-100"
                      />
                      <datalist id="models-list">
                        {modelSuggestions.map(m => <option key={m} value={m} />)}
                      </datalist>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-300">Год <span className="text-zinc-400 font-normal">(опц.)</span></label>
                        <Select 
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          disabled={isSearchingManual}
                          className="h-12 rounded-xl bg-zinc-900/50 border border-white/5 focus:ring-2 focus:ring-blue-500 transition-all text-zinc-100"
                        >
                          <option value="">Выберите год</option>
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </Select>
                      </div>
                      <div className="space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                            Кузов
                            {isLoadingBodies && <div className="ai-loader" />}
                          </label>
                          {brand && model && year.length === 4 && !bodySuggestions.length && !isLoadingBodies && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={fetchBodies}
                              className="text-[9px] font-bold text-white flex items-center gap-1 shimmer-ai-bg px-2 py-1 rounded-lg hover:opacity-90 transition-all shadow-md shadow-blue-500/10"
                            >
                              <Sparkles size={10} className="animate-pulse" />
                              <span>AI ПОДБОР</span>
                            </motion.button>
                          )}
                        </div>
                        <Input 
                          list="body-list"
                          placeholder="XV70" 
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          disabled={isSearchingManual}
                          className="h-12 rounded-xl bg-zinc-800/50 border-none focus:ring-2 focus:ring-blue-500 transition-all text-zinc-100"
                        />
                        <datalist id="body-list">
                          {bodySuggestions.map(b => <option key={b} value={b} />)}
                        </datalist>
                      </div>
                    </div>

                    <div className="space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                          Двигатель <span className="text-zinc-400 font-normal">(опц.)</span>
                          {isLoadingEngines && <div className="ai-loader" />}
                        </label>
                        {brand && model && body && !engineSuggestions.length && !isLoadingEngines && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={fetchEngines}
                            className="text-[9px] font-bold text-white flex items-center gap-1 shimmer-ai-bg px-2 py-1 rounded-lg hover:opacity-90 transition-all shadow-md shadow-blue-500/10"
                          >
                            <Sparkles size={10} className="animate-pulse" />
                            <span>AI ПОДБОР</span>
                          </motion.button>
                        )}
                      </div>
                      <Input 
                        list="engines-list"
                        placeholder="2.5 или 2AR-FE" 
                        value={engine}
                        onChange={(e) => setEngine(e.target.value)}
                        disabled={isSearchingManual}
                        className="h-12 rounded-xl bg-zinc-800/50 border-none focus:ring-2 focus:ring-blue-500 transition-all text-zinc-100"
                      />
                      <datalist id="engines-list">
                        {engineSuggestions.map(e => <option key={e} value={e} />)}
                      </datalist>
                    </div>

                    <div className="space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                          Мощность двигателя <span className="text-zinc-400 font-normal">(опц.)</span>
                          {isLoadingPower && <div className="ai-loader" />}
                        </label>
                        {brand && model && body && engine && !powerSuggestions.length && !isLoadingPower && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={fetchPower}
                            className="text-[9px] font-bold text-white flex items-center gap-1 shimmer-ai-bg px-2 py-1 rounded-lg hover:opacity-90 transition-all shadow-md shadow-blue-500/10"
                          >
                            <Sparkles size={10} className="animate-pulse" />
                            <span>AI ПОДБОР</span>
                          </motion.button>
                        )}
                      </div>
                      <Input 
                        list="power-list"
                        placeholder="Например: 181 л.с. / 133 кВт" 
                        value={power}
                        onChange={(e) => setPower(e.target.value)}
                        disabled={isSearchingManual}
                        className="h-12 rounded-xl bg-zinc-800/50 border-none focus:ring-2 focus:ring-blue-500 transition-all text-zinc-100"
                      />
                      <datalist id="power-list">
                        {powerSuggestions.map(p => <option key={p} value={p} />)}
                      </datalist>
                    </div>

                    <div className="space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                          Тип трансмиссии <span className="text-red-500">*</span>
                          {isLoadingTransmissions && <div className="ai-loader" />}
                        </label>
                        {brand && model && body && engine && !transmissionSuggestions.length && !isLoadingTransmissions && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={fetchTransmissions}
                            className="text-[9px] font-bold text-white flex items-center gap-1 shimmer-ai-bg px-2 py-1 rounded-lg hover:opacity-90 transition-all shadow-md shadow-blue-500/10"
                          >
                            <Sparkles size={10} className="animate-pulse" />
                            <span>AI ПОДБОР</span>
                          </motion.button>
                        )}
                      </div>
                      
                      {transmissionSuggestions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {transmissionSuggestions.map((t) => {
                            const isSpecial = (t.toLowerCase().includes('механика') || t.toLowerCase().includes('мкпп')) && 
                                             (t.toLowerCase().includes('вариатор') || t.toLowerCase().includes('cvt'));
                            // Actually the user said "if manual AND cvt are available" (on the car), then mark them.
                            // So if BOTH exist in the suggestions, we mark them.
                            const hasManual = transmissionSuggestions.some(s => s.toLowerCase().includes('механика') || s.toLowerCase().includes('мкпп'));
                            const hasCVT = transmissionSuggestions.some(s => s.toLowerCase().includes('вариатор') || s.toLowerCase().includes('cvt'));
                            const shouldHighlight = hasManual && hasCVT && (t.toLowerCase().includes('механика') || t.toLowerCase().includes('мкпп') || t.toLowerCase().includes('вариатор') || t.toLowerCase().includes('cvt'));

                            return (
                              <motion.button
                                key={t}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setTransmission(t)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                                  transmission === t 
                                    ? 'border-blue-500 bg-blue-900/30 text-blue-300' 
                                    : shouldHighlight
                                      ? 'border-yellow-400 animate-shimmer-yellow text-zinc-100'
                                      : 'border-transparent bg-zinc-800 text-zinc-300'
                                }`}
                              >
                                {shouldHighlight && <span className="mr-1">★</span>}
                                {t}
                              </motion.button>
                            );
                          })}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setTransmissionSuggestions([])}
                            className="text-xs text-zinc-400"
                          >
                            Сбросить
                          </Button>
                        </div>
                      ) : (
                        <Select 
                          value={transmission}
                          onChange={(e) => setTransmission(e.target.value)}
                          disabled={isSearchingManual}
                          className="h-12 rounded-xl bg-zinc-900/50 border border-white/5 focus:ring-2 focus:ring-blue-500 transition-all text-zinc-100"
                        >
                          <option value="">Выберите трансмиссию</option>
                          <option value="АКПП">АКПП (Автомат)</option>
                          <option value="МКПП">МКПП (Механика)</option>
                          <option value="Вариатор (CVT)">Вариатор (CVT)</option>
                          <option value="Робот (DSG/DCT)">Робот (DSG/DCT)</option>
                        </Select>
                      )}
                    </div>

                    {renderCommonParams()}

                    <AnimatePresence>
                      {manualError && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-red-500 font-medium"
                        >
                          {manualError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    
                    <Button 
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 text-base font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95" 
                      size="lg"
                      disabled={!brand || !model || !body || isSearchingManual}
                      onClick={handleManualSearch}
                    >
                      {isSearchingManual ? (
                        <>
                          <div className="ai-loader mr-2" />
                          {searchStatus || 'Поиск в базе...'}
                        </>
                      ) : (
                        <>
                          <SearchIcon className="mr-2 h-5 w-5" />
                          Подобрать масла
                          <ChevronRight className="ml-2 h-5 w-5 opacity-50" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}
          
          {activeTab === 'vin' && (
            <TabsContent value="vin" key="vin" forceMount>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-none shadow-xl liquid-glass rounded-3xl overflow-hidden">
                  <CardContent className="pt-6 space-y-5">
                    <div className="p-4 bg-amber-900/20 border border-amber-800 rounded-2xl flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-amber-300">Внимание: BETA версия</p>
                        <p className="text-xs text-amber-400 leading-relaxed">
                          Поиск по VIN находится в стадии активного тестирования.
                          Рекомендуем проверять результаты или использовать ручной поиск.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-300">
                        VIN код автомобиля
                      </label>
                      <Input 
                        placeholder="WVGZZZ..." 
                        value={vin}
                        onChange={(e) => setVin(e.target.value.toUpperCase())}
                        disabled={isSearchingVin}
                        className="h-14 rounded-xl bg-zinc-800/50 border-none focus:ring-2 focus:ring-purple-500 uppercase font-mono text-lg tracking-wider transition-all"
                        maxLength={17}
                      />
                      <AnimatePresence>
                        {vinError && (
                          <motion.p 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-sm text-red-500 font-medium"
                          >
                            {vinError}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      <div className="p-4 rounded-2xl bg-purple-900/20 border border-purple-800/50">
                        <p className="text-xs text-purple-300 leading-relaxed flex gap-2">
                          <ScanLine size={14} className="flex-shrink-0 mt-0.5" />
                          ИИ проанализирует VIN и автоматически подберет подходящие жидкости.
                        </p>
                      </div>
                    </div>

                    {renderCommonParams()}

                    <Button 
                      className="w-full mt-4 shimmer-ai-bg hover:opacity-90 text-white rounded-2xl h-14 text-lg font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-95 border border-white/10" 
                      size="lg"
                      disabled={!vin || isSearchingVin}
                      onClick={handleVinSearch}
                    >
                      {isSearchingVin ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {searchStatus || 'Анализ VIN кода...'}
                        </>
                      ) : (
                        <>
                          <ScanLine className="mr-2 h-5 w-5" />
                          Найти по VIN
                          <ChevronRight className="ml-2 h-5 w-5 opacity-50" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
