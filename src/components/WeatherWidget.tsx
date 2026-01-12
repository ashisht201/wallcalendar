import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets } from 'lucide-react';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
  high: number;
  low: number;
}

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate weather data - in production, this would call a weather API
    const mockWeather: WeatherData = {
      temp: 30,
      condition: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 19,
      location: 'Mumbai, India',
      high: 33,
      low: 26,
    };
    
    setTimeout(() => {
      setWeather(mockWeather);
      setLoading(false);
    }, 500);
  }, []);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="w-10 h-10 text-primary weather-icon" />;
      case 'rainy':
      case 'rain':
        return <CloudRain className="w-10 h-10 text-accent weather-icon" />;
      case 'snowy':
      case 'snow':
        return <CloudSnow className="w-10 h-10 text-accent weather-icon" />;
      default:
        return <Cloud className="w-10 h-10 text-accent weather-icon" />;
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-4 h-[100px] animate-pulse flex items-center gap-4">
        <div className="h-10 w-10 bg-secondary rounded-full" />
        <div className="flex-1">
          <div className="h-6 w-16 bg-secondary rounded mb-1" />
          <div className="h-3 w-24 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="glass-card p-4 animate-fade-in h-[100px]">
      <div className="flex items-center gap-4 h-full">
        {getWeatherIcon(weather.condition)}
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-light text-foreground">{weather.temp}°</span>
            <span className="text-xs text-muted-foreground">H:{weather.high}° L:{weather.low}°</span>
          </div>
          <div className="text-sm text-muted-foreground">{weather.condition} · {weather.location}</div>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3" />
            {weather.humidity}%
          </div>
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3" />
            {weather.windSpeed} km/h
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
