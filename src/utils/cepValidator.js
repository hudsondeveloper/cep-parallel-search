const { ValidationError } = require('../errors/CepError');

const CEP_SIZE = 8;

/**
 * Valida o tipo de entrada (deve ser string ou number)
 */
function validateInputType(cepRawValue) {
  const cepTypeOf = typeof cepRawValue;

  if (cepTypeOf === 'number' || cepTypeOf === 'string') {
    return cepRawValue;
  }

  throw new ValidationError(
    'CEP deve ser uma string ou número.',
    [{
      message: 'Tipo de entrada inválido. Use string ou number.',
      service: 'cep_validation',
      input: cepRawValue
    }]
  );
}

/**
 * Remove caracteres especiais do CEP
 */
function removeSpecialCharacters(cepRawValue) {
  return cepRawValue.toString().replace(/\D+/g, '');
}

/**
 * Preenche zeros à esquerda se necessário
 */
function leftPadWithZeros(cepCleanValue) {
  if (cepCleanValue.length === 0) {
    throw new ValidationError(
      'CEP não pode estar vazio.',
      [{
        message: 'CEP informado está vazio após remoção de caracteres especiais.',
        service: 'cep_validation'
      }]
    );
  }

  if (cepCleanValue.length > CEP_SIZE) {
    throw new ValidationError(
      `CEP deve conter exatamente ${CEP_SIZE} caracteres.`,
      [{
        message: `CEP informado possui ${cepCleanValue.length} caracteres (máximo: ${CEP_SIZE}).`,
        service: 'cep_validation',
        length: cepCleanValue.length
      }]
    );
  }

  if (cepCleanValue.length === CEP_SIZE) {
    return cepCleanValue;
  }

  return '0'.repeat(CEP_SIZE - cepCleanValue.length) + cepCleanValue;
}

/**
 * Valida o comprimento do CEP
 */
function validateInputLength(cepWithLeftPad) {
  if (cepWithLeftPad.length === CEP_SIZE) {
    return cepWithLeftPad;
  }

  if (cepWithLeftPad.length > CEP_SIZE) {
    throw new ValidationError(
      `CEP deve conter exatamente ${CEP_SIZE} caracteres.`,
      [{
        message: `CEP informado possui ${cepWithLeftPad.length} caracteres (máximo: ${CEP_SIZE}).`,
        service: 'cep_validation',
        length: cepWithLeftPad.length
      }]
    );
  }

  throw new ValidationError(
    `CEP deve conter exatamente ${CEP_SIZE} caracteres.`,
    [{
      message: `CEP informado possui ${cepWithLeftPad.length} caracteres (mínimo: ${CEP_SIZE}).`,
      service: 'cep_validation',
      length: cepWithLeftPad.length
    }]
  );
}

/**
 * Normaliza e valida o CEP completo
 */
function normalizeAndValidateCep(cepRawValue) {
  return Promise.resolve(cepRawValue)
    .then(validateInputType)
    .then(removeSpecialCharacters)
    .then(leftPadWithZeros)
    .then(validateInputLength);
}

/**
 * Valida se um CEP é válido (formato)
 * Retorna true se o CEP tem formato válido, false caso contrário
 * Não lança erros, apenas retorna boolean
 * 
 * @param {string|number} cep - CEP a ser validado
 * @returns {boolean} true se o CEP tem formato válido, false caso contrário
 * 
 * @example
 * isValidCep('92500000'); // true
 * isValidCep('92500-000'); // true
 * isValidCep('8434850001'); // false (mais de 8 dígitos)
 * isValidCep('12345'); // false (menos de 8 dígitos)
 * isValidCep('abc12345'); // false (contém letras)
 */
function isValidCep(cep) {
  // Verifica se o CEP é null, undefined ou vazio
  if (cep === null || cep === undefined || cep === '') {
    return false;
  }

  // Verifica se é string ou number
  const cepTypeOf = typeof cep;
  if (cepTypeOf !== 'string' && cepTypeOf !== 'number') {
    return false;
  }

  try {
    // Remove caracteres especiais (mantém apenas números)
    const cepClean = removeSpecialCharacters(cep);
    
    // Verifica se tem exatamente 8 dígitos
    if (cepClean.length === CEP_SIZE) {
      return true;
    }
    
    return false;
  } catch (error) {
    // Se houver qualquer erro durante a validação, retorna false
    return false;
  }
}

module.exports = {
  CEP_SIZE,
  validateInputType,
  removeSpecialCharacters,
  leftPadWithZeros,
  validateInputLength,
  normalizeAndValidateCep,
  isValidCep
};


