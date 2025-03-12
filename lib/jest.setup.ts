// Este archivo se ejecuta antes de cada prueba
// Declaraciones globales para Jest
import '@jest/globals';

// Extender el objeto global de Jest para mejorar compatibilidad con TypeScript
declare global {
  namespace jest {
    interface MockInstance<T extends (...args: any[]) => any> {
      mockResolvedValueOnce: (value: any) => MockInstance<T>;
      mockRejectedValueOnce: (value: any) => MockInstance<T>;
    }
  }
}
