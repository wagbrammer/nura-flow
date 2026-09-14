import React from 'react';
import { useApp } from '../../context/AppContext';

interface TagBadgeProps {
  tagId: string;
  className?: string;
  onClick?: () => void;
  showRemove?: boolean;
  onRemove?: () => void;
}

export const TagBadge: React.FC<TagBadgeProps> = ({
  tagId,
  className = '',
  onClick,
  showRemove = false,
  onRemove
}) => {
  const { tags } = useApp();
  const tag = tags.find(t => t.id === tagId);

  if (!tag) return null;

  return (
    <span
      id={`tag-badge-${tag.id}`}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors ${
        onClick ? 'cursor-pointer hover:opacity-85' : ''
      } ${className}`}
      style={{
        backgroundColor: `${tag.color}18`,
        color: tag.color,
        border: `1px solid ${tag.color}35`
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: tag.color }}
      />
      <span className="whitespace-nowrap">{tag.name}</span>
      {showRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1 text-xs opacity-60 hover:opacity-100 focus:outline-none"
        >
          ×
        </button>
      )}
    </span>
  );
};
