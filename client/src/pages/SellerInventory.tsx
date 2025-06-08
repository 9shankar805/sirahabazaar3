import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Package, Plus, Edit, Trash2, Search, Filter, Download, Upload,
  AlertTriangle, TrendingUp, TrendingDown, BarChart3, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const stockUpdateSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(0),
  type: z.enum(['stock_in', 'stock_out', 'adjustment']),
  reason: z.string().optional()
});

export default function SellerInventory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // Mock store ID - in real app this would come from auth context
  const storeId = 1;

  const form = useForm<z.infer<typeof stockUpdateSchema>>({
    resolver: zodResolver(stockUpdateSchema),
    defaultValues: {
      quantity: 0,
      type: 'stock_in',
      reason: ''
    }
  });

  // Products query
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products/store', storeId],
  });

  // Inventory logs query
  const { data: inventoryLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/seller/inventory', storeId],
  });

  // Stock update mutation
  const updateStockMutation = useMutation({
    mutationFn: async (data: z.infer<typeof stockUpdateSchema>) => {
      return await apiRequest('/api/seller/inventory/update', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Stock Updated",
        description: "Product inventory has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products/store', storeId] });
      queryClient.invalidateQueries({ queryKey: ['/api/seller/inventory', storeId] });
      setIsUpdateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive"
      });
    }
  });

  const handleStockUpdate = (data: z.infer<typeof stockUpdateSchema>) => {
    updateStockMutation.mutate(data);
  };

  const openUpdateDialog = (product: any) => {
    setSelectedProduct(product);
    form.setValue('productId', product.id);
    setIsUpdateDialogOpen(true);
  };

  // Filter products based on search and stock level
  const filteredProducts = products?.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStock = stockFilter === 'all' || 
      (stockFilter === 'low' && (product.stock || 0) < 10) ||
      (stockFilter === 'out' && (product.stock || 0) === 0) ||
      (stockFilter === 'available' && (product.stock || 0) > 0);
    
    return matchesSearch && matchesStock;
  }) || [];

  const lowStockCount = products?.filter((p: any) => (p.stock || 0) < 10).length || 0;
  const outOfStockCount = products?.filter((p: any) => (p.stock || 0) === 0).length || 0;
  const totalValue = products?.reduce((sum: number, p: any) => sum + ((p.stock || 0) * parseFloat(p.price)), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
                <p className="text-sm text-muted-foreground">Manage your product stock and inventory</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/seller/products/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </Link>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Inventory Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
              <p className="text-xs text-muted-foreground">Items below 10 units</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
              <p className="text-xs text-muted-foreground">Items need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total stock value</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="available">In Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: any) => {
                    const stock = product.stock || 0;
                    const value = stock * parseFloat(product.price);
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.description?.substring(0, 50)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          PRD{product.id.toString().padStart(4, '0')}
                        </TableCell>
                        <TableCell>₹{product.price}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            stock === 0 ? 'text-red-600' : 
                            stock < 10 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {stock} units
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            stock === 0 ? 'destructive' : 
                            stock < 10 ? 'secondary' : 
                            'default'
                          }>
                            {stock === 0 ? 'Out of Stock' : 
                             stock < 10 ? 'Low Stock' : 
                             'In Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{value.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openUpdateDialog(product)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Link href={`/products/${product.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Inventory Logs */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Inventory Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventoryLogs?.slice(0, 10).map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      log.type === 'stock_in' ? 'bg-green-100 dark:bg-green-900' :
                      log.type === 'stock_out' ? 'bg-red-100 dark:bg-red-900' :
                      'bg-blue-100 dark:bg-blue-900'
                    }`}>
                      {log.type === 'stock_in' ? (
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : log.type === 'stock_out' ? (
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      ) : (
                        <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {log.type === 'stock_in' ? 'Stock Added' :
                         log.type === 'stock_out' ? 'Stock Removed' :
                         'Stock Adjusted'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.reason || 'No reason provided'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {log.type === 'stock_in' ? '+' : log.type === 'stock_out' ? '-' : '±'}
                      {Math.abs(log.quantity)} units
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock - {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Adjust the inventory quantity for this product. Choose whether to add, remove, or adjust stock.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleStockUpdate)} className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-muted-foreground">Current Stock</p>
                <p className="text-2xl font-bold">{selectedProduct?.stock || 0} units</p>
              </div>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Update Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stock_in">Add Stock</SelectItem>
                        <SelectItem value="stock_out">Remove Stock</SelectItem>
                        <SelectItem value="adjustment">Adjust to Exact Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch('type') === 'adjustment' ? 'New Stock Amount' : 'Quantity'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., New shipment, Damaged goods, Inventory count" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateStockMutation.isPending}>
                  {updateStockMutation.isPending ? 'Updating...' : 'Update Stock'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}