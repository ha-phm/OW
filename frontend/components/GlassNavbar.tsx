'use client';


export function GlassNavbar() {
  return (
    <nav className="flex justify-between items-center w-full mb-16 px-4">
      <div className="flex gap-4">
        <button className="bg-[#42b4b4] text-white px-8 py-2 rounded-full font-medium hover:bg-[#359090] transition">Home</button>
        <button className="bg-white/10 text-white px-8 py-2 rounded-full font-medium hover:bg-white/20 transition">About</button>
      </div>
      <div className="flex gap-4">
        <button className="bg-[#42b4b4] text-white px-8 py-2 rounded-full font-medium hover:bg-[#359090] transition">Login</button>
        <button className="bg-white/10 text-white px-8 py-2 rounded-full font-medium hover:bg-white/20 transition">Contact</button>
      </div>
    </nav>
  );
}