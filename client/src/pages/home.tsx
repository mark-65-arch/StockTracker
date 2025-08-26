import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import StockCard from "@/components/stock-card";
import AddStockModal from "@/components/add-stock-modal";
import PeriodSelector from "@/components/period-selector";
import WatchlistStats from "@/components/watchlist-stats";
import type { StockWithData } from "@shared/schema";

export default function Home() {
  const [selectedPeriod, setSelectedPeriod] = useState<'1D' | '1W' | '1M' | '6M'>('1D');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: stocks = [], isLoading, refetch } = useQuery<StockWithData[]>({
    queryKey: ['/api/stocks', { period: selectedPeriod }],
    queryFn: async () => {
      const response = await fetch(`/api/stocks?period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stocks');
      }
      return response.json();
    },
  });

  const handlePeriodChange = (period: '1D' | '1W' | '1M' | '6M') => {
    setSelectedPeriod(period);
  };

  const handleStockAdded = () => {
    setIsModalOpen(false);
    refetch();
  };

  const handleStockRemoved = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-primary flex items-center" data-testid="app-title">
                <TrendingUp className="mr-2 h-5 w-5" />
                Stock Watchlist
              </h1>
            </div>
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Watchlist Stats */}
        <WatchlistStats />

        {/* Stock Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32 mb-4"></div>
                <div className="h-8 bg-muted rounded w-24 mb-4"></div>
                <div className="h-16 bg-muted rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-16"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : stocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="stocks-grid">
            {stocks.map((stock) => (
              <StockCard
                key={stock.id}
                stock={stock}
                onRemove={handleStockRemoved}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12" data-testid="empty-state">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No stocks in your watchlist</h3>
            <p className="text-muted-foreground mb-4">Add stocks to start tracking their performance</p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center"
              data-testid="button-add-first-stock"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Stock
            </Button>
          </div>
        )}
      </main>

      {/* Floating Add Button */}
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 z-50"
        size="icon"
        data-testid="button-add-stock-floating"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStockAdded={handleStockAdded}
      />
    </div>
  );
}
