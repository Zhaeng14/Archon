import { User, Bot, Tag, Clipboard } from 'lucide-react';
import React from 'react';

export const ItemTypes = {
  TASK: 'task'
};

export const getAssigneeIcon = (assigneeName: 'User' | 'Archon' | 'AI IDE Agent') => {
  switch (assigneeName) {
    case 'User':
      return <User className="w-4 h-4 text-blue-400" />;
    case 'AI IDE Agent':
      return <Bot className="w-4 h-4 text-purple-400" />;
    case 'Archon':
      return <img src="/favicon.png" alt="Archon" className="w-4 h-4" />;
    default:
      return <User className="w-4 h-4 text-blue-400" />;
  }
};

export const getAssigneeGlow = (assigneeName: 'User' | 'Archon' | 'AI IDE Agent') => {
  switch (assigneeName) {
    case 'User':
      return 'shadow-none';
    case 'AI IDE Agent':
      return 'shadow-none';
    case 'Archon':
      return 'shadow-none';
    default:
      return 'shadow-none';
  }
};

export const getOrderColor = (order: number) => {
  if (order <= 3) return 'bg-rose-500';
  if (order <= 6) return 'bg-muted';
  if (order <= 10) return 'bg-blue-500';
  return 'bg-emerald-500';
};

export const getOrderGlow = (order: number) => {
  if (order <= 3) return 'shadow-none';
  if (order <= 6) return 'shadow-none';
  if (order <= 10) return 'shadow-none';
  return 'shadow-none';
}; 


