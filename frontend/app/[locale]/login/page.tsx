'use client';

import { useState } from 'react';
import { AuthTabs } from '../../../components/auth/AuthTabs';
import { LoginForm } from '../../../components/auth/LoginForm';
import { SignupForm } from '../../../components/auth/SignupForm';
import { GlassNavbar } from '../../../components/layout/GlassNavbar';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-8"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="w-full max-w-300 h-175 bg-white/5 backdrop-blur-md border border-white/20 rounded-[40px] p-8 flex flex-col relative overflow-hidden shadow-2xl">
        
        <GlassNavbar />

        <div className="flex flex-1 items-center px-10">
          <div className="flex-1 text-white">
            <h1 className="text-[5.5rem] font-bold leading-[1.1] mb-2 tracking-wide">
              Welcome<br />!
            </h1>
            <p className="text-2xl font-light italic text-white/80 font-serif">
              lalala
            </p>
          </div>

          <div className="w-105 bg-white/10 backdrop-blur-xl border border-white/20 rounded-4xl p-10 shadow-xl">
            <AuthTabs active={activeTab} onChange={setActiveTab} />
            
            {activeTab === 'login' ? (
              <LoginForm />
            ) : (
              <SignupForm onSuccess={() => setActiveTab('login')} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}