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
  ],
})