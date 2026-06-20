import { useAuth } from './hooks/useAuth.js'
import { useMeldingen } from './hooks/useMeldingen.js'
import { useSupabaseSync } from './hooks/useSupabaseSync.js'
import { useThuislocatie } from './hooks/useThuislocatie.js'
import { AuthOverlay } from './components/auth/AuthOverlay.jsx'
import { MeldingenLijst } from './components/meldingen/MeldingenLijst.jsx'
import { SyncStatusBar } from './components/sync/SyncStatusBar.jsx'
import { MeldingForm } from './components/melding/MeldingForm.jsx'
import './App.css'

function App() {
  const auth = useAuth()
  const meldingenApi = useMeldingen()
  const sync = useSupabaseSync(auth.user, meldingenApi)
  const thuislocatieApi = useThuislocatie(auth.user)

  return (
    <>
      <AuthOverlay auth={auth} />
      <SyncStatusBar syncBezig={sync.syncBezig} syncStatus={sync.syncStatus} />

      <section id="nieuwe-melding">
        <MeldingForm
          user={auth.user}
          thuislocatie={thuislocatieApi.thuislocatie}
          meldingenApi={meldingenApi}
          syncNu={sync.syncNu}
        />
      </section>

      <section id="meldingen">
        <MeldingenLijst
          meldingenApi={meldingenApi}
          user={auth.user}
          gebruikerRol={auth.gebruikerRol}
        />
      </section>
    </>
  )
}

export default App
