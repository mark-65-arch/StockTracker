import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockAdded: () => void;
}

export default function AddStockModal({ isOpen, onClose, onStockAdded }: AddStockModalProps) {
  const [symbol, setSymbol] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addStockMutation = useMutation({
    mutationFn: async (symbol: string) => {
      const response = await apiRequest("POST", "/api/stocks", { symbol: symbol.toUpperCase() });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Stock added",
        description: `${data.symbol} (${data.companyName}) has been added to your watchlist.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stocks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setSymbol("");
      setError("");
      onStockAdded();
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to add stock. Please check the symbol and try again.";
      setError(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) {
      setError("Please enter a stock symbol");
      return;
    }
    setError("");
    addStockMutation.mutate(symbol.trim());
  };

  const handleClose = () => {
    setSymbol("");
    setError("");
    addStockMutation.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-add-stock">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Add Stock to Watchlist
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Enter a valid stock ticker symbol to add it to your watchlist.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stock-symbol">Stock Symbol</Label>
            <Input
              id="stock-symbol"
              type="text"
              placeholder="e.g., AAPL, TSLA, GOOGL"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              disabled={addStockMutation.isPending}
              data-testid="input-stock-symbol"
            />
            <p className="text-xs text-muted-foreground">
              Enter a valid stock ticker symbol
            </p>
          </div>

          {error && (
            <Alert variant="destructive" data-testid="alert-error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {addStockMutation.isPending && (
            <Alert className="bg-blue-50 border-blue-200" data-testid="alert-loading">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription className="ml-2 text-blue-800">
                Validating stock symbol...
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={addStockMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={addStockMutation.isPending || !symbol.trim()}
              data-testid="button-submit"
            >
              {addStockMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Stock
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
