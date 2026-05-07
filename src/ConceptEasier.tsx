/**
 * ConceptEasier — interactive visualizations for Math, Algorithms, and Data Structures.
 *
 * Modules live under src/modules/, shared infrastructure under src/shared/.
 * The root just owns the active module id and dispatches to the right component.
 */

import { useState } from 'react'
import { type ModuleId, Sidebar } from './shared/modules'
// Algebraic
import { LinearTransformModule } from './modules/LinearTransform'
import { VectorOpsModule } from './modules/VectorOps'
import { EigenvectorsModule } from './modules/Eigenvectors'
import { DeterminantModule } from './modules/Determinant'
// Continuous
import { LimitConvergenceModule } from './modules/LimitConvergence'
import { DerivativeModule } from './modules/Derivative'
import { RiemannSumsModule } from './modules/RiemannSums'
import { TaylorSeriesModule } from './modules/TaylorSeries'
import { FourierSeriesModule } from './modules/FourierSeries'
// Geometry
import { UnitCircleModule } from './modules/UnitCircle'
import { PythagorasModule } from './modules/Pythagoras'
import { FibonacciSpiralModule } from './modules/FibonacciSpiral'
import { VoronoiModule } from './modules/Voronoi'
// Probabilistic
import { GaltonBoardModule } from './modules/GaltonBoard'
import { BayesTheoremModule } from './modules/BayesTheorem'
import { LawOfLargeNumbersModule } from './modules/LawOfLargeNumbers'
// Computational
import { GradientDescentModule } from './modules/GradientDescent'
import { LinearRegressionModule } from './modules/LinearRegression'
import { ActivationModule } from './modules/Activation'
import { NeuralNetworkModule } from './modules/NeuralNetwork'
// Discrete
import { SetTheoryModule } from './modules/SetTheory'
import { TruthTablesModule } from './modules/TruthTables'
import { GraphTheoryModule } from './modules/GraphTheory'
// Existing DS
import { SortingModule } from './modules/Sorting'
import { StackModule } from './modules/Stack'
import { QueueModule } from './modules/Queue'
import { LinkedListModule } from './modules/LinkedList'
import { BSTModule } from './modules/BST'
import { HeapModule } from './modules/Heap'
import { HashTableModule } from './modules/HashTable'

export default function ConceptEasier() {
  const [activeModule, setActiveModule] = useState<ModuleId>('linear')

  return (
    <div className="flex h-screen w-screen bg-[#FBFBFB] text-[#222] overflow-hidden">
      <Sidebar active={activeModule} onSelect={setActiveModule} />
      <main className="flex-1 flex min-w-0">
        {activeModule === 'linear' && <LinearTransformModule />}
        {activeModule === 'vector' && <VectorOpsModule />}
        {activeModule === 'eigen' && <EigenvectorsModule />}
        {activeModule === 'determinant' && <DeterminantModule />}
        {activeModule === 'limit' && <LimitConvergenceModule />}
        {activeModule === 'derivative' && <DerivativeModule />}
        {activeModule === 'integral' && <RiemannSumsModule />}
        {activeModule === 'taylor' && <TaylorSeriesModule />}
        {activeModule === 'fourier' && <FourierSeriesModule />}
        {activeModule === 'unit-circle' && <UnitCircleModule />}
        {activeModule === 'pythagoras' && <PythagorasModule />}
        {activeModule === 'fibonacci' && <FibonacciSpiralModule />}
        {activeModule === 'voronoi' && <VoronoiModule />}
        {activeModule === 'galton' && <GaltonBoardModule />}
        {activeModule === 'bayes' && <BayesTheoremModule />}
        {activeModule === 'lln' && <LawOfLargeNumbersModule />}
        {activeModule === 'gradient' && <GradientDescentModule />}
        {activeModule === 'regression' && <LinearRegressionModule />}
        {activeModule === 'activation' && <ActivationModule />}
        {activeModule === 'neural-net' && <NeuralNetworkModule />}
        {activeModule === 'set-theory' && <SetTheoryModule />}
        {activeModule === 'truth-tables' && <TruthTablesModule />}
        {activeModule === 'graph-theory' && <GraphTheoryModule />}
        {activeModule === 'sort' && <SortingModule />}
        {activeModule === 'stack' && <StackModule />}
        {activeModule === 'queue' && <QueueModule />}
        {activeModule === 'list' && <LinkedListModule />}
        {activeModule === 'bst' && <BSTModule />}
        {activeModule === 'heap' && <HeapModule />}
        {activeModule === 'hash' && <HashTableModule />}
      </main>
    </div>
  )
}
