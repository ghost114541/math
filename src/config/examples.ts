import type { ExampleDefinition } from '../types/cg'

export const EXAMPLE_DEFINITIONS: ExampleDefinition[] = [
  {
    id: 'affine-2d',
    title: 'Affine Transformation - 2D',
    subtitle: 'Affine Transformations in 2D',
    group: '2D Fundamentals',
    route: '/affine-2d',
  },
  {
    id: 'affine-3d',
    title: 'Affine Transformation - 3D',
    subtitle: 'Affine Transformations in 3D',
    group: '3D Transformations',
    route: '/affine-3d',
  },
  {
    id: 'projection-axonometric',
    title: 'Axonometric Projections',
    subtitle: 'Isometric, Dimetric, and Trimetric Projections',
    group: '3D Transformations',
    route: '/projection-axonometric',
  },
  {
    id: 'projection-perspective',
    title: 'Perspective Projection',
    subtitle: 'One-Point Projection and Homogeneous Divide',
    group: '3D Viewing Pipeline',
    route: '/projection-perspective',
  },
  {
    id: 'model-view-matrix',
    title: 'ModelView Matrix',
    subtitle: 'Model, View, and Their Composition',
    group: '3D Viewing Pipeline',
    route: '/model-view-matrix',
  },
  {
    id: 'clipping-3d',
    title: '3D Clipping',
    subtitle: 'OpenGL/WebGL Clip-Space Algorithms',
    group: '3D Viewing Pipeline',
    route: '/clipping-3d',
  },
]
