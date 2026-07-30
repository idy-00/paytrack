import { create } from 'zustand'
import { api } from '@/lib/api'

const LOW_STOCK_THRESHOLD = 3

export const useStockStore = create((set, get) => ({
  articles: [],
  loading: false,
  error: null,
  lowStockThreshold: LOW_STOCK_THRESHOLD,

  fetchArticles: async () => {
    set({ loading: true, error: null })
    try {
      const response = await api.getArticles()
      set({ articles: response.data || response, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  addArticle: async (data) => {
    set({ loading: true, error: null })
    try {
      const article = await api.createArticle(data)
      set(state => ({ articles: [...state.articles, article], loading: false }))
      return article
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  updateStock: async (articleId, newStock) => {
    try {
      const article = await api.updateArticle(articleId, { stock: newStock })
      set(state => ({
        articles: state.articles.map(a => a.id === articleId ? article : a),
      }))
      return article
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  getArticleStock: (articleId) => {
    const article = get().articles.find(a => a.id === articleId)
    return article?.stock ?? null
  },

  isLowStock: (articleId) => {
    const stock = get().getArticleStock(articleId)
    if (stock === null) return false
    return stock > 0 && stock <= get().lowStockThreshold
  },

  isOutOfStock: (articleId) => {
    const stock = get().getArticleStock(articleId)
    if (stock === null) return false
    return stock <= 0
  },

  getLowStockArticles: () => {
    const { articles, lowStockThreshold } = get()
    return articles.filter(a => a.stock > 0 && a.stock <= lowStockThreshold)
  },

  getOutOfStockArticles: () => {
    const { articles } = get()
    return articles.filter(a => a.stock <= 0)
  },
}))
