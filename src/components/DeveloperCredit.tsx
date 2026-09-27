import React from 'react';

export const DeveloperCredit: React.FC<{ dark?: boolean }> = ({ dark = false }) => (
  <footer className={`relative z-20 px-3 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-xs ${dark ? 'text-pink-100/80' : 'text-gray-600'}`}>
    <span>Dearli · Made with ♥ by </span>
    <a
      href="https://godswillrobwet.netlify.app/"
      target="_blank"
      rel="noopener noreferrer"
      className={`font-medium underline underline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${dark ? 'text-pink-100 decoration-pink-200/70 hover:text-white focus-visible:outline-pink-100' : 'text-pink-700 decoration-pink-300 hover:text-pink-900 focus-visible:outline-pink-700'}`}
    >
      Godswill Robwet
    </a>
  </footer>
);
