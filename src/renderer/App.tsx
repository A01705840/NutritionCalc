import { useReducer } from 'react'
import TablaPlanAlimenticio from './components/MealPlan/MealPlan'
import EditorMenu from './components/MealPlan/EditorMenu'
import { planInicial, reducer } from './components/MealPlan/plan'
import BarraSesion from './components/MealPlan/Sesion'

function App(): React.JSX.Element {
  // El plan vive aquí para que la tabla y el editor de menú compartan los mismos datos
  const [plan, dispatch] = useReducer(reducer, planInicial)

  return (
    <main style={{ padding: 24 }}>
      <BarraSesion plan={plan} dispatch={dispatch} />
      <TablaPlanAlimenticio plan={plan} dispatch={dispatch} />
      <EditorMenu plan={plan} dispatch={dispatch} />
    </main>
  )
}

export default App
