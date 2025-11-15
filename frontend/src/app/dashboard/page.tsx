import { Background } from '@/components/background';

export default function Dashboard() {
  return (
    <Background variant="deepSpace">
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-white mb-4">
            Dashboard
          </h1>
          <p className="text-lg text-white/70">
            Real-time futures market data and analysis
          </p>
        </div>
      </div>
    </Background>
  );
}

