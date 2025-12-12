import Logo from './svg/logo.jsx';
import InfinitySnake from './components/InfinitySnake';

export default function Home() {
  return (
    <main className="flex flex-col items-center h-screen relative overflow-hidden">
      <InfinitySnake />
      {/* Glass overlay */}
      <div className="absolute inset-0 z-[5] backdrop-blur-sm bg-white/2 border border-white/5" />
      <div className="p-12 text-center text-2xl relative z-9">
        <h1>Welcome to Our Landing Page</h1>
        <p>We are launching soon!</p>
      </div>
      <Logo
        width={500}
        height={500}
        className="inline-block justify-center relative z-8"
      />
    </main>
  );
}
