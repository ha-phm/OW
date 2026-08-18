"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between py-6 relative z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 cursor-pointer z-50">
        <div className="w-5 h-5 bg-green-500 rounded-sm"></div>
        <span className="font-bold text-xl tracking-tight text-white">Way4</span>
      </div>

      {/* Desktop Menu Links */}
      <div className="hidden lg:flex items-center gap-8 text-sm text-gray-300">
        <Link href="#" className="hover:text-white transition">Why Us</Link>
        <Link href="#" className="hover:text-white transition">Services</Link>
        <Link href="#" className="hover:text-white transition">Our Process</Link>
        <Link href="#" className="hover:text-white transition">Payments</Link>
        <Link href="#" className="hover:text-white transition">FAQs</Link>
      </div>

      {/* Desktop Actions */}
      <div className="hidden lg:flex items-center gap-6">
        <Link 
          href="/login" 
          className="px-6 py-2 border border-green-500 text-green-500 rounded-full text-sm hover:bg-green-500 hover:text-white transition-all"
        >
          Login
        </Link>
        <Link 
          href="/signup" 
          className="px-6 py-2 border border-green-500 text-green-500 rounded-full text-sm hover:bg-green-500 hover:text-white transition-all"
        >
          Sign Up
        </Link>
      </div>

      {/* Mobile Hamburger Button */}
      <button 
        className="lg:hidden text-white z-50 p-2"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu Dropdown */}
      <div className={`
        absolute top-20 left-0 w-full bg-[#111a15] border border-gray-800 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl transition-all duration-300 lg:hidden
        ${isMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible'}
      `}>
        <div className="flex flex-col gap-4 text-center text-gray-300">
          <Link href="#" className="hover:text-white">Why Us</Link>
          <Link href="#" className="hover:text-white">Services</Link>
          <Link href="#" className="hover:text-white">Our Process</Link>
          <Link href="#" className="hover:text-white">Payments</Link>
          <Link href="#" className="hover:text-white">FAQs</Link>
        </div>
        <hr className="border-gray-800" />
        <div className="flex flex-col gap-4">
          <Link 
            href="/login" 
            className="w-full py-3 text-center text-black bg-green-500 font-medium rounded-full hover:bg-green-400 transition"
          >
            Login
          </Link>
          <Link 
            href="/signup" 
            className="w-full py-3 text-center text-black bg-green-500 font-medium rounded-full hover:bg-green-400 transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}