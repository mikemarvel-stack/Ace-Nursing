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
    }),
    {
      name: 'acenursing-cart',
      version: 1,
      migrate: () => ({ items: [] }),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export const cartTotalItems = (state) =>
  state.items.reduce((sum, i) => sum + i.qty, 0);

export const cartSubtotal = (state) =>
  state.items.reduce((sum, i) => sum + i.price * i.qty, 0);

// ─── Auth Store ────────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      lastActivityTime: null,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true, lastActivityTime: Date.now() }),

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, lastActivityTime: null });
        useCartStore.getState().clearCart();
      },

      updateUser: (updates) =>
        set({ user: { ...get().user, ...updates } }),

      isAdmin: () => get().user?.role === 'admin',

      updateActivity: () => set({ lastActivityTime: Date.now() }),
    }),
    {
      name: 'acenursing-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      // Validate hydrated state to prevent corrupted localStorage from crashing app
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        
        // Validate essential fields
        const hasValidToken = state.token && typeof state.token === 'string';
        const hasValidUser = !state.user || (typeof state.user === 'object' && state.user._id);
        const isAuthenticated = state.isAuthenticated === true;

        // If state is invalid, reset to defaults
        if (!hasValidToken && isAuthenticated) {
          state.isAuthenticated = false;
          state.token = null;
          state.user = null;
        }

        if (!hasValidUser && state.user) {
          state.user = null;
          state.isAuthenticated = false;
        }
      },
    }
  )
);
