import { GoogleGenAI, Type } from '@google/genai';
import { fetchRavenolData } from './ravenol';
import { CarData } from '../types';
import { decodeVin } from './vinApi';

const productSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    brand_name: { type: Type.STRING, description: "Must be 'Ravenol', 'Motul', 'BARDAHL', or 'Moly Green'" },
    product_name: { type: Type.STRING },
    category: { type: Type.STRING },
    viscosity: { type: Type.STRING },
    approvals: { type: Type.ARRAY, items: { type: Type.STRING } },
    description: { type: Type.STRING, description: "Описание продукта на РУССКОМ языке" }
  },
  required: ["id", "brand_name", "product_name", "category", "viscosity", "approvals"]
};

const recommendationSchema = {
  type: Type.OBJECT,
  properties: {
    unit: { type: Type.STRING, description: "Название узла на РУССКОМ языке (например: 'Двигатель', 'АКПП', 'Раздаточная коробка', 'Передний мост', 'Задний мост', 'ГУР', 'Антифриз')" },
    fluid_type: { type: Type.STRING },
    factory_viscosity: { type: Type.STRING, description: "Вязкость, рекомендованная заводом-изготовителем" },
    recommended_viscosity: { type: Type.STRING, description: "Вязкость, рекомендованная с учетом пробега и условий эксплуатации" },
    specification: { type: Type.STRING },
    approval: { type: Type.STRING },
    volume_liters: { type: Type.NUMBER },
    replacement_interval: { type: Type.STRING, description: "Интервал замены на РУССКОМ языке" },
    products: { type: Type.ARRAY, items: productSchema }
  },
  required: ["unit", "fluid_type", "factory_viscosity", "recommended_viscosity", "specification", "approval", "volume_liters", "replacement_interval", "products"]
};

const carDataSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    brand: { type: Type.STRING },
    model: { type: Type.STRING },
    year_from: { type: Type.INTEGER },
    year_to: { type: Type.INTEGER },
    generation: { type: Type.STRING },
    engine: { type: Type.STRING },
    engine_code: { type: Type.STRING },
    engine_type: { type: Type.STRING, description: "'petrol', 'diesel', 'hybrid', or 'gas'" },
    drive: { type: Type.STRING, description: "'fwd', 'rwd', or 'awd'" },
    transmission_type: { type: Type.STRING, description: "'mt', 'at', 'cvt', or 'dsg'" },
    recommendations: { type: Type.ARRAY, items: recommendationSchema }
  },
  required: ["id", "brand", "model", "year_from", "year_to", "generation", "engine", "engine_code", "engine_type", "drive", "transmission_type", "recommendations"]
};

function getGeminiClient() {
  // 1. Try VITE_ prefix (Standard for Vite/Vercel)
  // 2. Try process.env (AI Studio injection via define)
  let apiKey = '';
  
  try { apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY; } catch (e) {}
  
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    try { apiKey = process.env.GEMINI_API_KEY; } catch (e) {}
  }
  
  apiKey = (apiKey || '').trim();
  
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'undefined' || apiKey === 'null') {
    console.error('Gemini API Key is missing. Checked import.meta.env.VITE_GEMINI_API_KEY and process.env.GEMINI_API_KEY');
    throw new Error('API ключ Gemini не настроен. Пожалуйста, добавьте VITE_GEMINI_API_KEY в настройки Vercel или Secrets в AI Studio.');
  }

  return new GoogleGenAI({ apiKey });
}

const FREE_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-pro-preview'
];

let currentModelIndex = 0; // Global rotation index

