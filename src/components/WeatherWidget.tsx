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
      temp: 86,
      condition: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 12,
      location: 'Mumbai, India',
      high: 91,
      low: 79,
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
        return <Sun className="w-16 h-16 text-primary weather-icon" />;
      case 'rainy':
      case 'rain':
        return <CloudRain className="w-16 h-16 text-accent weather-icon" />;
      case 'snowy':
      case 'snow':
        return <CloudSnow className="w-16 h-16 text-accent weather-icon" />;
      default:
        return <Cloud className="w-16 h-16 text-accent weather-icon" />;
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-16 w-16 bg-secondary rounded-full mb-4" />
        <div className="h-8 w-24 bg-secondary rounded mb-2" />
        <div className="h-4 w-32 bg-secondary rounded" />
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        {getWeatherIcon(weather.condition)}
        <div className="text-right">
          <div className="text-5xl font-light text-foreground">
            {weather.temp}°
          </div>
          <div className="text-sm text-muted-foreground">
            H: {weather.high}° L: {weather.low}°
          </div>
        </div>
      </div>
      
      <div className="text-lg font-medium text-foreground mb-1">
        {weather.condition}
      </div>
      <div className="text-sm text-muted-foreground mb-4">
        {weather.location}
      </div>
      
      <div className="flex gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Droplets className="w-4 h-4" />
          {weather.humidity}%
        </div>
        <div className="flex items-center gap-1">
          <Wind className="w-4 h-4" />
          {weather.windSpeed} mph
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
