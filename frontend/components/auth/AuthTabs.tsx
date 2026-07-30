import { useTranslation } from 'react-i18next';

interface AuthTabsProps {
  active: 'login' | 'signup';
  onChange: (tab: 'login' | 'signup') => void;
}

export function AuthTabs({ active, onChange }: AuthTabsProps) {
  const { t } = useTranslation();
  return (
    <div className="flex justify-center gap-12 mb-10">
      <button 
        type="button"
        onClick={() => onChange('login')}
        className={`text-xl font-medium pb-2 border-b-2 transition-colors ${
          active === 'login' ? 'text-white border-white' : 'text-white/50 border-transparent hover:text-white/80'
        }`}
      >
        {t('authTabs.login')}
      </button>
      <button 
        type="button"
        onClick={() => onChange('signup')}
        className={`text-xl font-medium pb-2 border-b-2 transition-colors ${
          active === 'signup' ? 'text-white border-white' : 'text-white/50 border-transparent hover:text-white/80'
        }`}
      >
        {t('authTabs.signup')}
      </button>
    </div>
  );
}