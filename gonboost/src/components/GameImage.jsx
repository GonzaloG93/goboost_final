// src/components/GameImage.jsx
import React from 'react';

const GameImage = ({ game, size = 'medium', className = '' }) => {
  const gameImages = {
    'League of Legends': '/images/games/league-of-legends.png',
    'Valorant': '/images/games/valorant.png',
    'Diablo 4': '/images/games/diablo-4.png',
    'Dune Awakening': '/images/games/dune-awakening.png',
    'Dota 2': '/images/games/dota-2.png',
    'Path of Exile': '/images/games/path-of-exile.png',
    'World of Warcraft': '/images/games/world-of-warcraft.png',
    'Last Epoch': '/images/games/last-epoch.png'
  };

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-20 h-20'
  };

  const imageUrl = gameImages[game] || '/images/games/default.png';

  return (
    <div 
      className={`${sizeClasses[size]} ${className} rounded-lg bg-cover bg-center border-2 border-gray-600`}
      style={{ backgroundImage: `url(${imageUrl})` }}
    />
  );
};

export default GameImage;