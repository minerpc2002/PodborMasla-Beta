import { CarData } from '../types';

// Base products to use in generated recommendations
const productsDB = {
  engine_oil: [
    { id: 'e1', brand_name: 'Ravenol', product_name: 'RAVENOL VST 5W-40', category: 'engine_oil', viscosity: '5W-40', approvals: ['API SN', 'ACEA A3/B4'], description: 'Полностью синтетическое ПАО моторное масло.' },
    { id: 'e2', brand_name: 'Motul', product_name: 'Motul 8100 X-cess gen2 5W-40', category: 'engine_oil', viscosity: '5W-40', approvals: ['API SN', 'ACEA A3/B4'], description: '100% синтетическое моторное масло.' },
    { id: 'e3', brand_name: 'BARDAHL', product_name: 'XTC 5W40', category: 'engine_oil', viscosity: '5W-40', approvals: ['API SN/CF', 'ACEA A3/B4'], description: 'Синтетическое моторное масло премиум класса.' },
    { id: 'e4', brand_name: 'Ravenol', product_name: 'RAVENOL FDS 5W-30', category: 'engine_oil', viscosity: '5W-30', approvals: ['API SL', 'ACEA A5/B5'], description: 'Синтетическое моторное масло.' },
    { id: 'e5', brand_name: 'Motul', product_name: 'Motul 8100 Eco-nergy 5W-30', category: 'engine_oil', viscosity: '5W-30', approvals: ['API SL', 'ACEA A5/B5'], description: 'Энергосберегающее 100% синтетическое масло.' },
    { id: 'e6', brand_name: 'Ravenol', product_name: 'RAVENOL VMP 5W-30', category: 'engine_oil', viscosity: '5W-30', approvals: ['VW 504 00', 'VW 507 00', 'ACEA C3'], description: 'Синтетическое среднезольное масло.' },
    { id: 'e7', brand_name: 'Motul', product_name: 'Motul Specific 504 00 507 00 5W-30', category: 'engine_oil', viscosity: '5W-30', approvals: ['VW 504 00', 'VW 507 00'], description: 'Специальное масло для VAG.' },
    { id: 'e8', brand_name: 'Ravenol', product_name: 'RAVENOL EFE 0W-16', category: 'engine_oil', viscosity: '0W-16', approvals: ['API SP', 'ILSAC GF-6B'], description: 'Полностью синтетическое ПАО моторное масло.' },
    { id: 'e9', brand_name: 'Motul', product_name: 'Motul 8100 Eco-lite 0W-20', category: 'engine_oil', viscosity: '0W-20', approvals: ['API SP', 'ILSAC GF-6A'], description: '100% синтетическое энергосберегающее моторное масло.' },
    { id: 'e11', brand_name: 'Moly Green', product_name: 'PRO S 5W-30', category: 'engine_oil', viscosity: '5W-30', approvals: ['API SN', 'ILSAC GF-5'], description: 'Синтетическое моторное масло для японских автомобилей.' },
    { id: 'e13', brand_name: 'Moly Green', product_name: 'Premium 0W-20', category: 'engine_oil', viscosity: '0W-20', approvals: ['API SP', 'ILSAC GF-6A'], description: 'Энергосберегающее масло высшего класса.' },
    { id: 'e15', brand_name: 'BARDAHL', product_name: 'XTC 10W-40', category: 'engine_oil', viscosity: '10W-40', approvals: ['API SN/CF', 'ACEA A3/B4'], description: 'Полусинтетическое моторное масло.' },
    { id: 'e16', brand_name: 'Motul', product_name: 'Sport Ester 5W-50', category: 'engine_oil', viscosity: '5W-50', approvals: ['API SM/CF'], description: 'Синтетическое масло на основе эстеров для спортивных авто.' },
    { id: 'e18', brand_name: 'Moly Green', product_name: 'Earth 0W-30', category: 'engine_oil', viscosity: '0W-30', approvals: ['API SP', 'ILSAC GF-6A'], description: 'Экологичное энергосберегающее масло.' },
  ],
  atf: [
    { id: 'a1', brand_name: 'Ravenol', product_name: 'RAVENOL ATF T-WS Lifetime', category: 'atf', viscosity: 'ATF WS', approvals: ['Toyota ATF WS'], description: 'Синтетическое трансмиссионное масло для АКПП.' },
    { id: 'a2', brand_name: 'Motul', product_name: 'Motul ATF VI', category: 'atf', viscosity: 'ATF VI', approvals: ['Dexron VI', 'Mercon LV'], description: '100% синтетическая жидкость для АКПП.' },
    { id: 'a3', brand_name: 'BARDAHL', product_name: 'ATF 8G', category: 'atf', viscosity: 'ATF', approvals: ['ZF 8HP', 'Toyota WS'], description: 'Синтетическая жидкость для современных АКПП.' },
  ],
  mtf: [
    { id: 'm1', brand_name: 'Ravenol', product_name: 'RAVENOL MTF-1 75W-85', category: 'mtf', viscosity: '75W-85', approvals: ['API GL-4'], description: 'Синтетическое трансмиссионное масло для МКПП.' },
    { id: 'm2', brand_name: 'Motul', product_name: 'Motul Motylgear 75W-90', category: 'mtf', viscosity: '75W-90', approvals: ['API GL-4/GL-5'], description: 'Трансмиссионное масло для МКПП.' },
  ],
  dsg: [
    { id: 'd1', brand_name: 'Ravenol', product_name: 'RAVENOL DCT/DSG Fluid', category: 'dsg', viscosity: '75W', approvals: ['VW G 052 182 A2'], description: 'Синтетическое масло для коробок DSG.' },
    { id: 'd2', brand_name: 'Motul', product_name: 'Motul Multi DCTF', category: 'dsg', viscosity: '75W', approvals: ['VW G 052 182'], description: 'Жидкость для коробок с двойным сцеплением.' },
  ],
  cvt: [
    { id: 'c1', brand_name: 'Ravenol', product_name: 'RAVENOL CVTF NS3/J4 Fluid', category: 'cvt', viscosity: 'CVTF', approvals: ['Nissan NS-3'], description: 'Синтетическое масло для вариаторов.' },
    { id: 'c2', brand_name: 'Motul', product_name: 'Motul CVTF', category: 'cvt', viscosity: 'CVTF', approvals: ['Nissan NS-3', 'Toyota TC'], description: 'Жидкость для бесступенчатых трансмиссий (CVT).' },
    { id: 'c3', brand_name: 'Moly Green', product_name: 'CVT Fluid', category: 'cvt', viscosity: 'CVTF', approvals: ['Nissan NS-2/NS-3', 'Toyota TC/FE'], description: 'Универсальная жидкость для вариаторов.' },
  ]
};

