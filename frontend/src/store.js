import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Cart Store ────────────────────────────────────────────────────────────────
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product) => {
        const { items } = get();
        const existing = items.find((i) => i._id === product._id);
        if (existing) {
          set({
            items: items.map((i) =>
              i._id === product._id ? { ...i, qty: i.qty + 1 } : i
            ),
          });
        } else {
          set({ items: [...items, { ...product, qty: 1 }] });
        }
      },

      removeItem: (id) =>
        set({ items: get().items.filter((i) => i._id !== id) }),

      updateQty: (id, qty) => {
        if (qty < 1) {
          set({ items: get().items.filter((i) => i._id !== id) });
          return;
        }
        set({
          items: get().items.map((i) => (i._id === id ? { ...i, qty } : i)),
        });
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.qty, 0);
      },
      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.price * i.qty, 0);
      },
    }),
    {
      name: 'acenursing-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// ─── Auth Store ────────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      updateUser: (updates) =>
        set({ user: { ...get().user, ...updates } }),

      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'acenursing-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
