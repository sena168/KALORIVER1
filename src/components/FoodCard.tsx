import React, { useState } from 'react';
import type { MenuItemWithMeta } from '@/hooks/useMenuData';
import { useCalories } from '@/contexts/CalorieContext';
import QuantityControl from './QuantityControl';
import { cn } from '@/lib/utils';
import { getNextImageFallback } from '@/lib/imageFallback';

interface FoodCardProps {
  item: MenuItemWithMeta;
}

const FoodCard: React.FC<FoodCardProps> = ({ item }) => {
  const { getQuantity, incrementQuantity, decrementQuantity } = useCalories();
  const [imageError, setImageError] = useState(false);
  
  const quantity = getQuantity(item.id);
  const hasQuantity = quantity > 0;

  const handleImageError: React.ReactEventHandler<HTMLImageElement> = (event) => {
    const target = event.currentTarget;
    const stage = Number(target.dataset.fallback ?? "0");
    const next = getNextImageFallback(target.src, stage);
    if (!next) {
      setImageError(true);
      return;
    }
    target.dataset.fallback = String(stage + 1);
    target.src = next;
  };

  return (
    <div 
      className={cn(
        "bg-card rounded-xl p-4 md:p-6 lg:p-7 transition-all duration-200 min-h-[9.5rem] md:min-h-[11rem] lg:min-h-[12.5rem]",
        "border border-border shadow-md hover:shadow-lg",
        hasQuantity && "ring-2 ring-primary/50 border-primary/30"
      )}
    >
      {/* Mobile Layout (Vertical Stack) */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Image */}
        <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {imageError ? (
            <div className="text-muted-foreground text-sm">No Image</div>
          ) : (
            <img
              src={item.imagePath}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
          )}
        </div>
        
        {/* Name and Calories */}
        <div className="text-center">
          <h3 className="text-tv-body font-semibold text-foreground line-clamp-2">
            {item.name}
          </h3>
          <p className="text-tv-small text-muted-foreground mt-1">
            {item.calories} kkal
          </p>
        </div>
        
        {/* Quantity Controls */}
        <div className="flex justify-center">
          <QuantityControl
            quantity={quantity}
            onIncrement={() => incrementQuantity(item.id)}
            onDecrement={() => decrementQuantity(item.id)}
          />
        </div>
      </div>

      {/* Tablet/TV Layout (Horizontal) */}
      <div className="hidden md:flex items-center gap-4 md:gap-6">
        {/* Image - Left */}
        <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {imageError ? (
            <div className="text-muted-foreground text-xs">No Image</div>
          ) : (
            <img
              src={item.imagePath}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
          )}
        </div>
        
        {/* Name and Calories - Center */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[0.95rem] sm:text-[1rem] md:text-[1.05rem] min-[1400px]:text-tv-subtitle font-semibold text-foreground line-clamp-3">
            {item.name}
          </h3>
          <p className="text-[0.9rem] sm:text-[0.95rem] md:text-[1rem] min-[1400px]:text-tv-body text-muted-foreground mt-2">
            {item.calories} kkal
          </p>
        </div>
        
        {/* Quantity Controls - Right */}
        <QuantityControl
          quantity={quantity}
          onIncrement={() => incrementQuantity(item.id)}
          onDecrement={() => decrementQuantity(item.id)}
        />
      </div>
    </div>
  );
};

export default FoodCard;
