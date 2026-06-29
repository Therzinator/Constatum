// Komt overeen met isAdmin()/magVerwijderen() uit docs/index.html.
// Voorheen lazen deze functies de globals _gebruikerRol/_sbUser direct;
// hier worden gebruikerRol/user als parameter meegegeven (afkomstig uit
// hooks/useAuth.js) zodat dit pure, makkelijk te testen functies blijven.
//
// Toegestane rolwaarden: 'gebruiker', 'admin', 'coordinator'
// Gesynchroniseerd met CHECK-constraint in migratie 0026 (user_roles_role_check).
// Voeg nieuwe rollen hier én in die migratie toe.

export function isAdmin(gebruikerRol) {
  return gebruikerRol === 'admin';
}

export function isCoordinatorOfAdmin(gebruikerRol) {
  return gebruikerRol === 'admin' || gebruikerRol === 'coordinator';
}

export function magVerwijderen(gebruikerRol, user, melderEmail, userId) {
  if (isAdmin(gebruikerRol)) return true;
  if (!user) return false;
  // Eigen melding: check op email of user_id
  if (melderEmail && melderEmail === user.email) return true;
  if (userId && userId === user.id) return true;
  // Nog niet gesynchroniseerde melding (geen melder_email/user_id): altijd eigen
  if (!melderEmail && !userId) return true;
  return false;
}
