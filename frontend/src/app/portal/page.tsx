import { Background } from '@/components/backgrounds/bg1';
import { Dashboard } from '@/features/dashboard';
import { Sentiment } from '@/features/sentiment';
import { Indicators } from '@/features/indicators';

export default function Portal() {
  return (
    <Background>
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-semibold text-white mb-2">
              MK3 Futures Portal
            </h1>
            <p className="text-lg text-white/70">
              Real-time market data and analysis
            </p>
          </header>

          <div className="space-y-8">
            <Dashboard />
            <Sentiment />
            <Indicators />
          </div>
        </div>
      </div>
    </Background>
  );
}

