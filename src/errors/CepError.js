/**
 * Classe base para erros relacionados a CEP
 */
class CepError extends Error {
  constructor(message, type, errors = []) {
    super(message);
    this.name = 'CepError';
    this.type = type;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erro de validação - quando o CEP tem formato inválido
 */
class ValidationError extends CepError {
  constructor(message, errors = []) {
    super(message, 'validation_error', errors);
    this.name = 'ValidationError';
  }
}

/**
 * Erro de serviço - quando todos os serviços falharam
 */
class ServiceError extends CepError {
  constructor(message, errors = []) {
    super(message, 'service_error', errors);
    this.name = 'ServiceError';
  }
}

/**
 * Erro de timeout - quando todas as requisições excederam o tempo limite
 */
class TimeoutError extends CepError {
  constructor(message, errors = []) {
    super(message, 'timeout_error', errors);
    this.name = 'TimeoutError';
  }
}

module.exports = {
  CepError,
  ValidationError,
  ServiceError,
  TimeoutError
};


