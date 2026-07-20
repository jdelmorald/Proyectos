export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'operador';
}

export interface AsientoLinea {
  cuentaId: number;
  descripcion?: string;
  debe: number;
  haber: number;
}
