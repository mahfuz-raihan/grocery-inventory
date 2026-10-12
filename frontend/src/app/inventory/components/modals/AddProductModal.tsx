"use client";

import React, { useState } from "react";
import { api, Product } from "../../types";
import { toast } from "@/components/ui/Toast";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: any[];
  productTypes: { key: string; label: string }[];
  materialTypes: string[];
  woodTypes: string[];
  onProductCreated: (product: Product) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  productTypes,
  materialTypes,
  woodTypes,
  onProductCreated,
}) => {
  const [newProductSku, setNewProductSku] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("Pieces");
  const [newProductParentId, setNewProductParentId] = useState("");
  const [newProductType, setNewProductType] = useState("raw_material");
  const [newProductColor, setNewProductColor] = useState("");
  const [newProductSize, setNewProductSize] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductImage, setNewProductImage] = useState("");
  const [newProductLength, setNewProductLength] = useState("");
  const [newProductWidth, setNewProductWidth] = useState("");
  const [newProductHeight, setNewProductHeight] = useState("");
  const [newProductThickness, setNewProductThickness] = useState("");
  const [newProductWeight, setNewProductWeight] = useState("");
  const [newProductMaterialType, setNewProductMaterialType] = useState("");
  const [newProductWoodType, setNewProductWoodType] = useState("");
  const [newProductBoardType, setNewProductBoardType] = useState("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productSuccessMessage, setProductSuccessMessage] = useState("");

  if (!isOpen) return null;

  const resetForm = () => {
    setNewProductSku("");
    setNewProductName("");
    setNewProductUnit("Pieces");
    setNewProductColor("");
    setNewProductSize("");
    setNewProductCategory("");
    setNewProductImage("");
    setNewProductLength("");
    setNewProductWidth("");
    setNewProductHeight("");
    setNewProductThickness("");
    setNewProductWeight("");
    setNewProductMaterialType("");
    setNewProductWoodType("");
    setNewProductBoardType("");
    setNewProductParentId("");
    setProductSuccessMessage("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductSku || !newProductName) return;

    setIsSubmittingProduct(true);
    setProductSuccessMessage("");

    try {
      const payload = {
        sku: newProductSku,
        name: newProductName,
        unit: newProductUnit,
        selling_price: 0.0,
        parent_id: newProductParentId || null,
        product_type: newProductType,
        color: newProductColor || null,
        size: newProductSize || null,
        purchase_cost: 0.0,
        min_stock_level: 0.0,
        max_stock_level: 0.0,
        reorder_quantity: 0.0,
        category_id: newProductCategory || null,
        supplier_id: null,
        tax_rate: 0.0,
        product_image: newProductImage || null,
        length: newProductLength ? parseFloat(newProductLength) : null,
        width: newProductWidth ? parseFloat(newProductWidth) : null,
        height: newProductHeight ? parseFloat(newProductHeight) : null,
        thickness: newProductThickness ? parseFloat(newProductThickness) : null,
        weight: newProductWeight ? parseFloat(newProductWeight) : null,
        material_type: newProductMaterialType || null,
        wood_type: newProductWoodType || null,
        board_type: newProductBoardType || null,
      };

      const newProduct = await api.createProduct(payload);
      onProductCreated(newProduct);
      toast.success(`Product "${productName}" registered successfully!`);

      // Close modal immediately on success
      resetForm();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create product. SKU might already exist.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-4">
        <div className="p-5 border-b border-border flex items-center justify-between bg-slate-50/70 sticky top-0 z-10">
          <div>
            <h3 className="text-base font-bold text-slate-900">Add New Product to Catalog</h3>
            <p className="text-xs text-slate-500 mt-0.5">Create a new product template or component</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 w-8 h-8 rounded-md hover:bg-slate-200/60 flex items-center justify-center text-lg transition"
          >
            ✕
          </button>
        </div>

        {productSuccessMessage && (
          <div className="m-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold">
            {productSuccessMessage}
          </div>
        )}

        <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Product Code (SKU) *</label>
              <input
                type="text"
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs font-mono text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={newProductSku}
                onChange={(e) => setNewProductSku(e.target.value)}
                placeholder="e.g. WD-CH-01"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Product Unit *</label>
              <select
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={newProductUnit}
                onChange={(e) => setNewProductUnit(e.target.value)}
              >
                <option value="Pieces">Pieces</option>
                <option value="Cubic Feet">Cubic Feet (cft)</option>
                <option value="Kg">Kilograms (kg)</option>
                <option value="Square Feet">Square Feet (sqft)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Product Name *</label>
            <input
              type="text"
              className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="e.g. Oak Wood Dining Chair"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Product Type *</label>
              <select
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={newProductType}
                onChange={(e) => setNewProductType(e.target.value)}
              >
                {productTypes.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Parent Template (For Variations)
              </label>
              <select
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={newProductParentId}
                onChange={(e) => setNewProductParentId(e.target.value)}
              >
                <option value="">-- No Parent Template --</option>
                {products
                  .filter((p) => !p.parent_id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
              <select
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value)}
              >
                <option value="">-- No Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Color Variation</label>
              <input
                type="text"
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={newProductColor}
                onChange={(e) => setNewProductColor(e.target.value)}
                placeholder="e.g. Natural Varnish"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Material Type</label>
              <select
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={newProductMaterialType}
                onChange={(e) => setNewProductMaterialType(e.target.value)}
              >
                <option value="">-- Select Material Type --</option>
                {materialTypes.map((mat, i) => (
                  <option key={i} value={mat}>
                    {mat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Wood Type</label>
              <select
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={newProductWoodType}
                onChange={(e) => setNewProductWoodType(e.target.value)}
              >
                <option value="">-- Select Wood Type --</option>
                {woodTypes.map((wood, i) => (
                  <option key={i} value={wood}>
                    {wood}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Board Type</label>
              <input
                type="text"
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={newProductBoardType}
                onChange={(e) => setNewProductBoardType(e.target.value)}
                placeholder="e.g. MDF"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs font-mono text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={newProductWeight}
                onChange={(e) => setNewProductWeight(e.target.value)}
                placeholder="e.g. 12"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Thickness (mm)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs font-mono text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={newProductThickness}
                onChange={(e) => setNewProductThickness(e.target.value)}
                placeholder="e.g. 18"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Length (inch)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs font-mono text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={newProductLength}
                onChange={(e) => setNewProductLength(e.target.value)}
                placeholder="e.g. 36"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Width (inch)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs font-mono text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={newProductWidth}
                onChange={(e) => setNewProductWidth(e.target.value)}
                placeholder="e.g. 24"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Height (inch)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs font-mono text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={newProductHeight}
                onChange={(e) => setNewProductHeight(e.target.value)}
                placeholder="e.g. 30"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Product Image Link</label>
            <input
              type="text"
              className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
              value={newProductImage}
              onChange={(e) => setNewProductImage(e.target.value)}
              placeholder="e.g. /images/chair.jpg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingProduct}
              className="btn-primary text-xs"
            >
              {isSubmittingProduct ? "Creating..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

