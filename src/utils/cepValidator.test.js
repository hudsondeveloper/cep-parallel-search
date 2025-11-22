const {
  validateInputType,
  removeSpecialCharacters,
  leftPadWithZeros,
  validateInputLength,
  normalizeAndValidateCep
} = require('./cepValidator');
const { ValidationError } = require('../errors/CepError');

describe('cepValidator', () => {
  describe('validateInputType', () => {
    test('deve aceitar string', () => {
      expect(validateInputType('01310100')).toBe('01310100');
    });

    test('deve aceitar number', () => {
      expect(validateInputType(1310100)).toBe(1310100);
    });

    test('deve rejeitar outros tipos', () => {
      expect(() => validateInputType(null)).toThrow(ValidationError);
      expect(() => validateInputType({})).toThrow(ValidationError);
      expect(() => validateInputType([])).toThrow(ValidationError);
    });
  });

  describe('removeSpecialCharacters', () => {
    test('deve remover hífen', () => {
      expect(removeSpecialCharacters('01310-100')).toBe('01310100');
    });

    test('deve remover espaços', () => {
      expect(removeSpecialCharacters('01310 100')).toBe('01310100');
    });

    test('deve remover pontos', () => {
      expect(removeSpecialCharacters('013.101.00')).toBe('01310100');
    });
  });

  describe('leftPadWithZeros', () => {
    test('deve preencher zeros à esquerda', () => {
      expect(leftPadWithZeros('1310100')).toBe('01310100');
      expect(leftPadWithZeros('131010')).toBe('00131010');
    });

    test('não deve alterar CEP completo', () => {
      expect(leftPadWithZeros('01310100')).toBe('01310100');
    });
  });

  describe('validateInputLength', () => {
    test('deve aceitar CEP com 8 caracteres', () => {
      expect(validateInputLength('01310100')).toBe('01310100');
    });

    test('deve rejeitar CEP muito longo', () => {
      expect(() => validateInputLength('013101001')).toThrow(ValidationError);
    });

    test('deve rejeitar CEP muito curto', () => {
      expect(() => validateInputLength('1310100')).toThrow(ValidationError);
    });
  });

  describe('normalizeAndValidateCep', () => {
    test('deve normalizar CEP completo', async () => {
      const result = await normalizeAndValidateCep('01310-100');
      expect(result).toBe('01310100');
    });

    test('deve normalizar CEP numérico', async () => {
      const result = await normalizeAndValidateCep(1310100);
      expect(result).toBe('01310100');
    });

    test('deve rejeitar CEP inválido', async () => {
      await expect(normalizeAndValidateCep('123456789')).rejects.toThrow(ValidationError);
    });
  });
});


