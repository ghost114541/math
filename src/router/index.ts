import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/affine-2d' },
    {
      path: '/affine-2d',
      name: 'affine-2d',
      component: () => import('../views/Affine2DView.vue'),
    },
    {
      path: '/affine-3d',
      name: 'affine-3d',
      component: () => import('../views/Affine3DView.vue'),
    },
    {
      path: '/projection-axonometric',
      name: 'projection-axonometric',
      component: () => import('../views/AxonometricProjectionView.vue'),
    },
    {
      path: '/projection-perspective',
      name: 'projection-perspective',
      component: () => import('../views/PerspectiveProjectionView.vue'),
    },
    {
      path: '/model-view-matrix',
      name: 'model-view-matrix',
      component: () => import('../views/ModelViewMatrixView.vue'),
    },
    {
      path: '/clipping-3d',
      name: 'clipping-3d',
      component: () => import('../views/ClippingView.vue'),
    },
  ],
})
