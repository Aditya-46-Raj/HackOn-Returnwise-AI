import { create } from 'zustand'

const useReturnStore = create((set, get) => ({
  // Multi-step form state
  currentStep: 1,
  totalSteps: 3,

  // Step 1 — Product Details
  productDetails: {
    productName: '',
    category: '',
    brand: '',
    originalPrice: '',
    returnReason: '',
  },

  // Step 2 — Condition
  condition: {
    conditionNotes: '',
    images: [],         // File objects
    imageUrls: [],      // Cloud/local storage URLs after upload
    uploading: false,
  },

  // Step 3 — Submission result
  submittedReturnId: null,
  analysisResult: null,

  // Actions
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, s.totalSteps) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

  setProductDetails: (details) =>
    set((s) => ({ productDetails: { ...s.productDetails, ...details } })),

  setCondition: (condition) =>
    set((s) => ({ condition: { ...s.condition, ...condition } })),

  addImages: (files) =>
    set((s) => ({
      condition: {
        ...s.condition,
        images: [...s.condition.images, ...files].slice(0, 5),
      },
    })),

  removeImage: (index) =>
    set((s) => ({
      condition: {
        ...s.condition,
        images: s.condition.images.filter((_, i) => i !== index),
      },
    })),

  setImageUrls: (urls) =>
    set((s) => ({ condition: { ...s.condition, imageUrls: urls } })),

  setSubmittedReturnId: (id) => set({ submittedReturnId: id }),
  setAnalysisResult: (result) => set({ analysisResult: result }),

  reset: () => set({
    currentStep: 1,
    productDetails: { productName: '', category: '', brand: '', originalPrice: '', returnReason: '' },
    condition: { conditionNotes: '', images: [], imageUrls: [], uploading: false },
    submittedReturnId: null,
    analysisResult: null,
  }),
}))

export default useReturnStore
