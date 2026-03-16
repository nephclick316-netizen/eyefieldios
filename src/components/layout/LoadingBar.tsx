import React from 'react';

export const LoadingBar = () => (
  <div className="absolute top-0 left-0 right-0 h-0.5 z-[100] overflow-hidden px-4 pt-0.5">
    <div className="h-full bg-brand-primary/40 dark:bg-white/40 w-full rounded-full overflow-hidden">
      <div className="h-full bg-brand-primary dark:bg-white w-1/3 rounded-full animate-[loading_1.5s_infinite]" />
    </div>
  </div>
);