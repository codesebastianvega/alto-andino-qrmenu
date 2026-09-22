import React from 'react';
import { AI_AVATAR_PRESETS } from '../../constants/aiPresets';
import { Sparkles } from 'lucide-react';

export default function AIAvatar({ 
  avatar, 
  presetId, 
  className = 'w-12 h-12', 
  alt = 'AI Avatar',
  fallbackIcon = null
}) {
  // 1. Check if avatar matches a preset ID
  const matchedPreset = AI_AVATAR_PRESETS.find(p => p.id === (presetId || avatar));
  
  if (matchedPreset) {
    return (
      <div 
        className={`inline-flex items-center justify-center overflow-hidden rounded-2xl shadow-md ${className}`}
        dangerouslySetInnerHTML={{ __html: matchedPreset.svg }}
      />
    );
  }

  // 2. Check if avatar is raw SVG code
  if (typeof avatar === 'string' && avatar.trim().startsWith('<svg')) {
    return (
      <div 
        className={`inline-flex items-center justify-center overflow-hidden rounded-2xl shadow-md ${className}`}
        dangerouslySetInnerHTML={{ __html: avatar }}
      />
    );
  }

  // 3. Check if avatar is an image URL
  if (typeof avatar === 'string' && (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:image/'))) {
    return (
      <img 
        src={avatar} 
        alt={alt} 
        className={`object-cover rounded-2xl shadow-md ${className}`} 
      />
    );
  }

  // 4. Fallback: Default Lumi Spark
  const defaultPreset = AI_AVATAR_PRESETS[0];
  return (
    <div 
      className={`inline-flex items-center justify-center overflow-hidden rounded-2xl shadow-md ${className}`}
      dangerouslySetInnerHTML={{ __html: defaultPreset.svg }}
    />
  );
}
