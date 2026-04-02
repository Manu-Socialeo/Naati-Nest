import React, { createContext, useContext, useState } from 'react';
import { CartItem, MenuItem, Variant } from './types';

const CartContext = createContext<{
  items: CartItem[];
  addItem: (item: MenuItem, variant?: Variant) => void;
  removeItem: (cartItemId: string) => void;
  decrementItem: (cartItemId: string) => void;
  updateItemVariant: (oldCartItemId: string, newVariant: Variant) => void;
  clearCart: () => void;
}>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  decrementItem: () => {},
  updateItemVariant: () => {},
  clearCart: () => {},
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: MenuItem, variant?: Variant) => {
    setItems((prev) => {
      const cartItemId = variant ? `${item.id}-${variant.name}` : item.id;
      const existing = prev.find((i) => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map((i) => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        ...item, 
        cartItemId, 
        quantity: 1, 
        selectedVariant: variant,
        price: variant ? variant.price : item.price 
      }];
    });
  };

  const decrementItem = (cartItemId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.cartItemId === cartItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter((i) => i.cartItemId !== cartItemId);
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const updateItemVariant = (oldCartItemId: string, newVariant: Variant) => {
    setItems((prev) => {
      const oldItem = prev.find(i => i.cartItemId === oldCartItemId);
      if (!oldItem) return prev;

      const newCartItemId = `${oldItem.id}-${newVariant.name}`;
      
      // If the new variant is the same as the old one, do nothing
      if (newCartItemId === oldCartItemId) return prev;

      // Check if the new variant already exists in the cart
      const existingNewVariant = prev.find(i => i.cartItemId === newCartItemId);

      if (existingNewVariant) {
        // Merge quantities and remove the old item
        return prev.map(i => {
          if (i.cartItemId === newCartItemId) {
            return { ...i, quantity: i.quantity + oldItem.quantity };
          }
          return i;
        }).filter(i => i.cartItemId !== oldCartItemId);
      } else {
        // Just update the variant and price of the old item
        return prev.map(i => {
          if (i.cartItemId === oldCartItemId) {
            return {
              ...i,
              cartItemId: newCartItemId,
              selectedVariant: newVariant,
              price: newVariant.price
            };
          }
          return i;
        });
      }
    });
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, decrementItem, updateItemVariant, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
