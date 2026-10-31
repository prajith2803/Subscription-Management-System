import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils';
import { Product, ProductType } from '../../types';
import { Plus, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Product form
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>('SOFTWARE');
  const [salesPrice, setSalesPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [description, setDescription] = useState('');

  // Variant form
  const [variantName, setVariantName] = useState('');
  const [additionalPrice, setAdditionalPrice] = useState('0');

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list({ limit: 50 }),
  });

  const createProductMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created');
      setIsProductModalOpen(false);
      setName('');
      setSalesPrice('');
      setCostPrice('');
      setDescription('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create product'),
  });

  const addVariantMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: any }) =>
      productsApi.addVariant(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Variant added');
      setIsVariantModalOpen(false);
      setVariantName('');
      setAdditionalPrice('0');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to add variant'),
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate({
      name,
      type,
      salesPrice: Number(salesPrice),
      costPrice: Number(costPrice || '0'),
      description,
    });
  };

  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    addVariantMutation.mutate({
      productId: selectedProduct.id,
      data: { name: variantName, additionalPrice: Number(additionalPrice) },
    });
  };

  const columns: Column<Product>[] = [
    {
      header: 'Product Name',
      cell: (p) => (
        <div>
          <p className="font-semibold text-slate-900">{p.name}</p>
          <p className="text-xs text-slate-400">{p.description || 'No description'}</p>
          {p.variants && p.variants.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {p.variants.map((v) => (
                <span
                  key={v.id}
                  className="inline-flex items-center text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                >
                  <Tag className="h-2.5 w-2.5 mr-1" />
                  {v.name} (+{formatCurrency(v.additionalPrice)})
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      cell: (p) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {p.type}
        </span>
      ),
    },
    {
      header: 'Base Price',
      cell: (p) => formatCurrency(p.salesPrice),
    },
    {
      header: 'Cost',
      cell: (p) => formatCurrency(p.costPrice),
    },
    {
      header: 'Status',
      cell: (p) => <Badge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      header: 'Actions',
      cell: (p) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedProduct(p);
            setIsVariantModalOpen(true);
          }}
        >
          <Plus className="h-3 w-3 mr-1" /> Add Variant
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products & Variants</h1>
          <p className="text-sm text-slate-500">Manage catalog software, add-ons and configurable editions</p>
        </div>
        <Button onClick={() => setIsProductModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Product
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={data?.data || []} isLoading={isLoading} />
      </Card>

      {/* Create Product Modal */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Add Catalog Product">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input label="Product Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Odoo ERP" />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ProductType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="SOFTWARE">Software</option>
              <option value="SERVICE">Service</option>
              <option value="ADDON">Add-on</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Sales Price (₹)" type="number" required value={salesPrice} onChange={(e) => setSalesPrice(e.target.value)} placeholder="5000" />
            <Input label="Cost Price (₹)" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="1000" />
          </div>

          <Input label="Description / Notes" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Complete business ERP suite..." />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createProductMutation.isPending}>
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Variant Modal */}
      <Modal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        title={`Add Variant to ${selectedProduct?.name}`}
      >
        <form onSubmit={handleAddVariant} className="space-y-4">
          <Input label="Variant Name" required value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="e.g. Enterprise Edition" />
          <Input label="Additional Price (₹)" type="number" required value={additionalPrice} onChange={(e) => setAdditionalPrice(e.target.value)} placeholder="2500" />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsVariantModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={addVariantMutation.isPending}>
              Add Variant
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

