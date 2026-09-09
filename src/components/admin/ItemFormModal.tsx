import React, { useState } from 'react';
import { MenuItem, Category } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { X, RefreshCw, Save, Image as ImageIcon, Plus, Trash2, Timer } from 'lucide-react';

interface ItemFormModalProps {
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, itemId?: string) => void;
  uploadingImage: boolean;
}

export const ItemFormModal = ({
  item,
  categories,
  onClose,
  onSuccess,
  onImageUpload,
  uploadingImage,
}: ItemFormModalProps) => {
  const [name, setName] = useState(item?.name || '');
  const [nameKn, setNameKn] = useState(item?.name_kn || '');
  const [description, setDescription] = useState(item?.description || '');
  const [descriptionKn, setDescriptionKn] = useState(item?.description_kn || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [categoryId, setCategoryId] = useState(item?.category_id || '');
  const [imageUrl, setImageUrl] = useState(item?.image_url || '');
  const [hasVariants, setHasVariants] = useState(item?.has_variants || false);
  const [variants, setVariants] = useState(item?.variants || [{ id: '', name: '', price: 0 }]);
  const [availableFrom, setAvailableFrom] = useState(item?.available_from || '');
  const [availableUntil, setAvailableUntil] = useState(item?.available_until || '');
  const [saving, setSaving] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameKn, setNewCatNameKn] = useState('');

  const addVariant = () => setVariants([...variants, { id: '', name: '', price: 0 }]);
  const removeVariant = (idx: number) => setVariants(variants.filter((_, i) => i !== idx));
  const updateVariant = (idx: number, field: string, value: string | number) => {
    const u = [...variants];
    u[idx] = { ...u[idx], [field]: value };
    setVariants(u);
  };

  const handleSave = async () => {
    if (!name || !price) {
      toast.error('Name and price are required');
      return;
    }
    if (!categoryId && !showNewCategory) {
      toast.error('Select a category or add a new one');
      return;
    }
    setSaving(true);
    try {
      let finalCategoryId = categoryId;
      if (showNewCategory && newCatName) {
        const { data: newCat, error: catError } = await supabase
          .from('categories')
          .insert({ name: newCatName, name_kn: newCatNameKn || null })
          .select()
          .single();
        if (catError) throw catError;
        finalCategoryId = newCat.id;
      }
      const data = {
        name,
        name_kn: nameKn,
        description,
        description_kn: descriptionKn,
        price: parseFloat(price),
        image_url: imageUrl,
        category_id: finalCategoryId,
        has_variants: hasVariants,
        available_from: availableFrom || null,
        available_until: availableUntil || null,
        variants: hasVariants
          ? variants
              .filter(v => v.name)
              .map(v => ({
                ...v,
                id: v.id || v.name.toLowerCase().replace(/\s/g, '-'),
              }))
          : [],
      };
      if (item) {
        const { error } = await supabase.from('menu_items').update(data).eq('id', item.id);
        if (error) throw error;
        toast.success(name + ' updated');
      } else {
        const { error } = await supabase.from('menu_items').insert(data);
        if (error) throw error;
        toast.success(name + ' added');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-xl font-extrabold text-gray-800">
            {item ? 'Edit Item' : 'Add New Item'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Photo
            </label>
            <div className="flex items-center gap-4">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-20 h-20 rounded-xl object-cover bg-gray-100 border border-gray-200"
                />
              )}
              <div className="flex-1">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="Paste image URL"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mb-2"
                />
                <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-sm font-semibold cursor-pointer hover:bg-gray-200 transition-colors w-fit">
                  <ImageIcon size={16} /> Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => onImageUpload(e, item?.id)}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
                {uploadingImage && (
                  <span className="text-xs text-primary font-medium animate-pulse">
                    Uploading image...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">
                Name (English) *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">
                Name (Kannada)
              </label>
              <input
                type="text"
                value={nameKn}
                onChange={e => setNameKn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">
                Description (English)
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">
                Description (Kannada)
              </label>
              <input
                type="text"
                value={descriptionKn}
                onChange={e => setDescriptionKn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">
                Price (₹) *
              </label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
                min="0"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">
                Category *
              </label>
              {!showNewCategory ? (
                <div>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium"
                  >
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="text-xs text-primary font-bold mt-1"
                  >
                    + Add new category
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="New category name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mb-1"
                  />
                  <input
                    type="text"
                    value={newCatNameKn}
                    onChange={e => setNewCatNameKn(e.target.value)}
                    placeholder="Kannada name (optional)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mb-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategory(false);
                      setNewCatName('');
                      setNewCatNameKn('');
                    }}
                    className="text-xs text-gray-500 font-bold"
                  >
                    Cancel, use existing category
                  </button>
                </div>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={e => setHasVariants(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary accent-primary"
            />
            <span className="text-sm font-semibold text-gray-700">Has Variants (Portions / Sizes)</span>
          </label>

          {hasVariants && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Variants
                </label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} /> Add Variant
                </button>
              </div>
              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={v.name}
                      onChange={e => updateVariant(idx, 'name', e.target.value)}
                      placeholder="Name (e.g. Half, Full)"
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm"
                    />
                    <input
                      type="number"
                      value={v.price}
                      onChange={e => updateVariant(idx, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                      className="w-28 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold"
                      min="0"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block flex items-center gap-2">
              <Timer size={16} className="text-primary" /> Time-Based Availability (optional)
            </label>
            <p className="text-xs text-gray-400 mb-2">Leave blank for all-day availability</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Available From</label>
                <input
                  type="time"
                  value={availableFrom}
                  onChange={e => setAvailableFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Available Until</label>
                <input
                  type="time"
                  value={availableUntil}
                  onChange={e => setAvailableUntil(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {item ? 'Update' : 'Add'} Item
          </button>
        </div>
      </div>
    </div>
  );
};
