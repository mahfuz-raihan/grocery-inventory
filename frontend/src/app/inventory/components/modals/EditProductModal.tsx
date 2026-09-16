"use client";

import React, { useState, useEffect } from "react";
import { api, Product, Supplier, USD_EXCHANGE_RATE } from "../../types";

interface EditProductModalProps {
  editingProduct: Product | null;
  onClose: () => void;
  products: Product[];
  categories: any[];
  suppliers: Supplier[];
  materialTypes: string[];
  woodTypes: string[];
  currency: "BDT" | "USD";
  rbacRules: any;
  userRole: string;
  onProductUpdated: (product: Product) => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  editingProduct,
  onClose,
  products,
  categories,
  suppliers,
  materialTypes,
  woodTypes,
  currency,
  rbacRules,
  userRole,
  onProductUpdated,
}) => {
  const [editSku, setEditSku] = useState("");
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("Pieces");
  const [editPrice, setEditPrice] = useState("");
  const [editMinSellingPrice, setEditMinSellingPrice] = useState("");
  const [editType, setEditType] = useState("finished_product");
  const [editParentId, setEditParentId] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editCommission, setEditCommission] = useState("0");
  const [editAdditionalCost, setEditAdditionalCost] = useState("0");
  const [editColor, setEditColor] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editMinStock, setEditMinStock] = useState("");
  const [editMaxStock, setEditMaxStock] = useState("");
  const [editReorderQty, setEditReorderQty] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSupplier, setEditSupplier] = useState("");
  const [editTaxRate, setEditTaxRate] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editLength, setEditLength] = useState("");
  const [editWidth, setEditWidth] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editThickness, setEditThickness] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editMaterialType, setEditMaterialType] = useState("");
  const [editWoodType, setEditWoodType] = useState("");
  const [editBoardType, setEditBoardType] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setEditSku(editingProduct.sku || "");
      setEditName(editingProduct.name || "");
      setEditUnit(editingProduct.unit || "Pieces");
      setEditPrice(
        currency === "USD"
          ? (editingProduct.selling_price / USD_EXCHANGE_RATE).toFixed(2)
          : (editingProduct.selling_price || 0).toString()
      );
      setEditMinSellingPrice(
        editingProduct.min_selling_price != null
          ? currency === "USD"
            ? (editingProduct.min_selling_price / USD_EXCHANGE_RATE).toFixed(2)
            : editingProduct.min_selling_price.toString()
          : "0"
      );
      setEditType(editingProduct.product_type || "finished_product");
      setEditParentId(editingProduct.parent_id || "");
      setEditCost(
        editingProduct.purchase_cost
          ? currency === "USD"
            ? (editingProduct.purchase_cost / USD_EXCHANGE_RATE).toFixed(2)
            : editingProduct.purchase_cost.toString()
          : ""
      );
      setEditCommission(editingProduct.commission != null ? editingProduct.commission.toString() : "0");
      setEditAdditionalCost(editingProduct.additional_cost != null ? editingProduct.additional_cost.toString() : "0");
      setEditColor(editingProduct.color || "");
      setEditSize(editingProduct.size || "");
      setEditMinStock(editingProduct.min_stock_level ? editingProduct.min_stock_level.toString() : "");
      setEditMaxStock(editingProduct.max_stock_level ? editingProduct.max_stock_level.toString() : "");
      setEditReorderQty(editingProduct.reorder_quantity ? editingProduct.reorder_quantity.toString() : "");
      setEditCategory(editingProduct.category_id || "");
      setEditSupplier(editingProduct.supplier_id || "");
      setEditTaxRate(editingProduct.tax_rate ? editingProduct.tax_rate.toString() : "");
      setEditImage(editingProduct.product_image || "");
      setEditLength(editingProduct.length ? editingProduct.length.toString() : "");
      setEditWidth(editingProduct.width ? editingProduct.width.toString() : "");
      setEditHeight(editingProduct.height ? editingProduct.height.toString() : "");
      setEditThickness(editingProduct.thickness ? editingProduct.thickness.toString() : "");
      setEditWeight(editingProduct.weight ? editingProduct.weight.toString() : "");
      setEditMaterialType(editingProduct.material_type || "");
      setEditWoodType(editingProduct.wood_type || "");
      setEditBoardType(editingProduct.board_type || "");
      setEditActive(editingProduct.is_active !== false);
    }
  }, [editingProduct, currency]);

  if (!editingProduct) return null;

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editSku || !editName) return;
    setIsUpdatingProduct(true);
    try {
      const canEditPrice = rbacRules ? rbacRules.product_price_edit?.includes(userRole) : userRole === "owner";
      const finalPrice = canEditPrice
        ? editPrice
          ? currency === "USD"
            ? parseFloat(editPrice) * USD_EXCHANGE_RATE
            : parseFloat(editPrice)
          : editingProduct.selling_price
        : editingProduct.selling_price;
      const finalMinPrice = canEditPrice
        ? editMinSellingPrice
          ? currency === "USD"
            ? parseFloat(editMinSellingPrice) * USD_EXCHANGE_RATE
            : parseFloat(editMinSellingPrice)
          : editingProduct.min_selling_price || 0.0
        : editingProduct.min_selling_price || 0.0;
      const costValue = canEditPrice
        ? editCost
          ? currency === "USD"
            ? parseFloat(editCost) * USD_EXCHANGE_RATE
            : parseFloat(editCost)
          : editingProduct.purchase_cost || 0.0
        : editingProduct.purchase_cost || 0.0;
      const payload = {
        sku: editSku,
        name: editName,
        unit: editUnit,
        selling_price: finalPrice,
        min_selling_price: finalMinPrice,
        parent_id: editParentId || null,
        product_type: editType,
        color: editColor || null,
        size: editSize || null,
        purchase_cost: costValue,
        commission: editCommission ? parseFloat(editCommission) : 0.0,
        additional_cost: editAdditionalCost ? parseFloat(editAdditionalCost) : 0.0,
        min_stock_level: editMinStock ? parseFloat(editMinStock) : editingProduct.min_stock_level || 0.0,
        max_stock_level: editMaxStock ? parseFloat(editMaxStock) : editingProduct.max_stock_level || 0.0,
        reorder_quantity: editReorderQty ? parseFloat(editReorderQty) : editingProduct.reorder_quantity || 0.0,
        category_id: editCategory || null,
        supplier_id: editSupplier || null,
        tax_rate: editTaxRate ? parseFloat(editTaxRate) : editingProduct.tax_rate || 0.0,
        product_image: editImage || null,
        length: editLength ? parseFloat(editLength) : null,
        width: editWidth ? parseFloat(editWidth) : null,
        height: editHeight ? parseFloat(editHeight) : null,
        thickness: editThickness ? parseFloat(editThickness) : null,
        weight: editWeight ? parseFloat(editWeight) : null,
        material_type: editMaterialType || null,
        wood_type: editWoodType || null,
        board_type: editBoardType || null,
        is_active: editActive,
      };

      const updated = await api.updateProduct(editingProduct.id, payload);
      onProductUpdated(updated);
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to update product.");
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const canEditPrice = rbacRules ? rbacRules.product_price_edit?.includes(userRole) : userRole === "owner";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between bg-slate-55">
          <h3 className="text-xl font-bold text-gray-900">Edit Product: {editingProduct.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-650 text-2xl font-bold">
            ×
          </button>
        </div>
        <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU Reference</label>
              <input
                type="text"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Unit</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
              >
                <option value="Pieces">Pieces</option>
                <option value="Cubic Feet">Cubic Feet (cft)</option>
                <option value="Kg">Kilograms (kg)</option>
                <option value="Square Feet">Square Feet (sqft)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
            <input
              type="text"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Type</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
              >
                <option value="finished_product">Finished Furniture Product</option>
                <option value="raw_material">Raw Material (Wood/Board)</option>
                <option value="semi_finished_product">Semi Finished component</option>
                <option value="consumable">Consumable Item</option>
                <option value="spare_parts">Spare Parts</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Parent Template (For Variations)
              </label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={editParentId}
                onChange={(e) => setEditParentId(e.target.value)}
              >
                <option value="">-- No Parent --</option>
                {products
                  .filter((p) => !p.parent_id && p.id !== editingProduct.id)
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              >
                <option value="">-- No Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color Variation</label>
              <input
                type="text"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Material Type</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-gray-750"
                value={editMaterialType}
                onChange={(e) => setEditMaterialType(e.target.value)}
              >
                <option value="">-- Select Material Type --</option>
                {materialTypes.map((mat, i) => (
                  <option key={i} value={mat}>
                    {mat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wood Type</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-gray-750"
                value={editWoodType}
                onChange={(e) => setEditWoodType(e.target.value)}
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

          {/* Pricing & Stock Levels */}
          <div className="bg-slate-55 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing & Stock Levels</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Selling Price (৳)</label>
                <input
                  type="number"
                  step="any"
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium ${
                    !canEditPrice ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""
                  }`}
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  disabled={!canEditPrice}
                  placeholder="0.00"
                />
                {!canEditPrice && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                    Only configured roles can change selling price.
                  </span>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Selling Price (৳)</label>
                <input
                  type="number"
                  step="any"
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium ${
                    !canEditPrice ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""
                  }`}
                  value={editMinSellingPrice}
                  onChange={(e) => setEditMinSellingPrice(e.target.value)}
                  disabled={!canEditPrice}
                  placeholder="0.00"
                />
                <span className="text-[10px] text-gray-400 block mt-1">Floor price for POS / discounts</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Purchase Cost (৳)</label>
                <input
                  type="number"
                  step="any"
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium ${
                    !canEditPrice ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""
                  }`}
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  disabled={!canEditPrice}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Stock Level</label>
                <input
                  type="number"
                  step="any"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={editMinStock}
                  onChange={(e) => setEditMinStock(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Stock Level</label>
                <input
                  type="number"
                  step="any"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={editMaxStock}
                  onChange={(e) => setEditMaxStock(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reorder Qty</label>
                <input
                  type="number"
                  step="any"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={editReorderQty}
                  onChange={(e) => setEditReorderQty(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Board Type</label>
              <input
                type="text"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editBoardType}
                onChange={(e) => setEditBoardType(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Thickness (mm)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editThickness}
                onChange={(e) => setEditThickness(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Length (inch)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editLength}
                onChange={(e) => setEditLength(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Width (inch)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editWidth}
                onChange={(e) => setEditWidth(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Height (inch)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editHeight}
                onChange={(e) => setEditHeight(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Image Link</label>
              <input
                type="text"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editImage}
                onChange={(e) => setEditImage(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 pt-2">
            <input
              type="checkbox"
              id="editActive"
              checked={editActive}
              onChange={(e) => setEditActive(e.target.checked)}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="editActive" className="text-sm font-semibold text-gray-700">
              Product is active and purchasable
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingProduct}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold disabled:bg-gray-400"
            >
              {isUpdatingProduct ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

