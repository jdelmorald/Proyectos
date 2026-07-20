export interface ItemLinea {
  codigo?: string;
  descripcion: string;
  cantidad: number;
  unidad?: string;
  precioUnitario?: number;
  exento?: boolean;
  subtotal?: number;
}

export interface Firmante {
  nombre: string;
  cargo?: string;
  cedula?: string;
}

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'operador';
}
