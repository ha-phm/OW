import Navbar from '../components/Home/NavBar';
import Hero from '../components/Home/LandingPageMain';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0d1410] overflow-x-hidden font-sans relative selection:bg-green-500 selection:text-black flex flex-col">
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,50 Q25,0 50,50 T100,50" fill="none" stroke="#22c55e" strokeWidth="0.2"/>
        </svg>
      </div>

      {/* THÊM: w-full flex-1 flex flex-col (Giống hệt Login) */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full flex-1 flex flex-col">
        <Navbar />
        <Hero />
      </div>
    </main>
  );
}