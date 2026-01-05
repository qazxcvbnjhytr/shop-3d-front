// client/src/admin/api/endpoints.js
export const ADMIN_PREFIX = "/api/admin";

export const endpoints = {
  // Admin module
  adminProducts: `${ADMIN_PREFIX}/products`,
  adminProductById: (id) => `${ADMIN_PREFIX}/products/${id}`,

  adminCategories: `${ADMIN_PREFIX}/categories`,
  adminCategoryById: (id) => `${ADMIN_PREFIX}/categories/${id}`,

  adminUsers: `${ADMIN_PREFIX}/users`,
  adminUserById: (id) => `${ADMIN_PREFIX}/users/${id}`,

  adminOrders: `${ADMIN_PREFIX}/orders`,
  adminSettings: `${ADMIN_PREFIX}/settings`,

  // Chat
  chatConversations: `${ADMIN_PREFIX}/chat-conversations`,
  messagesBetween: (u1, u2) => `/api/messages/${u1}/${u2}`,

  // Public
  translationsByLang: (lang) => `/api/translations/${lang}`,
  categoriesPublic: `/api/categories`,
};
