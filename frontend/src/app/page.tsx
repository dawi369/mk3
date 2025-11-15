import { Background } from '@/components/backgrounds/bg1';

export default function Home() {
  return (
    <Background variant="azureDepths">
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-white mb-4">
            MK3 Futures Dashboard
          </h1>
          <p className="text-lg text-white/70">
            Ready for features
          </p>
        </div>
      </div>
    </Background>
  );
}
