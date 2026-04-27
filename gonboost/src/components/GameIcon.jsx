import React from 'react';

const GameIcon = ({ game, size = 'small' }) => {
  const gameIcons = {
    'League of Legends': '⚔️',
    'Valorant': '🎯',
    'Diablo 4': '👹',
    'Dune Awakening': '🏜️',
    'Dota 2': '🌀',
    'Path of Exile': '💀',
    'World of Warcraft': '🐉',
    'Last Epoch': '⏳'
  };
  
  const sizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl'
  };
  
  return (
    <span className={sizeClasses[size]}>
      {gameIcons[game] || '🎮'}
    </span>
  );
};

export default GameIcon;