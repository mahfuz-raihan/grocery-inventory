"use client";

import React, { useState } from "react";
import { api, Product } from "../../types";

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

      // Close modal immediately on success
      resetForm();
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to create product. SKU might already exist.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-4 animate-scaleUp">
        <div className="p-6 border-b flex items-center justify-between bg-gray-50 sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Add New Product to Catalog</h3>
            <p className="text-xs text-gray-500 mt-1">Create a new product template or component</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
          >
            &times;
          </button>
        </div>

        {productSuccessMessage && (
          <div className="m-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-semibold">
            {productSuccessMessage}
          </div>
        )}

        <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Product Code (SKU) *</label>
              <input
                type="text"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                value={newProductSku}
                onChange={(e) => setNewProductSku(e.target.value)}
                placeholder="e.g. WD-CH-01"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Product Unit *</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Product Name *</label>
            <input
              type="text"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="e.g. Oak Wood Dining Chair"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Product Type *</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Parent Template (For Variations)
              </label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Color Variation</label>
              <input
                type="text"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                value={newProductColor}
                onChange={(e) => setNewProductColor(e.target.value)}
                placeholder="e.g. Natural Varnish"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Material Type</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Wood Type</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Board Type</label>
              <input
                type="text"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                value={newProductBoardType}
                onChange={(e) => setNewProductBoardType(e.target.value)}
                placeholder="e.g. MDF"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                value={newProductWeight}
                onChange={(e) => setNewProductWeight(e.target.value)}
                placeholder="e.g. 12"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Thickness (mm)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                value={newProductThickness}
                onChange={(e) => setNewProductThickness(e.target.value)}
                placeholder="e.g. 18"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Length (inch)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                value={newProductLength}
                onChange={(e) => setNewProductLength(e.target.value)}
                placeholder="e.g. 36"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Width (inch)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                value={newProductWidth}
                onChange={(e) => setNewProductWidth(e.target.value)}
                placeholder="e.g. 24"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Height (inch)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                value={newProductHeight}
                onChange={(e) => setNewProductHeight(e.target.value)}
                placeholder="e.g. 30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Product Image Link</label>
            <input
              type="text"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
              value={newProductImage}
              onChange={(e) => setNewProductImage(e.target.value)}
              placeholder="e.g. /images/chair.jpg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingProduct}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-bold transition-all text-sm shadow-sm"
            >
              {isSubmittingProduct ? "Creating..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

