const {
  VALID_PROVIDERS,
  isValidProvider,
  validateProviders,
  normalizeProviders
} = require('./providerValidator');
const { ValidationError } = require('../errors/CepError');

describe('providerValidator', () => {
  describe('VALID_PROVIDERS', () => {
    test('deve conter os 2 providers válidos', () => {
      expect(VALID_PROVIDERS).toHaveLength(2);
      expect(VALID_PROVIDERS).toContain('brasilapi');
      expect(VALID_PROVIDERS).toContain('viacep');
    });
  });

  describe('isValidProvider', () => {
    test('deve retornar true para providers válidos', () => {
      expect(isValidProvider('brasilapi')).toBe(true);
      expect(isValidProvider('viacep')).toBe(true);
    });

    test('deve retornar false para providers inválidos', () => {
      expect(isValidProvider('invalid')).toBe(false);
      expect(isValidProvider('')).toBe(false);
      expect(isValidProvider('widenet')).toBe(false); // Temporariamente desabilitado
      expect(isValidProvider('correios')).toBe(false); // Temporariamente desabilitado
      expect(isValidProvider('BRASILAPI')).toBe(false); // case sensitive
    });
  });

  describe('validateProviders', () => {
    test('deve aceitar array vazio', () => {
      expect(() => validateProviders([])).not.toThrow();
    });

    test('deve aceitar array com providers válidos', () => {
      expect(() => validateProviders(['brasilapi', 'viacep'])).not.toThrow();
      expect(() => validateProviders(['brasilapi'])).not.toThrow();
      expect(() => validateProviders(['viacep'])).not.toThrow();
      expect(() => validateProviders(VALID_PROVIDERS)).not.toThrow();
    });

    test('deve rejeitar providers inválidos', () => {
      expect(() => validateProviders(['invalid'])).toThrow(ValidationError);
      expect(() => validateProviders(['brasilapi', 'invalid'])).toThrow(ValidationError);
    });

    test('deve rejeitar providers duplicados', () => {
      expect(() => validateProviders(['brasilapi', 'brasilapi'])).toThrow(ValidationError);
      expect(() => validateProviders(['viacep', 'viacep'])).toThrow(ValidationError);
    });

    test('deve rejeitar se não for array', () => {
      expect(() => validateProviders('brasilapi')).toThrow(ValidationError);
      expect(() => validateProviders({})).toThrow(ValidationError);
      expect(() => validateProviders(null)).toThrow(ValidationError);
      expect(() => validateProviders(undefined)).toThrow(ValidationError);
    });
  });

  describe('normalizeProviders', () => {
    test('deve retornar array vazio se entrada for inválida', () => {
      expect(normalizeProviders([])).toEqual([]);
      expect(normalizeProviders(null)).toEqual([]);
      expect(normalizeProviders(undefined)).toEqual([]);
    });

    test('deve converter para lowercase', () => {
      expect(normalizeProviders(['BRASILAPI', 'ViaCep'])).toEqual(['brasilapi', 'viacep']);
    });

    test('deve remover duplicatas', () => {
      expect(normalizeProviders(['brasilapi', 'brasilapi', 'viacep'])).toEqual(['brasilapi', 'viacep']);
    });

    test('deve converter números para string', () => {
      expect(normalizeProviders(['brasilapi', 123])).toEqual(['brasilapi', '123']);
    });
  });
});

