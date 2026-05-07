import {
  Activity,
  ArrowRightLeft,
  Atom,
  BarChart2,
  BarChart3,
  Box,
  Brain,
  Calculator,
  Circle,
  Coins,
  Combine,
  Compass,
  Component,
  Crosshair,
  GitBranch,
  GitFork,
  Hash,
  Hexagon,
  Layers,
  LineChart,
  Link2,
  Move,
  Shapes,
  Sigma,
  Spline,
  Table,
  TreePine,
  TrendingDown,
  Triangle,
  Waves,
} from 'lucide-react'

export type ModuleId =
  | 'linear'
  | 'vector'
  | 'eigen'
  | 'determinant'
  | 'limit'
  | 'derivative'
  | 'integral'
  | 'taylor'
  | 'fourier'
  | 'unit-circle'
  | 'pythagoras'
  | 'fibonacci'
  | 'voronoi'
  | 'galton'
  | 'bayes'
  | 'lln'
  | 'gradient'
  | 'regression'
  | 'activation'
  | 'neural-net'
  | 'set-theory'
  | 'truth-tables'
  | 'graph-theory'
  | 'sort'
  | 'bst'
  | 'stack'
  | 'queue'
  | 'list'
  | 'heap'
  | 'hash'

export type Category =
  | 'Algebraic'
  | 'Continuous'
  | 'Geometry'
  | 'Probabilistic'
  | 'Computational'
  | 'Discrete'
  | 'Sorting'
  | 'Linear DS'
  | 'Trees'
  | 'Hashing'

export const MODULES: ReadonlyArray<{
  id: ModuleId
  label: string
  category: Category
  icon: typeof Calculator
}> = [
  // Algebraic
  { id: 'linear', label: 'Linear Transformations', category: 'Algebraic', icon: Calculator },
  { id: 'vector', label: 'Vector Operations', category: 'Algebraic', icon: Compass },
  { id: 'eigen', label: 'Eigenvectors', category: 'Algebraic', icon: Move },
  { id: 'determinant', label: 'Determinant · Area', category: 'Algebraic', icon: Box },
  // Continuous
  { id: 'limit', label: 'Limit Convergence', category: 'Continuous', icon: Crosshair },
  { id: 'derivative', label: 'Derivative', category: 'Continuous', icon: Activity },
  { id: 'integral', label: 'Integral · Riemann Sums', category: 'Continuous', icon: BarChart2 },
  { id: 'taylor', label: 'Taylor Series', category: 'Continuous', icon: Spline },
  { id: 'fourier', label: 'Fourier Series', category: 'Continuous', icon: Waves },
  // Geometry
  { id: 'unit-circle', label: 'Unit Circle', category: 'Geometry', icon: Circle },
  { id: 'pythagoras', label: 'Pythagorean Theorem', category: 'Geometry', icon: Triangle },
  { id: 'fibonacci', label: 'Fibonacci Spiral', category: 'Geometry', icon: Atom },
  { id: 'voronoi', label: 'Voronoi Diagram', category: 'Geometry', icon: Hexagon },
  // Probabilistic
  { id: 'galton', label: 'Galton Board / CLT', category: 'Probabilistic', icon: Sigma },
  { id: 'bayes', label: "Bayes' Theorem", category: 'Probabilistic', icon: Combine },
  { id: 'lln', label: 'Law of Large Numbers', category: 'Probabilistic', icon: Coins },
  // Computational
  { id: 'gradient', label: 'Gradient Descent', category: 'Computational', icon: TrendingDown },
  { id: 'regression', label: 'Linear Regression', category: 'Computational', icon: LineChart },
  { id: 'activation', label: 'Activation Functions', category: 'Computational', icon: Component },
  { id: 'neural-net', label: 'Neural Network', category: 'Computational', icon: Brain },
  // Discrete
  { id: 'set-theory', label: 'Set Theory · Venn', category: 'Discrete', icon: Shapes },
  { id: 'truth-tables', label: 'Truth Tables', category: 'Discrete', icon: Table },
  { id: 'graph-theory', label: 'Graph Theory', category: 'Discrete', icon: GitFork },
  // Existing DS
  { id: 'sort', label: 'Sorting', category: 'Sorting', icon: BarChart3 },
  { id: 'stack', label: 'Stack', category: 'Linear DS', icon: Layers },
  { id: 'queue', label: 'Queue', category: 'Linear DS', icon: ArrowRightLeft },
  { id: 'list', label: 'Linked List', category: 'Linear DS', icon: Link2 },
  { id: 'bst', label: 'Binary Search Tree', category: 'Trees', icon: GitBranch },
  { id: 'heap', label: 'Max-Heap', category: 'Trees', icon: TreePine },
  { id: 'hash', label: 'Hash Table', category: 'Hashing', icon: Hash },
]

export const CATEGORY_ORDER: Category[] = [
  'Algebraic',
  'Continuous',
  'Geometry',
  'Probabilistic',
  'Computational',
  'Discrete',
  'Sorting',
  'Linear DS',
  'Trees',
  'Hashing',
]
