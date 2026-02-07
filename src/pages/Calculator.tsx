import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CalorieProvider } from '@/contexts/CalorieContext';
import Header from '@/components/Header';
import CategoryTabs from '@/components/CategoryTabs';
import FoodMenu from '@/components/FoodMenu';
import BottomBar from '@/components/BottomBar';
import { useMenuData } from '@/hooks/useMenuData';

interface CalculatorContentProps {
  embedded?: boolean;
}

export const CalculatorContent: React.FC<CalculatorContentProps> = ({ embedded = false }) => {
  const { categories: menuData, isLoading } = useMenuData({ includeHidden: false });
  const [activeCategory, setActiveCategory] = useState<string>(menuData[0]?.id || 'makanan-utama');

  useEffect(() => {
    if (!menuData.find((category) => category.id === activeCategory) && menuData.length > 0) {
      setActiveCategory(menuData[0].id);
    }
  }, [menuData, activeCategory]);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
  }, []);

  const activeItems = useMemo(() => {
    const category = menuData.find(cat => cat.id === activeCategory);
    return category?.items || [];
  }, [menuData, activeCategory]);

  if (isLoading) {
    return (
      <div className={`${embedded ? "h-full" : "min-h-screen"} bg-background flex items-center justify-center`}>
        <div className="text-center">
          <img
            src="/santo-yusup.png"
            alt="Loading"
            className="w-20 h-20 mx-auto rounded-xl animate-pulse mb-4"
          />
          <p className="text-muted-foreground text-tv-body">Memuat... (Calculator)</p>
        </div>
      </div>
    );
  }

  return (
    <CalorieProvider>
      <div className={`${embedded ? "h-full" : "h-screen"} flex flex-col overflow-hidden bg-background`}>
        {/* Fixed Header */}
        {!embedded && <Header />}
        
        {/* Fixed Category Tabs */}
        <CategoryTabs
          categories={menuData}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          embedded={embedded}
        />
        
        {/* Scrollable Menu Content */}
        {/* Spacing: header (16-24) + tabs (~60-72) + bottom bar (20-28) */}
        <main
          className={
            embedded
              ? "flex flex-col flex-1 min-h-0 mt-4"
              : "flex flex-col flex-1 min-h-0 mt-[8.5rem] md:mt-[10rem] lg:mt-[12rem] mb-20 md:mb-24 lg:mb-28"
          }
        >
          <FoodMenu items={activeItems} categoryId={activeCategory} />
        </main>
        
        {/* Fixed Bottom Bar */}
        <BottomBar embedded={embedded} />
      </div>
    </CalorieProvider>
  );
};

const Calculator: React.FC = () => <CalculatorContent />;

export default Calculator;
