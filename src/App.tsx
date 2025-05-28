import { AppStateProvider } from './state/AppStateContext';
import { Page } from './Page/Page';
import { Route, Routes } from 'react-router-dom';
import { Auth } from './auth/Auth';
import { Private } from './auth/Private';


function App() {
  return (
    <>
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/:id" element={
        <Private>
          <AppStateProvider>
            <Page />
          </AppStateProvider>
        </Private>
      } />
      <Route path="/" element={
        <Private>
          <AppStateProvider>
            <Page />
          </AppStateProvider>
        </Private>
      } />
    </Routes>
    </>
  )
}

export default App
