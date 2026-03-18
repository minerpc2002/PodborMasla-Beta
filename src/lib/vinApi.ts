export interface DecodedVehicle {
  make: string;
  model: string;
  year: string;
  engine: string;
  transmission: string;
}

export async function decodeVin(vin: string): Promise<DecodedVehicle | null> {
  const fetchPromise = (async () => {
    try {
      const apiUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`;
      let response = await fetch(`/api/proxy/ravenol?url=${encodeURIComponent(apiUrl)}`);
      
      // Fallback to corsproxy.io if our proxy fails
      if (!response.ok) {
        console.warn('Vercel proxy failed for NHTSA API, trying corsproxy.io...');
        response = await fetch(`https://corsproxy.io/?${encodeURIComponent(apiUrl)}`);
      }
      
      if (!response.ok) return null;
      const data = await response.json();
      
      if (data.Results && data.Results[0] && data.Results[0].ErrorCode === '0') {
        const v = data.Results[0];
        return {
          make: v.Make,
          model: v.Model,
          year: v.ModelYear,
          engine: `${v.DisplacementL || ''}L ${v.EngineConfiguration || ''} ${v.FuelTypePrimary || ''}`,
          transmission: v.TransmissionStyle || v.Transmission || ''
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  })();

  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), 10000); // 10 second hard timeout
  });

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.error("VIN decoding failed", error);
    return null;
  }
}
