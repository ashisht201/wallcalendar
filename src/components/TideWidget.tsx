import { useState, useEffect } from 'react';
import { Waves, Wind } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TideTime {
  time: string;
  height: string;
  type: 'high' | 'low';
}

interface AqiData {
  aqi: number | null;
  station: string;
  loading: boolean;
}

const getAqiColor = (aqi: number | null): string => {
  if (aqi === null) return 'text-muted-foreground';
  if (aqi <= 50) return 'text-green-500';
  if (aqi <= 100) return 'text-yellow-500';
  if (aqi <= 150) return 'text-orange-500';
  return 'text-red-500';
};

const getAqiLabel = (aqi: number | null): string => {
  if (aqi === null) return '--';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy (SG)';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

const TideWidget = () => {
  const [aqiData, setAqiData] = useState<AqiData>({ aqi: null, station: '', loading: true });

  useEffect(() => {
    const fetchAqi = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-aqi');
        
        if (error) {
          console.error('AQI fetch error:', error);
          setAqiData({ aqi: null, station: '', loading: false });
          return;
        }
        
        if (data?.success && data.aqi !== null) {
          setAqiData({ aqi: data.aqi, station: data.station, loading: false });
        } else {
          setAqiData({ aqi: null, station: '', loading: false });
        }
      } catch (err) {
        console.error('AQI fetch failed:', err);
        setAqiData({ aqi: null, station: '', loading: false });
      }
    };

    fetchAqi();
    // Refresh every 30 minutes
    const interval = setInterval(fetchAqi, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Mock tide data for Mumbai - in production, this would call a tide API
  const tides: TideTime[] = [
    { time: '06:42 AM', height: '4.2m', type: 'high' },
    { time: '12:58 PM', height: '1.1m', type: 'low' },
    { time: '07:15 PM', height: '3.9m', type: 'high' },
  ];

  const highTides = tides.filter(t => t.type === 'high');

  return (
    <div className="glass-card p-4 animate-fade-in h-[100px] flex flex-col justify-center">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">High Tides</span>
        </div>
        
        {/* AQI Display */}
        <div className="flex items-center gap-2">
          <Wind className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">AQI</span>
          <span className={`text-lg font-bold ${getAqiColor(aqiData.aqi)}`}>
            {aqiData.loading ? '...' : aqiData.aqi ?? '--'}
          </span>
          {!aqiData.loading && aqiData.aqi !== null && (
            <span className={`text-xs ${getAqiColor(aqiData.aqi)}`}>
              {getAqiLabel(aqiData.aqi)}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex gap-6">
        {highTides.map((tide, index) => (
          <div key={index} className="text-center">
            <div className="text-base font-semibold text-foreground">{tide.time}</div>
            <div className="text-xs text-muted-foreground">{tide.height}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TideWidget;
