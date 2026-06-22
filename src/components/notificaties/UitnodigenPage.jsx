import { DeeltokenGenerator } from './DeeltokenGenerator.jsx';

// Eigen pagina (sinds de navigatieknop in AppHeader.jsx) i.p.v. een kaart
// op het Dashboard — "Buren uitnodigen" verdiende een eigen ingang naast
// Instellingen, niet verstopt tussen de dashboard-statistieken.
export function UitnodigenPage({ user, thuislocatie }) {
  return (
    <div className="p-4">
      <DeeltokenGenerator user={user} thuislocatie={thuislocatie} />
    </div>
  );
}