// Generator helper
const generateCar = (
  id: string, brand: string, model: string, year_from: number, year_to: number, generation: string, 
  engine: string, engine_code: string, engine_type: 'petrol' | 'diesel' | 'hybrid' | 'gas', 
  drive: 'fwd' | 'rwd' | 'awd', transmission_type: 'mt' | 'at' | 'cvt' | 'dsg', oilType: string
): CarData => {
  let engineProducts = [];
  let transProducts = [];
  
  if (oilType === '5W-40') engineProducts = [productsDB.engine_oil[0], productsDB.engine_oil[1], productsDB.engine_oil[2], productsDB.engine_oil[9]];
  else if (oilType === '5W-30 A5') engineProducts = [productsDB.engine_oil[3], productsDB.engine_oil[4], productsDB.engine_oil[10]];
  else if (oilType === '5W-30 C3') engineProducts = [productsDB.engine_oil[5], productsDB.engine_oil[6], productsDB.engine_oil[16]];
  else if (oilType === '0W-20') engineProducts = [productsDB.engine_oil[7], productsDB.engine_oil[8], productsDB.engine_oil[12]];
  else if (oilType === '0W-40') engineProducts = [productsDB.engine_oil[11]];
  else if (oilType === '0W-30') engineProducts = [productsDB.engine_oil[13], productsDB.engine_oil[17]];
  else if (oilType === '10W-40') engineProducts = [productsDB.engine_oil[14]];
  else if (oilType === '5W-50') engineProducts = [productsDB.engine_oil[15]];
  else engineProducts = [productsDB.engine_oil[0], productsDB.engine_oil[1]];

  if (transmission_type === 'at') transProducts = productsDB.atf;
  else if (transmission_type === 'mt') transProducts = productsDB.mtf;
  else if (transmission_type === 'dsg') transProducts = productsDB.dsg;
  else if (transmission_type === 'cvt') transProducts = productsDB.cvt;
  else transProducts = productsDB.atf;

  return {
    id, brand, model, year_from, year_to, generation, engine, engine_code, engine_type, drive, transmission_type,
    recommendations: [
      {
        unit: 'Двигатель',
        fluid_type: 'engine_oil',
        factory_viscosity: oilType.split(' ')[0],
        recommended_viscosity: oilType.split(' ')[0],
        specification: 'OEM Spec',
        approval: 'OEM Approval',
        volume_liters: 4.5,
        replacement_interval: '10 000 км / 1 год',
        products: engineProducts
      },
      {
        unit: transmission_type === 'mt' ? 'МКПП' : transmission_type === 'dsg' ? 'РКПП (DSG)' : transmission_type === 'cvt' ? 'Вариатор (CVT)' : 'АКПП',
        fluid_type: transmission_type === 'at' ? 'atf' : transmission_type === 'mt' ? 'mtf' : transmission_type,
        factory_viscosity: transmission_type === 'mt' ? '75W-90' : transmission_type === 'dsg' ? '75W' : 'ATF/CVTF',
        recommended_viscosity: transmission_type === 'mt' ? '75W-90' : transmission_type === 'dsg' ? '75W' : 'ATF/CVTF',
        specification: 'OEM Spec',
        approval: 'OEM Approval',
        volume_liters: transmission_type === 'mt' ? 2.0 : 7.0,
        replacement_interval: '60 000 км',
        products: transProducts as any
      }
    ]
  };
};

