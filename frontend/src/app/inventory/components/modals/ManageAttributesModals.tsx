"use client";

import React from "react";
import { api } from "../../types";

interface ManageAttributesModalsProps {
  showProductTypesModal: boolean;
  setShowProductTypesModal: (v: boolean) => void;
  productTypes: { key: string; label: string }[];
  updateProductTypes: (newTypes: { key: string; label: string }[]) => void;

  showCategoriesModal: boolean;
  setShowCategoriesModal: (v: boolean) => void;
  categories: any[];
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;

  showMaterialTypesModal: boolean;
  setShowMaterialTypesModal: (v: boolean) => void;
  materialTypes: string[];
  updateMaterialTypes: (newMats: string[]) => void;

  showWoodTypesModal: boolean;
  setShowWoodTypesModal: (v: boolean) => void;
  woodTypes: string[];
  updateWoodTypesState: (newWoods: string[]) => void;
}

export default function ManageAttributesModals({
  showProductTypesModal,
  setShowProductTypesModal,
  productTypes,
  updateProductTypes,
  showCategoriesModal,
  setShowCategoriesModal,
  categories,
  setCategories,
  showMaterialTypesModal,
  setShowMaterialTypesModal,
  materialTypes,
  updateMaterialTypes,
  showWoodTypesModal,
  setShowWoodTypesModal,
  woodTypes,
  updateWoodTypesState,
}: ManageAttributesModalsProps) {
  return (
    <>
      {/* 1. Manage Product Types Modal */}
      {showProductTypesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-scaleUp">
            <div className="p-5 border-b flex items-center justify-between bg-purple-50">
              <h3 className="text-base font-bold text-purple-900">⚙️ Manage Product Types</h3>
              <button
                type="button"
                onClick={() => setShowProductTypesModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {productTypes.map((type, i) => (
                <div key={type.key} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <span className="font-semibold text-gray-800 text-sm">{type.label}</span>
                    <span className="text-[10px] text-gray-400 font-mono block">Key: {type.key}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete product type "${type.label}"?`)) {
                        updateProductTypes(productTypes.filter((_, idx) => idx !== i));
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">Add New Product Type</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="new-type-label"
                  placeholder="e.g. Fabrics"
                  className="flex-1 p-2 border rounded-lg text-xs outline-none bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    const labelInput = document.getElementById("new-type-label") as HTMLInputElement;
                    const val = labelInput?.value.trim();
                    if (!val) return;
                    const key = val.toLowerCase().replace(/[^a-z0-9_]/g, "_");
                    if (productTypes.some(t => t.key === key)) {
                      alert("Product type key already exists!");
                      return;
                    }
                    updateProductTypes([...productTypes, { key, label: val }]);
                    labelInput.value = "";
                  }}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Manage Categories Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-scaleUp">
            <div className="p-5 border-b flex items-center justify-between bg-indigo-50">
              <h3 className="text-base font-bold text-indigo-900">⚙️ Manage Categories</h3>
              <button
                type="button"
                onClick={() => setShowCategoriesModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="font-semibold text-gray-800 text-sm">{c.name}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete category "${c.name}"?`)) {
                        try {
                          await api.deleteCategory(c.id);
                          setCategories(categories.filter(cat => cat.id !== c.id));
                          alert("Category deleted successfully!");
                        } catch (err: any) {
                          alert(err.message || "Failed to delete category (Ensure no products belong to it)");
                        }
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">Create New Category</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="new-category-name"
                  placeholder="e.g. Sofa Beds"
                  className="flex-1 p-2 border rounded-lg text-xs outline-none bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const nameInput = document.getElementById("new-category-name") as HTMLInputElement;
                    const val = nameInput?.value.trim();
                    if (!val) return;
                    try {
                      const newCat = await api.createCategory({ name: val });
                      setCategories([...categories, newCat]);
                      nameInput.value = "";
                      alert("Category created successfully!");
                    } catch (err: any) {
                      alert(err.message || "Failed to create category");
                    }
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Manage Material Types Modal */}
      {showMaterialTypesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-scaleUp">
            <div className="p-5 border-b flex items-center justify-between bg-amber-50">
              <h3 className="text-base font-bold text-amber-900">⚙️ Manage Material Types</h3>
              <button
                type="button"
                onClick={() => setShowMaterialTypesModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {materialTypes.map((mat, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="font-semibold text-gray-800 text-sm">{mat}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete material type "${mat}"?`)) {
                        updateMaterialTypes(materialTypes.filter((_, idx) => idx !== i));
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">Add Material Option</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="new-material-name"
                  placeholder="e.g. Leatherette"
                  className="flex-1 p-2 border rounded-lg text-xs outline-none bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    const matInput = document.getElementById("new-material-name") as HTMLInputElement;
                    const val = matInput?.value.trim();
                    if (!val) return;
                    if (materialTypes.includes(val)) {
                      alert("Material Type already exists!");
                      return;
                    }
                    updateMaterialTypes([...materialTypes, val]);
                    matInput.value = "";
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Manage Wood Types Modal */}
      {showWoodTypesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-scaleUp">
            <div className="p-5 border-b flex items-center justify-between bg-emerald-50">
              <h3 className="text-base font-bold text-emerald-900">⚙️ Manage Wood Types</h3>
              <button
                type="button"
                onClick={() => setShowWoodTypesModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {woodTypes.map((wood, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="font-semibold text-gray-800 text-sm">{wood}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete wood type "${wood}"?`)) {
                        updateWoodTypesState(woodTypes.filter((_, idx) => idx !== i));
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">Add Wood Type Option</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="new-wood-name"
                  placeholder="e.g. Acacia"
                  className="flex-1 p-2 border rounded-lg text-xs outline-none bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    const woodInput = document.getElementById("new-wood-name") as HTMLInputElement;
                    const val = woodInput?.value.trim();
                    if (!val) return;
                    if (woodTypes.includes(val)) {
                      alert("Wood Type already exists!");
                      return;
                    }
                    updateWoodTypesState([...woodTypes, val]);
                    woodInput.value = "";
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

