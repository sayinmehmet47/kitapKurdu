import React from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui';

interface BackToTopButtonProps {
  visible: boolean;
}

export const BackToTopButton: React.FC<BackToTopButtonProps> = ({
  visible,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl transition-all duration-300 z-50 ${
        visible
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-95 pointer-events-none'
      }`}
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
};
