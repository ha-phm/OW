import Link from 'next/link';

export default function Hero() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-12 relative z-10 flex-1 py-8 lg:py-0">
      
      
      <div className="w-full lg:w-1/2 flex flex-col gap-6 lg:gap-8 items-center lg:items-start text-center lg:text-left">
        <h1 className="text-4xl sm:text-5xl md:text-[64px] font-bold leading-[1.2] lg:leading-[1.1] text-white">
          Discover the Perfect <br className="hidden sm:block" />
          <span className="relative inline-block mt-2 lg:mt-4">
            Credit Card
            
            <svg 
              className="absolute -bottom-2 sm:-bottom-4 left-0 w-full h-8 sm:h-10 text-green-500 scale-110" 
              viewBox="0 0 200 40" fill="none" preserveAspectRatio="none"
            >
              <path d="M5 25 Q 50 5, 100 20 T 195 25" stroke="currentColor" strokeWidth="3" fill="transparent" strokeLinecap="round"/>
              <path d="M5 30 Q 50 15, 100 25 T 195 20" stroke="currentColor" strokeWidth="1.5" fill="transparent" strokeLinecap="round" opacity="0.6"/>
            </svg>
          </span> for You
        </h1>

        <p className="text-gray-400 max-w-md text-sm sm:text-base leading-relaxed mt-2 lg:mt-4">
          Discover the power of our secure and rewarding credit cards. Explore our range of credit cards and take control of your finances today.
        </p>


        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 mt-4 w-full sm:w-auto">
          <Link 
            href="/login" 
            className="w-full sm:w-auto justify-center px-8 py-3.5 bg-transparent border border-green-500 text-green-500 font-semibold rounded-full hover:bg-green-500 hover:text-black transition-all flex items-center gap-2"
          >
            Login 
          </Link>
          <Link 
            href="/signup" 
            className="w-full sm:w-auto justify-center px-8 py-3.5 bg-transparent border border-green-500 text-green-500 font-semibold rounded-full hover:bg-green-500 hover:text-black transition-all flex items-center gap-2"
          >
            Sign Up 
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-300 border-2 border-[#0d1410] flex items-center justify-center text-xs z-30">👱🏼‍♂️</div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-300 border-2 border-[#0d1410] flex items-center justify-center text-xs z-20">👨🏻</div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-300 border-2 border-[#0d1410] flex items-center justify-center text-xs z-10">👩🏽</div>
            </div>
            <div className="text-left text-sm">
              <div className="font-bold text-white leading-tight">10.2k+</div>
              <div className="text-[10px] sm:text-xs text-gray-400">Active users around the<br/>world</div>
            </div>
          </div>
        </div>
      </div>

      
      <div className="w-full lg:w-1/2 relative min-h-75 sm:min-h-100 flex justify-center items-center mt-10 lg:mt-0">
        
        
        <div className="absolute right-0 bottom-0 w-50 h-50 sm:w-75 sm:h-75 lg:w-112.5 lg:h-112.5 bg-green-500 rounded-full opacity-90 lg:translate-x-12 lg:translate-y-12"></div>

        
        <div className="absolute top-0 sm:top-12 left-4 sm:left-10 text-green-500 text-xl sm:text-2xl animate-pulse">✦</div>
        <div className="absolute bottom-4 sm:bottom-10 right-10 sm:right-24 text-green-500 text-xl sm:text-2xl animate-pulse">✦</div>

        
        <div className="relative z-10 w-[90%] max-w-105 aspect-[1.6/1] bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col justify-between shadow-2xl transform -rotate-12 hover:rotate-0 transition-transform duration-500 ease-out">
          
          <div className="flex justify-between items-start">
            <div className="flex">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/80 rounded-full"></div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/40 rounded-full -ml-3 md:-ml-4 backdrop-blur-sm"></div>
            </div>
            <svg className="w-6 h-6 md:w-8 md:h-8 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 18.75h.007v.008H12v-.008z" />
            </svg>
          </div>

          <div>
            <div className="text-[10px] md:text-xs text-gray-300 mb-1 font-medium">Credit Card No.</div>
            <div className="text-lg sm:text-xl md:text-2xl font-mono tracking-widest text-white mb-4 md:mb-6 drop-shadow-md">
              1602 0911 2019 2021
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[8px] md:text-[10px] text-gray-300 uppercase tracking-wider mb-1">Name</div>
                <div className="text-xs md:text-sm font-bold tracking-widest text-white uppercase">Rehan Raihan</div>
              </div>
              <div>
                <div className="text-[8px] md:text-[10px] text-gray-300 uppercase tracking-wider mb-1">Exp.</div>
                <div className="text-xs md:text-sm font-bold tracking-widest text-white">09/11</div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}