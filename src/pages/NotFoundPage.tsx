import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🍽️</div>
        <h1 className="text-6xl font-extrabold text-gray-900 mb-2">404</h1>
        <p className="text-xl font-bold text-gray-700 mb-2">Page Not Found</p>
        <p className="text-gray-500 mb-8">The dish you're looking for isn't on our menu.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="outlined">
            <ArrowLeft size={16} /> Go Back
          </Button>
          <Button onClick={() => navigate('/')}>
            <Home size={16} /> Home
          </Button>
        </div>
      </div>
    </div>
  );
};
