import React from 'react';

export const SkeletonCard = () => (
  <div className="flex gap-4 p-4 border-b border-gray-100 bg-white animate-pulse">
    <div className="flex-1">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="w-36 h-32 bg-gray-200 rounded-2xl"></div>
  </div>
);

export const SkeletonOrder = () => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

export const MenuSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
  </div>
);

export const OrdersSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => <SkeletonOrder key={i} />)}
  </div>
);