const generatedCars: CarData[] = [
  // Toyota
  generateCar('t1', 'Toyota', 'Camry', 2017, 2024, 'XV70', '2.5', 'A25A-FKS', 'petrol', 'fwd', 'at', '0W-20'),
  generateCar('t2', 'Toyota', 'Camry', 2011, 2017, 'XV50', '2.5', '2AR-FE', 'petrol', 'fwd', 'at', '5W-30 A5'),
  generateCar('t3', 'Toyota', 'Camry', 2011, 2017, 'XV50', '3.5', '2GR-FE', 'petrol', 'fwd', 'at', '5W-30 A5'),
  generateCar('t4', 'Toyota', 'Corolla', 2018, 2024, 'E210', '1.6', '1ZR-FE', 'petrol', 'fwd', 'cvt', '0W-20'),
  generateCar('t5', 'Toyota', 'RAV4', 2018, 2024, 'XA50', '2.0', 'M20A-FKS', 'petrol', 'awd', 'cvt', '0W-20'),
  generateCar('t6', 'Toyota', 'RAV4', 2012, 2018, 'XA40', '2.5', '2AR-FE', 'petrol', 'awd', 'at', '5W-30 A5'),
  generateCar('t7', 'Toyota', 'Land Cruiser Prado', 2009, 2023, '150', '3.0 D-4D', '1KD-FTV', 'diesel', 'awd', 'at', '5W-30 C3'),
  generateCar('t8', 'Toyota', 'Land Cruiser Prado', 2009, 2023, '150', '2.7', '2TR-FE', 'petrol', 'awd', 'at', '5W-30 A5'),
  generateCar('t9', 'Toyota', 'Land Cruiser', 2007, 2021, '200', '4.5 D-4D', '1VD-FTV', 'diesel', 'awd', 'at', '5W-30 C3'),
  
  // Volkswagen
  generateCar('v1', 'Volkswagen', 'Tiguan', 2016, 2024, 'II (AD1)', '2.0 TSI', 'CHHB', 'petrol', 'awd', 'dsg', '5W-30 C3'),
  generateCar('v2', 'Volkswagen', 'Tiguan', 2016, 2024, 'II (AD1)', '1.4 TSI', 'CZDA', 'petrol', 'fwd', 'dsg', '5W-30 C3'),
  generateCar('v3', 'Volkswagen', 'Polo', 2010, 2020, 'V', '1.6 MPI', 'CFNA', 'petrol', 'fwd', 'at', '5W-40'),
  generateCar('v4', 'Volkswagen', 'Polo', 2010, 2020, 'V', '1.6 MPI', 'CWVA', 'petrol', 'fwd', 'mt', '5W-40'),
  generateCar('v5', 'Volkswagen', 'Golf', 2012, 2020, 'VII', '1.4 TSI', 'CXSA', 'petrol', 'fwd', 'dsg', '5W-30 C3'),
  generateCar('v6', 'Volkswagen', 'Passat', 2014, 2023, 'B8', '2.0 TDI', 'DFGA', 'diesel', 'fwd', 'dsg', '5W-30 C3'),
  generateCar('v7', 'Volkswagen', 'Touareg', 2010, 2018, 'NF', '3.0 TDI', 'CRCA', 'diesel', 'awd', 'at', '5W-30 C3'),

  // Hyundai
  generateCar('h1', 'Hyundai', 'Solaris', 2017, 2024, 'II', '1.6', 'G4FG', 'petrol', 'fwd', 'at', '5W-30 A5'),
  generateCar('h2', 'Hyundai', 'Solaris', 2010, 2017, 'I', '1.4', 'G4FA', 'petrol', 'fwd', 'mt', '5W-30 A5'),
  generateCar('h3', 'Hyundai', 'Creta', 2016, 2021, 'I', '1.6', 'G4FG', 'petrol', 'fwd', 'at', '5W-30 A5'),
  generateCar('h4', 'Hyundai', 'Creta', 2016, 2021, 'I', '2.0', 'G4NA', 'petrol', 'awd', 'at', '5W-30 A5'),
  generateCar('h5', 'Hyundai', 'Tucson', 2015, 2021, 'III', '2.0', 'G4NA', 'petrol', 'awd', 'at', '5W-30 A5'),
  generateCar('h6', 'Hyundai', 'Santa Fe', 2018, 2024, 'IV', '2.2 CRDi', 'D4HB', 'diesel', 'awd', 'at', '5W-30 C3'),

  // KIA
  generateCar('k1', 'KIA', 'Rio', 2017, 2024, 'IV', '1.6', 'G4FG', 'petrol', 'fwd', 'at', '5W-30 A5'),
  generateCar('k2', 'KIA', 'Rio', 2011, 2017, 'III', '1.4', 'G4FA', 'petrol', 'fwd', 'mt', '5W-30 A5'),
  generateCar('k3', 'KIA', 'Sportage', 2015, 2021, 'IV', '2.0', 'G4NA', 'petrol', 'awd', 'at', '5W-30 A5'),
  generateCar('k4', 'KIA', 'Sportage', 2010, 2015, 'III', '2.0', 'G4KD', 'petrol', 'awd', 'at', '5W-30 A5'),
  generateCar('k5', 'KIA', 'Optima', 2015, 2020, 'IV', '2.4', 'G4KJ', 'petrol', 'fwd', 'at', '5W-30 A5'),
  generateCar('k6', 'KIA', 'Sorento', 2014, 2020, 'III Prime', '2.2 CRDi', 'D4HB', 'diesel', 'awd', 'at', '5W-30 C3'),

  // Lada
  generateCar('l1', 'Lada', 'Vesta', 2015, 2024, 'I', '1.6', 'VAZ-21129', 'petrol', 'fwd', 'mt', '5W-40'),
  generateCar('l2', 'Lada', 'Vesta', 2015, 2024, 'I', '1.8', 'VAZ-21179', 'petrol', 'fwd', 'mt', '5W-40'),
  generateCar('l3', 'Lada', 'Granta', 2011, 2024, 'I', '1.6 8V', 'VAZ-11186', 'petrol', 'fwd', 'mt', '5W-40'),
  generateCar('l4', 'Lada', 'Granta', 2011, 2024, 'I', '1.6 16V', 'VAZ-21127', 'petrol', 'fwd', 'at', '5W-40'),
  generateCar('l5', 'Lada', 'Niva Legend', 1977, 2024, 'I', '1.7', 'VAZ-21214', 'petrol', 'awd', 'mt', '5W-40'),
  generateCar('l6', 'Lada', 'Largus', 2012, 2024, 'I', '1.6 16V', 'K4M', 'petrol', 'fwd', 'mt', '5W-40'),

  // Skoda
  generateCar('s1', 'Skoda', 'Octavia', 2013, 2020, 'A7', '1.4 TSI', 'CHPA', 'petrol', 'fwd', 'dsg', '5W-30 C3'),
  generateCar('s2', 'Skoda', 'Octavia', 2013, 2020, 'A7', '1.8 TSI', 'CJSA', 'petrol', 'fwd', 'dsg', '5W-30 C3'),
  generateCar('s3', 'Skoda', 'Rapid', 2012, 2020, 'I', '1.6 MPI', 'CWVA', 'petrol', 'fwd', 'at', '5W-40'),
  generateCar('s4', 'Skoda', 'Rapid', 2012, 2020, 'I', '1.4 TSI', 'CZCA', 'petrol', 'fwd', 'dsg', '5W-30 C3'),
  generateCar('s5', 'Skoda', 'Kodiaq', 2016, 2024, 'I', '2.0 TSI', 'CZPA', 'petrol', 'awd', 'dsg', '5W-30 C3'),
  generateCar('s6', 'Skoda', 'Superb', 2015, 2024, 'III', '2.0 TSI', 'CHHB', 'petrol', 'fwd', 'dsg', '5W-30 C3'),

  // Renault
  generateCar('r1', 'Renault', 'Duster', 2010, 2021, 'I', '1.6', 'K4M', 'petrol', 'awd', 'mt', '5W-40'),
  generateCar('r2', 'Renault', 'Duster', 2010, 2021, 'I', '2.0', 'F4R', 'petrol', 'awd', 'at', '5W-40'),
  generateCar('r3', 'Renault', 'Duster', 2010, 2021, 'I', '1.5 dCi', 'K9K', 'diesel', 'awd', 'mt', '5W-30 C3'),
  generateCar('r4', 'Renault', 'Logan', 2014, 2022, 'II', '1.6', 'K7M', 'petrol', 'fwd', 'mt', '5W-40'),
  generateCar('r5', 'Renault', 'Kaptur', 2016, 2024, 'I', '1.6', 'H4M', 'petrol', 'fwd', 'cvt', '5W-40'),
  generateCar('r6', 'Renault', 'Arkana', 2019, 2024, 'I', '1.3 TCe', 'H5H', 'petrol', 'awd', 'cvt', '5W-30 C3'),

  // BMW
  generateCar('b1', 'BMW', '3 Series', 2011, 2019, 'F30', '2.0', 'N20B20', 'petrol', 'rwd', 'at', '5W-30 C3'),
  generateCar('b2', 'BMW', '3 Series', 2011, 2019, 'F30', '2.0d', 'N47D20', 'diesel', 'rwd', 'at', '5W-30 C3'),
  generateCar('b3', 'BMW', '5 Series', 2010, 2017, 'F10', '2.0', 'N20B20', 'petrol', 'rwd', 'at', '5W-30 C3'),
  generateCar('b4', 'BMW', '5 Series', 2017, 2024, 'G30', '2.0d', 'B47D20', 'diesel', 'awd', 'at', '5W-30 C3'),
  generateCar('b5', 'BMW', 'X5', 2013, 2018, 'F15', '3.0d', 'N57D30', 'diesel', 'awd', 'at', '5W-30 C3'),
  generateCar('b6', 'BMW', 'X3', 2010, 2017, 'F25', '2.0d', 'N47D20', 'diesel', 'awd', 'at', '5W-30 C3'),

  // Mercedes-Benz
  generateCar('m1', 'Mercedes-Benz', 'E-Class', 2016, 2023, 'W213', '2.0', 'M274', 'petrol', 'rwd', 'at', '5W-40'),
  generateCar('m2', 'Mercedes-Benz', 'E-Class', 2009, 2016, 'W212', '1.8', 'M271', 'petrol', 'rwd', 'at', '5W-40'),
  generateCar('m3', 'Mercedes-Benz', 'C-Class', 2014, 2021, 'W205', '2.0', 'M274', 'petrol', 'rwd', 'at', '5W-40'),
  generateCar('m4', 'Mercedes-Benz', 'GLC', 2015, 2022, 'X253', '2.1d', 'OM651', 'diesel', 'awd', 'at', '5W-30 C3'),
  generateCar('m5', 'Mercedes-Benz', 'GLE', 2015, 2019, 'W166', '3.0d', 'OM642', 'diesel', 'awd', 'at', '5W-30 C3'),

  // Audi
  generateCar('a1', 'Audi', 'A4', 2015, 2024, 'B9', '2.0 TFSI', 'CYRB', 'petrol', 'awd', 'dsg', '5W-30 C3'),
  generateCar('a2', 'Audi', 'A6', 2011, 2018, 'C7', '2.0 TFSI', 'CDNB', 'petrol', 'fwd', 'dsg', '5W-30 C3'),
  generateCar('a3', 'Audi', 'A6', 2011, 2018, 'C7', '3.0 TDI', 'CDUC', 'diesel', 'awd', 'dsg', '5W-30 C3'),
  generateCar('a4', 'Audi', 'Q5', 2008, 2017, '8R', '2.0 TFSI', 'CDNC', 'petrol', 'awd', 'dsg', '5W-30 C3'),
  generateCar('a5', 'Audi', 'Q7', 2015, 2024, '4M', '3.0 TDI', 'CRTC', 'diesel', 'awd', 'at', '5W-30 C3'),

  // Nissan
  generateCar('n1', 'Nissan', 'Qashqai', 2013, 2021, 'J11', '2.0', 'MR20DD', 'petrol', 'fwd', 'cvt', '5W-30 A5'),
  generateCar('n2', 'Nissan', 'Qashqai', 2006, 2013, 'J10', '1.6', 'HR16DE', 'petrol', 'fwd', 'mt', '5W-30 A5'),
  generateCar('n3', 'Nissan', 'X-Trail', 2013, 2022, 'T32', '2.0', 'MR20DD', 'petrol', 'awd', 'cvt', '5W-30 A5'),
  generateCar('n4', 'Nissan', 'X-Trail', 2013, 2022, 'T32', '2.5', 'QR25DE', 'petrol', 'awd', 'cvt', '5W-30 A5'),
  generateCar('n5', 'Nissan', 'Almera', 2012, 2018, 'G15', '1.6', 'K4M', 'petrol', 'fwd', 'at', '5W-40'),

  // Ford
  generateCar('f1', 'Ford', 'Focus', 2011, 2019, 'III', '1.6', 'IQDB', 'petrol', 'fwd', 'mt', '5W-30 A5'),
  generateCar('f2', 'Ford', 'Focus', 2011, 2019, 'III', '2.0', 'GDI', 'petrol', 'fwd', 'dsg', '5W-30 A5'),
  generateCar('f3', 'Ford', 'Mondeo', 2014, 2022, 'V', '2.5', 'Duratec', 'petrol', 'fwd', 'at', '5W-30 A5'),
  generateCar('f4', 'Ford', 'Kuga', 2012, 2019, 'II', '2.5', 'Duratec', 'petrol', 'fwd', 'at', '5W-30 A5'),
  generateCar('f5', 'Ford', 'Kuga', 2012, 2019, 'II', '1.6 EcoBoost', 'JQMA', 'petrol', 'awd', 'at', '5W-30 A5'),

  // New Viscosities & Brands test cars
  generateCar('v8', 'Volkswagen', 'Polo', 2001, 2009, 'IV', '1.4', 'BBY', 'petrol', 'fwd', 'mt', '10W-40'),
  generateCar('p1', 'Porsche', '911', 2011, 2019, '991', '3.8', 'MA1.03', 'petrol', 'rwd', 'dsg', '0W-40'),
  generateCar('v9', 'Volvo', 'XC60', 2008, 2017, 'I', '2.4 D5', 'D5244T', 'diesel', 'awd', 'at', '0W-30'),
  generateCar('s7', 'Subaru', 'Impreza WRX STI', 2007, 2014, 'III', '2.5', 'EJ257', 'petrol', 'awd', 'mt', '5W-50'),
];

export const mockCars: CarData[] = generatedCars;

export const getBrands = () => Array.from(new Set(mockCars.map(c => c.brand))).sort();
export const getModels = (brand: string) => Array.from(new Set(mockCars.filter(c => c.brand === brand).map(c => c.model))).sort();
export const getYears = (brand: string, model: string) => {
  const cars = mockCars.filter(c => c.brand === brand && c.model === model);
  const years = new Set<number>();
  cars.forEach(c => {
    for (let y = c.year_from; y <= c.year_to; y++) {
      years.add(y);
    }
  });
  return Array.from(years).sort((a, b) => b - a);
};
export const getEngines = (brand: string, model: string, year: number) => 
  mockCars.filter(c => c.brand === brand && c.model === model && c.year_from <= year && c.year_to >= year);
