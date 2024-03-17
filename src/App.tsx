import './App.css';
import { AppStateProvider } from './state/AppStateContext';
import { Page } from './Page/Page';
import { createPage } from './utils/createPage';

const initialState = createPage()

function App() {
  return (
    <>
    <AppStateProvider initialState={initialState}>
      <Page />
    </AppStateProvider>
    </>
  )
}

export default App
