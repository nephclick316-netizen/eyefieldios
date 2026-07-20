import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface LoadingEyeProps {
  size?: number;
}

export const LoadingEye: React.FC<LoadingEyeProps> = ({ size = 40 }) => {
  const pathname = usePathname();
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const visitedKey = `visited_${pathname}`;
      const isVisited = sessionStorage.getItem(visitedKey);

      if (isVisited) {
        setShouldAnimate(false);
      } else {
        sessionStorage.setItem(visitedKey, 'true');
      }
    }
  }, [pathname]);

  const dim = `${size}px`;

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ width: dim, height: dim }}>
        <div className={`absolute inset-0 rounded-full border-2 border-navy-950/15 dark:border-white/10 ${shouldAnimate ? 'animate-ping' : 'opacity-20'}`} />
        <div className={`relative flex items-center justify-center w-full h-full rounded-full bg-navy-950 text-white dark:bg-white dark:text-black shadow-lg ${shouldAnimate ? 'animate-bounce' : ''}`}>
          <Eye className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default LoadingEye;

