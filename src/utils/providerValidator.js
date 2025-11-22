const { ValidationError } = require('../errors/CepError');

/**
 * Lista de providers válidos
 */

const VALID_PROVIDERS = ['brasilapi', 'viacep'];

/**
 * Valida se um provider é válido
 */
function isValidProvider(provider) {
  return VALID_PROVIDERS.includes(provider);
}

/**
 * Valida a lista de providers
 */
function validateProviders(providers) {
  if (!Array.isArray(providers)) {
    throw new ValidationError(
      'Providers deve ser um array',
      [{
        message: 'O parâmetro providers deve ser uma lista (array)',
        service: 'provider_validation',
        received: typeof providers
      }]
    );
  }

  // Se o array estiver vazio, é válido (usa todos os providers)
  if (providers.length === 0) {
    return true;
  }

  // Valida cada provider
  const invalidProviders = providers.filter(provider => !isValidProvider(provider));

  if (invalidProviders.length > 0) {
    throw new ValidationError(
      `Providers inválidos: ${invalidProviders.join(', ')}`,
      [{
        message: `Os seguintes providers são inválidos: ${invalidProviders.join(', ')}`,
        service: 'provider_validation',
        invalidProviders: invalidProviders,
        validProviders: VALID_PROVIDERS
      }]
    );
  }

  // Remove duplicatas
  const uniqueProviders = [...new Set(providers)];
  if (uniqueProviders.length !== providers.length) {
    throw new ValidationError(
      'Providers duplicados encontrados',
      [{
        message: 'A lista de providers contém valores duplicados',
        service: 'provider_validation',
        providers: providers
      }]
    );
  }

  return true;
}

/**
 * Normaliza a lista de providers (remove duplicatas e converte para lowercase)
 */
function normalizeProviders(providers) {
  if (!Array.isArray(providers) || providers.length === 0) {
    return [];
  }

  // Remove duplicatas e converte para lowercase
  return [...new Set(providers.map(p => String(p).toLowerCase()))];
}

module.exports = {
  VALID_PROVIDERS,
  isValidProvider,
  validateProviders,
  normalizeProviders
};

