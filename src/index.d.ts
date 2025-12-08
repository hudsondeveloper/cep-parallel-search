/**
 * Resultado da busca de CEP
 * Campos básicos são sempre retornados, campos extras dependem do serviço
 */
export interface CepResult {
  /** CEP formatado (8 dígitos) */
  cep: string;
  /** Estado (UF) */
  state: string;
  /** Cidade */
  city: string;
  /** Logradouro/Rua */
  street: string;
  /** Bairro */
  neighborhood: string;
  /** Nome do serviço que retornou o resultado */
  service: string;
  
  /** Campos extras do ViaCEP (disponíveis apenas quando service === 'viacep') */
  /** Complemento do endereço */
  complemento?: string;
  /** Unidade do endereço */
  unidade?: string;
  /** Nome completo do estado */
  estado?: string;
  /** Região do Brasil */
  regiao?: string;
  /** Código IBGE do município */
  ibge?: string;
  /** Código GIA */
  gia?: string;
  /** Código DDD */
  ddd?: string;
  /** Código SIAFI */
  siafi?: string;
}

/**
 * Providers disponíveis para busca de CEP
 * Nota: widenet e correios serão adicionados em atualizações futuras
 */
export type CepProvider = 'brasilapi' | 'viacep';

/**
 * Lista de providers válidos
 */
export const VALID_PROVIDERS: readonly CepProvider[];

/**
 * Opções de configuração para busca de CEP
 */
export interface SearchCepOptions {
  /** Timeout em milissegundos para cada requisição (padrão: 30000) */
  timeout?: number;
  /** Lista de provedores a usar. Se vazio ou não fornecido, usa todos disponíveis */
  providers?: CepProvider[];
  /** Se deve usar cache (padrão: true). Cache tem duração de 30 dias */
  useCache?: boolean;
}

/**
 * Erro base para erros relacionados a CEP
 */
export class CepError extends Error {
  name: string;
  type: string;
  errors: Array<{
    message: string;
    service: string;
    [key: string]: any;
  }>;
}

/**
 * Erro de validação - quando o CEP tem formato inválido
 */
export class ValidationError extends CepError {
  name: 'ValidationError';
  type: 'validation_error';
}

/**
 * Erro de serviço - quando todos os serviços falharam
 */
export class ServiceError extends CepError {
  name: 'ServiceError';
  type: 'service_error';
}

/**
 * Erro de timeout - quando todas as requisições excederam o tempo limite
 */
export class TimeoutError extends CepError {
  name: 'TimeoutError';
  type: 'timeout_error';
}

/**
 * Busca informações de CEP usando múltiplos serviços em paralelo
 *
 * @param cep - CEP a ser consultado (pode ser string ou número)
 * @param options - Opções de configuração
 * @returns Promise que resolve com os dados do CEP
 *
 * @example
 * ```typescript
 * // Busca básica
 * const result = await searchCep('01310100');
 *
 * // Com opções
 * const result = await searchCep('01310100', {
 *   timeout: 5000,
 *   providers: ['brasilapi', 'viacep']
 * });
 * ```
 */
export function searchCep(
  cep: string | number,
  options?: SearchCepOptions
): Promise<CepResult>;

/**
 * Valida se um provider é válido
 */
export function isValidProvider(provider: string): provider is CepProvider;

/**
 * Valida se um CEP tem formato válido
 * Retorna true se o CEP tem formato válido (8 dígitos), false caso contrário
 * Não lança erros, apenas retorna boolean
 * 
 * @param cep - CEP a ser validado (pode ser string ou número)
 * @returns true se o CEP tem formato válido, false caso contrário
 * 
 * @example
 * ```typescript
 * isValidCep('92500000'); // true
 * isValidCep('92500-000'); // true
 * isValidCep('8434850001'); // false
 * isValidCep('12345'); // false
 * ```
 */
export function isValidCep(cep: string | number): boolean;

/**
 * Limpa todo o cache
 */
export function clearCache(): boolean;

/**
 * Limpa apenas entradas expiradas do cache
 * @returns Número de entradas removidas
 */
export function clearExpiredCache(): number;

/**
 * Retorna informações sobre o cache
 */
export interface CacheInfo {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  cacheFile: string;
  cacheDir: string;
  estimatedSize: number;
}

export function getCacheInfo(): CacheInfo;

/**
 * Exportação padrão
 */
declare const _default: typeof searchCep;
export default _default;


