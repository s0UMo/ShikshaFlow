import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, GraduationCap, BookOpen } from 'lucide-react';
import { FuzzyText } from '../components/FuzzyText';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  const userRaw = localStorage.getItem('shiksha_user');
  let loggedIn = false;
  let role = '';
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw);
      if (user?.id && user?.role) {
        loggedIn = true;
        role = user.role;
      }
    } catch {
      // ignore
    }
  }

  const handleDashboardRedirect = () => {
    if (!loggedIn) {
      navigate('/login');
    } else if (role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/student');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* Interactive Fuzzy Text 404 Header */}
        <div className="relative inline-flex flex-col items-center justify-center py-2">
          <div className="absolute inset-0 bg-[#3ecf8e]/15 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 flex items-center justify-center">
            <FuzzyText
              baseIntensity={0.18}
              hoverIntensity={0.6}
              enableHover={true}
              clickEffect={true}
              glitchMode={true}
              glitchInterval={2500}
              gradient={['#3ecf8e', '#06b6d4', '#a855f7']}
              fontSize="clamp(4rem, 12vw, 8rem)"
              fontWeight={900}
            >
              404
            </FuzzyText>
          </div>
        </div>

        {/* Big 404 Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-[#ededed] tracking-tight">
            Lost in the Equation?
          </h1>
          <p className="text-base text-[#9ca3af] max-w-md mx-auto leading-relaxed">
            The page or route you followed doesn't exist or may have been relocated. Let's guide you back to your learning flow.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={() => navigate('/')}
            className="btn-primary-green px-6 py-3 text-sm font-semibold w-full sm:w-auto inline-flex items-center justify-center gap-2 shadow-lg shadow-[#3ecf8e]/20"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
          
          <button
            onClick={handleDashboardRedirect}
            className="card-feature-light px-6 py-3 text-sm font-semibold text-[#ededed] hover:border-white/20 transition-all w-full sm:w-auto inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-[#3ecf8e]" />
            {loggedIn ? 'Go to Dashboard' : 'Sign In'}
          </button>
        </div>

        {/* Quick Links Footer Box */}
        <div className="card-feature-light p-6 max-w-md mx-auto text-left border border-white/10 rounded-xl space-y-3 mt-8">
          <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider block">
            Popular Destinations
          </span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 text-[#ededed] hover:text-[#3ecf8e] transition-colors py-1"
            >
              <GraduationCap className="w-4 h-4 text-[#3ecf8e]" />
              Student Portal
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 text-[#ededed] hover:text-[#3ecf8e] transition-colors py-1"
            >
              <BookOpen className="w-4 h-4 text-[#06b6d4]" />
              Teacher Analytics
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
