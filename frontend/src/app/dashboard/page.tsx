import { Background } from '@/components/backgrounds/bg1';
import { Dashboard } from '@/components/features/dashboard/dashboard';
import { Sentiment } from '@/components/features/sentiment/sentiment';
import { Indicators } from '@/components/features/indicators/indicators';

export default function Portal() {
  return (
    <Background>
      {/* Content with padding for fixed navbar */}
      <div className="min-h-screen p-8 pt-24">
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

