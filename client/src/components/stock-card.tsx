import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MiniChart from "@/components/mini-chart";
import type { StockWithData } from "@shared/schema";

interface StockCardProps {
  stock: StockWithData;
  onRemove: () => void;
}

export default function StockCard({ stock, onRemove }: StockCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const removeStockMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/stocks/${stock.id}`),
    onSuccess: () => {
      toast({
        title: "Stock removed",
        description: `${stock.symbol} has been removed from your watchlist.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stocks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      onRemove();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove stock. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRemove = () => {
    if (confirm(`Remove ${stock.symbol} from your watchlist?`)) {
      removeStockMutation.mutate();
    }
  };

  const isPositive = stock.changePercent >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="hover:shadow-lg transition-all duration-200" data-testid={`card-stock-${stock.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-foreground" data-testid={`text-symbol-${stock.id}`}>
                {stock.symbol}
              </h3>
              <Badge 
                variant={isPositive ? "default" : "destructive"}
                className={`inline-flex items-center text-xs font-medium ${
                  isPositive 
                    ? "bg-green-100 text-green-800 hover:bg-green-100" 
                    : "bg-red-100 text-red-800 hover:bg-red-100"
                }`}
                data-testid={`badge-change-${stock.id}`}
              >
                <TrendIcon className="mr-1 h-3 w-3" />
                {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground" data-testid={`text-company-${stock.id}`}>
              {stock.companyName}
            </p>
            <p className="text-2xl font-bold text-foreground mt-2" data-testid={`text-price-${stock.id}`}>
              ${stock.currentPrice.toFixed(2)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={removeStockMutation.isPending}
            className="text-muted-foreground hover:text-destructive transition-colors"
            data-testid={`button-remove-${stock.id}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mini Chart */}
        <div className="mb-4">
          <MiniChart
            data={stock.chartData}
            trend={stock.trend}
            symbol={stock.symbol}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Change:</span>
          <span 
            className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}
            data-testid={`text-change-amount-${stock.id}`}
          >
            {isPositive ? '+' : ''}${stock.changeAmount.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
