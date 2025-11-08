export interface JwtPayload {
  id: string;     // c’est l’id du parent ou de l’enfant
  role: string;   // 'parent' ou 'child'
}
