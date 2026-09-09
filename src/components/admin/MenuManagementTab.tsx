import React, { useState } from 'react';
import { MenuItem, Category } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableMenuItem } from './SortableMenuItem';
import { ItemFormModal } from './ItemFormModal';

interface MenuManagementTabProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  categories: Category[];
  fetchMenuData: () => void;
}

export const MenuManagementTab = ({
  menuItems,
  setMenuItems,
  categories,
  fetchMenuData,
}: MenuManagementTabProps) => {
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);
      if (error) throw error;
      fetchMenuData();
      toast.success(
        item.name + ' ' + (!item.is_available ? 'is now available' : 'marked out of stock')
      );
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const toggleBestseller = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_bestseller: !item.is_bestseller })
        .eq('id', item.id);
      if (error) throw error;
      fetchMenuData();
      toast.success(
        item.name + ' ' + (!item.is_bestseller ? 'marked as bestseller' : 'removed from bestsellers')
      );
    } catch {
      toast.error('Failed to update bestseller status');
    }
  };

  const toggleTodaysSpecial = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_todays_special: !item.is_todays_special })
        .eq('id', item.id);
      if (error) throw error;
      fetchMenuData();
      toast.success(
        item.name +
          ' ' +
          (!item.is_todays_special ? 'marked as today special' : 'removed from today special')
      );
    } catch {
      toast.error('Failed to update today special status');
    }
  };

  const deleteItem = async (item: MenuItem) => {
    if (!confirm('Are you sure you want to delete ' + item.name + '?')) return;
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', item.id);
      if (error) throw error;
      fetchMenuData();
      toast.success(item.name + ' deleted');
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    itemId?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = (itemId || 'new') + '-' + Date.now() + '.' + fileExt;
      const { error: uploadError } = await supabase.storage
        .from('menu-photos')
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from('menu-photos').getPublicUrl(fileName);
      if (itemId && editingItem) {
        await supabase.from('menu_items').update({ image_url: publicUrl }).eq('id', itemId);
        setEditingItem({ ...editingItem, image_url: publicUrl });
        fetchMenuData();
      }
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    const activeItem = menuItems.find(i => i.id === active.id);
    const overItem = menuItems.find(i => i.id === over.id);
    if (!activeItem || !overItem || activeItem.category_id !== overItem.category_id) return;

    const catItems = menuItems
      .filter(i => i.category_id === activeItem.category_id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const oldIndex = catItems.findIndex(i => i.id === active.id);
    const newIndex = catItems.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(catItems, oldIndex, newIndex);

    // Instant local state update
    const otherItems = menuItems.filter(i => i.category_id !== activeItem.category_id);
    setMenuItems([
      ...otherItems,
      ...reordered.map((item, idx) => ({ ...item, sort_order: idx })),
    ]);

    // Persist to Supabase asynchronously
    reordered.forEach((item, idx) => {
      supabase.from('menu_items').update({ sort_order: idx }).eq('id', item.id);
    });
  };

  const filteredItems = menuItems.filter(item => {
    if (categoryFilter !== 'all' && item.category_id !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || (item.name_kn && item.name_kn.includes(q));
    }
    return true;
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div>
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200 focus-within:border-primary transition-colors">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search dishes..."
                className="bg-transparent border-none outline-none w-full text-sm font-medium"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-primary"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>

        {menuItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
            <Settings size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No menu items yet. Add your first item.</p>
          </div>
        ) : (
          categories.map(category => {
            const catItems = filteredItems
              .filter(i => i.category_id === category.id)
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            if (catItems.length === 0) return null;
            return (
              <div key={category.id} className="mb-6">
                <h3 className="text-sm font-extrabold text-gray-800 mb-3 pb-2 border-b border-gray-200 uppercase tracking-wider flex items-center justify-between">
                  <span>{category.name}</span>
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {catItems.length} items
                  </span>
                </h3>
                <SortableContext
                  items={catItems.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {catItems.map(item => (
                      <SortableMenuItem
                        key={item.id}
                        item={item}
                        toggleAvailability={toggleAvailability}
                        toggleBestseller={toggleBestseller}
                        toggleTodaysSpecial={toggleTodaysSpecial}
                        deleteItem={deleteItem}
                        setEditingItem={setEditingItem}
                        setShowAddForm={setShowAddForm}
                        isDragging={activeDragId === item.id}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })
        )}

        {showAddForm && (
          <ItemFormModal
            item={editingItem}
            categories={categories}
            onClose={() => {
              setShowAddForm(false);
              setEditingItem(null);
            }}
            onSuccess={() => {
              setShowAddForm(false);
              setEditingItem(null);
              fetchMenuData();
            }}
            onImageUpload={handleImageUpload}
            uploadingImage={uploadingImage}
          />
        )}
      </div>
    </DndContext>
  );
};