async function callGeminiWithRetry(ai: any, params: any, retries = 3): Promise<any> {
  let attempt = 0;
  const totalAttempts = retries * FREE_MODELS.length;
  
  while (attempt < totalAttempts) {
    const currentModel = FREE_MODELS[currentModelIndex];
    try {
      params.model = currentModel;
      console.log(`Calling Gemini (${currentModel}), attempt ${attempt + 1}/${totalAttempts}...`);
      
      const response = await ai.models.generateContent(params);
      
      // On success, we stay on the current working model
      return response;
    } catch (error: any) {
      const errorMsg = error.message || '';
      console.error(`Gemini error (${currentModel}):`, errorMsg);

      const isQuotaError = errorMsg.includes('429') || 
                          errorMsg.includes('quota') || 
                          errorMsg.includes('RESOURCE_EXHAUSTED') ||
                          errorMsg.includes('Too Many Requests');

      const isClientError = errorMsg.includes('400') || 
                           errorMsg.includes('INVALID_ARGUMENT') ||
                           errorMsg.includes('401') ||
                           errorMsg.includes('403') ||
                           errorMsg.includes('PERMISSION_DENIED');
      
      if (isClientError && !isQuotaError) {
        if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key not valid')) {
          throw new Error('Указан неверный API ключ Gemini. Проверьте правильность ключа в Vercel (VITE_GEMINI_API_KEY).');
        }
        throw new Error(`Ошибка запроса к ИИ: ${errorMsg.substring(0, 100)}...`); // Don't retry on fatal client errors
      }

      // Rotate immediately on error
      currentModelIndex = (currentModelIndex + 1) % FREE_MODELS.length;
      attempt++;
      
      if (attempt < totalAttempts) {
        // Small delay before retry (shorter for quota errors to quickly switch)
        const delay = isQuotaError ? 500 : Math.pow(2, Math.floor(attempt / FREE_MODELS.length)) * 1000;
        console.warn(`Переключение на модель ${FREE_MODELS[currentModelIndex]} через ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Все доступные модели ИИ временно перегружены или исчерпали лимит. Пожалуйста, попробуйте через минуту.');
}

async function getGeminiVinHint(ai: any, vin: string): Promise<string | null> {
  try {
    const prompt = `Decode this VIN: ${vin}. Return ONLY the Brand and Model. Example: "BMW X4". 
    IMPORTANT: This is a specialized task. Do not guess. 
    If you are not 100% sure, return "Unknown".`;
    
    const response = await callGeminiWithRetry(ai, {
      contents: prompt,
      config: {
        temperature: 0,
      }
    }, 1);
    const text = response.text?.trim();
    return text === 'Unknown' ? null : text;
  } catch (e) {
    return null;
  }
}

export async function suggestCarBodies(brand: string, model: string, year: string): Promise<string[]> {
  const ai = getGeminiClient();

  const prompt = `List the known body codes (кузова/поколения) for ${brand} ${model} from the year ${year}. 
Return ONLY a JSON array of strings. Example: ["XV70", "XV50", "ASV70"].`;

  try {
    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Gemini failed", error);
    return [];
  }
}

export async function suggestCarModels(brand: string): Promise<string[]> {
  const ai = getGeminiClient();

  const prompt = `List the most popular car models for the brand ${brand}.
Return ONLY a JSON array of strings. Example: ["Camry", "Corolla", "RAV4"].`;

  try {
    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Gemini failed", error);
    return [];
  }
}

export async function suggestCarEngines(brand: string, model: string, year: string, body: string): Promise<string[]> {
  const ai = getGeminiClient();

  const prompt = `List the known engine codes and volumes (двигатели) for ${brand} ${model} ${year} (${body}).
Return ONLY a JSON array of strings. Example: ["2.5 2AR-FE", "3.5 2GR-FKS", "2.0 M20A-FKS"].`;

  try {
    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Gemini failed", error);
    return [];
  }
}

export async function suggestEnginePower(brand: string, model: string, year: string, body: string, engine: string): Promise<string[]> {
  const ai = getGeminiClient();

  const prompt = `List the known engine power options (л.с. / кВт) for ${brand} ${model} ${year} (${body}) with engine ${engine}.
Return ONLY a JSON array of strings. Example: ["181 л.с. / 133 кВт", "249 л.с. / 183 кВт"].`;

  try {
    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Gemini failed", error);
    return [];
  }
}

export async function suggestTransmissions(brand: string, model: string, year: string, body: string, engine: string): Promise<string[]> {
  const ai = getGeminiClient();

  const prompt = `List the known transmission types (КПП) for ${brand} ${model} ${year} (${body}) with engine ${engine}.
Return ONLY a JSON array of strings. Example: ["АКПП", "МКПП", "Вариатор (CVT)", "Робот (DSG/DCT)"].`;

  try {
    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Gemini failed", error);
    return [];
  }
}

export async function searchByVin(vin: string, mileage?: string, conditions?: string, power?: string, handDrive?: string, fuelType?: string, onStatusChange?: (status: string) => void): Promise<CarData> {
  const ai = getGeminiClient();

  onStatusChange?.('Поиск в каталоге...');
  
  // 1. Try Ravenol by VIN directly first (highest priority)
  let ravenolData = await fetchRavenolData(vin);
  let vehicleHint: string | undefined;

  // 2. If not found, try NHTSA Decoder
  if (!ravenolData) {
    onStatusChange?.('Идентификация автомобиля...');
    const vehicle = await decodeVin(vin);
    if (vehicle) {
      vehicleHint = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
      onStatusChange?.(`Поиск технических данных...`);
      ravenolData = await fetchRavenolData(vin, vehicleHint);
    }
  }

  // 3. If still not found, try Gemini for a hint (neural network as last resort for decoding)
  if (!ravenolData) {
    onStatusChange?.('Интеллектуальный анализ VIN...');
    const geminiHint = await getGeminiVinHint(ai, vin);
    if (geminiHint) {
      vehicleHint = geminiHint;
      onStatusChange?.(`Поиск технических данных...`);
      ravenolData = await fetchRavenolData(vin, geminiHint);
    }
  }
  
  if (!ravenolData && !vehicleHint) {
    throw new Error('Автомобиль с таким VIN не найден. Пожалуйста, проверьте VIN или воспользуйтесь ручным поиском.');
  }

  let prompt = '';
  if (!ravenolData) {
    prompt = `Expert Oil Selector.
1. Identify: VIN ${vin}. Vehicle hint: ${vehicleHint}.
2. TASK: Use your internal knowledge to provide the most accurate technical data for this vehicle.
3. RECOMMENDATIONS:
   - Provide recommendations based on factory data.
   - IMPORTANT: For each product, list ONLY the approvals and specifications that are DIRECTLY RELEVANT to this specific car's requirements. Do not list all approvals the product has.
   - Adjust "recommended_viscosity" based on: Mileage: ${mileage || 'Not specified'}, Conditions: ${conditions || 'Normal'}, Power: ${power || 'Not specified'}, Hand Drive: ${handDrive || 'Not specified'}, Fuel Type: ${fuelType || 'Not specified'}.
   - For each unit, you MUST provide ALL suitable products from Ravenol mentioned in the catalog. 
   - Also provide multiple options from Motul and Bardahl for each unit.
   - If the car is Japanese, also include multiple options from Moly Green.
   - Do not limit yourself to one product per brand; if there are multiple suitable ones (e.g., different lines like VMP, DXG, etc.), list them all.
4. NO Liqui Moly.
5. OUTPUT: Return JSON (Russian text).`;
  } else {
    prompt = `Expert Oil Selector.
1. Identify: VIN ${vin}. ${vehicleHint ? `Vehicle hint: ${vehicleHint}.` : ''}
2. SOURCE OF TRUTH: Use the following extracted data. This data is the FINAL AUTHORITY for this specific vehicle.
<technical_data>
${ravenolData.substring(0, 50000)}
</technical_data>
3. MANDATORY TASK: 
   - You MUST identify the car EXACTLY as it is written in the <technical_data>. 
   - Extract ALL exact volumes, ALL OEM specifications, and ALL factory viscosities from the <technical_data>.
4. RECOMMENDATIONS:
   - Provide recommendations based on the factory data.
   - IMPORTANT: For each product, list ONLY the approvals and specifications that are DIRECTLY RELEVANT to this specific car's requirements. Do not list all approvals the product has.
   - For "factory_viscosity", list ALL viscosities mentioned in the catalog (e.g., "0W-20, 5W-30").
   - Adjust "recommended_viscosity" based on: Mileage: ${mileage || 'Not specified'}, Conditions: ${conditions || 'Normal'}, Power: ${power || 'Not specified'}, Hand Drive: ${handDrive || 'Not specified'}, Fuel Type: ${fuelType || 'Not specified'}.
   - For each unit, you MUST provide ALL suitable products from Ravenol mentioned in the catalog. 
   - Also provide multiple options from Motul and Bardahl for each unit.
   - If the car is Japanese, also include multiple options from Moly Green.
   - Do not limit yourself to one product per brand; if there are multiple suitable ones (e.g., different lines like VMP, DXG, etc.), list them all.
5. NO Liqui Moly.
6. OUTPUT: Return JSON (Russian text). Ensure "factory_viscosity" and "volume_liters" are exactly as in the catalog.`;
  }

  onStatusChange?.('Анализ данных...');
  try {
    const response = await callGeminiWithRetry(ai, {
      model: FREE_MODELS[0],
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: carDataSchema,
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) throw new Error('Пустой ответ от ИИ');
    
    let carData: CarData;
    try {
      carData = JSON.parse(text) as CarData;
    } catch (e) {
      console.error("Failed to parse JSON from Gemini:", text);
      throw new Error(`Ошибка парсинга ответа ИИ: ${text.substring(0, 50)}...`);
    }
    
    // Safety filter: ensure Liqui Moly is NEVER in the results
    if (carData.recommendations) {
      carData.recommendations.forEach(rec => {
        if (rec.products) {
          rec.products = rec.products.filter(p => 
            !p.brand_name.toLowerCase().includes('liqui') && 
            !p.brand_name.toLowerCase().includes('moly')
          );
        }
      });
    }

    if (carData.id === 'INVALID_VIN') {
      throw new Error('VIN-код не найден или недействителен');
    }
    return carData;
  } catch (error) {
    console.error("Gemini failed", error);
    throw error;
  }
}

export async function searchByCarDetails(brand: string, model: string, year?: string, body?: string, engine?: string, transmission?: string, mileage?: string, conditions?: string, power?: string, handDrive?: string, fuelType?: string, onStatusChange?: (status: string) => void): Promise<CarData> {
  const ai = getGeminiClient();

  const query = `${brand} ${model} ${year || ''} ${body || ''} ${engine || ''} ${transmission || ''}`.trim();
  
  onStatusChange?.('Поиск технических данных...');
  let ravenolData = await fetchRavenolData(query);

  // Fallback: if specific query fails, try a simpler one (Brand + Model + Body)
  if (!ravenolData && (year || body || engine)) {
    onStatusChange?.('Уточнение параметров...');
    const simplerQuery = `${brand} ${model} ${body || ''}`.trim();
    if (simplerQuery !== query) {
      ravenolData = await fetchRavenolData(simplerQuery, query);
    }
  }

  let prompt = '';
  if (!ravenolData) {
    onStatusChange?.('Интеллектуальный подбор...');
    prompt = `Expert Oil Selector. 
    TASK: Use your internal knowledge to provide the most accurate technical data for: ${query}.
    1. Identify the car: ${brand} ${model} ${year || ''} ${body || ''} ${engine || ''} ${transmission || ''}.
    2. Provide EXACT volumes, OEM specifications, and viscosities.
    3. RECOMMENDATIONS:
       - IMPORTANT: For each product, list ONLY the approvals and specifications that are DIRECTLY RELEVANT to this specific car's requirements. Do not list all approvals the product has.
       - For each unit, you MUST provide ALL suitable products from Ravenol mentioned in the catalog. 
       - Also provide multiple options from Motul and Bardahl for each unit.
       - If the car is Japanese, also include multiple options from Moly Green.
       - Do not limit yourself to one product per brand; if there are multiple suitable ones (e.g., different lines like VMP, DXG, etc.), list them all.
    4. NO Liqui Moly.
    5. OUTPUT: Return JSON (Russian text). 
    6. IMPORTANT: Add a note in the description of the first unit that this data is provided by AI because the official catalog was unreachable.`;
  } else {
    prompt = `Expert Oil Selector.
Vehicle: ${query}.
1. SOURCE OF TRUTH: Use the following extracted data. This data is the FINAL AUTHORITY for this vehicle.
<technical_data>
${ravenolData.substring(0, 50000)}
</technical_data>
2. MANDATORY TASK: 
   - You MUST identify the car EXACTLY as it is written in the <technical_data>.
   - Extract ALL exact volumes, ALL OEM specifications, and ALL factory viscosities from the <technical_data>.
3. RECOMMENDATIONS:
   - Provide recommendations based on the factory data.
   - IMPORTANT: For each product, list ONLY the approvals and specifications that are DIRECTLY RELEVANT to this specific car's requirements. Do not list all approvals the product has.
   - For "factory_viscosity", list ALL viscosities mentioned in the catalog (e.g., "0W-20, 5W-30").
   - Adjust "recommended_viscosity" based on: Mileage: ${mileage || 'Not specified'}, Conditions: ${conditions || 'Normal'}, Power: ${power || 'Not specified'}, Hand Drive: ${handDrive || 'Not specified'}, Fuel Type: ${fuelType || 'Not specified'}.
   - For each unit, you MUST provide ALL suitable products from Ravenol mentioned in the catalog. 
   - Also provide multiple options from Motul and Bardahl for each unit.
   - If the car is Japanese, also include multiple options from Moly Green.
   - Do not limit yourself to one product per brand; if there are multiple suitable ones (e.g., different lines like VMP, DXG, etc.), list them all.
4. Units: Engine, Transmission, Diffs, Steering, Coolant, Brake.
5. NO Liqui Moly.
6. OUTPUT: Return JSON (Russian text). Ensure "factory_viscosity" and "volume_liters" are exactly as in the catalog.`;
  }

  onStatusChange?.('Анализ данных...');
  try {
    const response = await callGeminiWithRetry(ai, {
      model: FREE_MODELS[0],
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: carDataSchema,
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) throw new Error('Пустой ответ от ИИ');
    
    let carData: CarData;
    try {
      carData = JSON.parse(text) as CarData;
    } catch (e) {
      console.error("Failed to parse JSON from Gemini:", text);
      throw new Error(`Ошибка парсинга ответа ИИ: ${text.substring(0, 50)}...`);
    }

    // Safety filter: ensure Liqui Moly is NEVER in the results
    if (carData.recommendations) {
      carData.recommendations.forEach(rec => {
        if (rec.products) {
          rec.products = rec.products.filter(p => 
            !p.brand_name.toLowerCase().includes('liqui') && 
            !p.brand_name.toLowerCase().includes('moly')
          );
        }
      });
    }

    return carData;
  } catch (error) {
    console.error("Gemini failed", error);
    throw error;
  }
}
