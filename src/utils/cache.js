const fs = require('fs');
const path = require('path');
const os = require('os');

const CACHE_DIR = path.join(os.homedir(), '.cep-parallel-search');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');
const CACHE_DURATION_MS = 15 * 24 * 60 * 60 * 1000; // 15 dias em milissegundos

/**
 * Garante que o diretório de cache existe
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Carrega o cache do arquivo (sem limpeza automática para performance)
 */
// Cache em memória para evitar múltiplas leituras do arquivo
let memoryCache = null;
let cacheLastModified = 0;

function loadCache() {
  try {
    // Verifica se o arquivo existe antes de tentar ler
    if (!fs.existsSync(CACHE_FILE)) {
      memoryCache = {};
      return memoryCache;
    }

    // Verifica se precisa recarregar do arquivo
    const stats = fs.statSync(CACHE_FILE);
    if (memoryCache && stats.mtimeMs === cacheLastModified) {
      return memoryCache;
    }

    ensureCacheDir();
    const cacheData = fs.readFileSync(CACHE_FILE, 'utf8');
    const result = JSON.parse(cacheData);
    memoryCache = result;
    cacheLastModified = stats.mtimeMs;
    return result;
  } catch (error) {
    // Se houver erro ao ler o cache, retorna cache vazio
    memoryCache = {};
    return memoryCache;
  }
}

/**
 * Salva o cache no arquivo (sem limpeza para evitar bloqueio)
 */
function saveCache(cache) {
  try {
    ensureCacheDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
    // Atualiza cache em memória
    memoryCache = cache;
    const stats = fs.statSync(CACHE_FILE);
    cacheLastModified = stats.mtimeMs;
    return true;
  } catch (error) {
    // Se houver erro ao salvar, retorna false (não quebra a aplicação)
    return false;
  }
}

/**
 * Remove entradas expiradas do cache (versão otimizada, sem salvar automaticamente)
 */
function cleanExpiredEntries(cache, saveAfterClean = false) {
  const now = Date.now();
  const cleaned = {};

  for (const [key, value] of Object.entries(cache)) {
    if (value && value.timestamp && (now - value.timestamp) < CACHE_DURATION_MS) {
      cleaned[key] = value;
    }
  }

  // Só salva se explicitamente solicitado e se houve limpeza
  if (saveAfterClean && Object.keys(cleaned).length !== Object.keys(cache).length) {
    // Salva de forma assíncrona para não bloquear
    setImmediate(() => {
      try {
        saveCache(cleaned);
      } catch (error) {
        // Ignora erros de salvamento em background
      }
    });
  }

  return cleaned;
}

/**
 * Gera chave de cache baseada no CEP
 */
function getCacheKey(cep) {
  // Normaliza o CEP para garantir consistência
  const normalizedCep = String(cep).replace(/\D/g, '').padStart(8, '0');
  const key = `cep_${normalizedCep}`;
  return key;
}

/**
 * Verifica se existe cache válido para um CEP (otimizado, sem bloqueio)
 */
function getCachedResult(cep) {
  try {
    const cache = loadCache();
    const key = getCacheKey(cep);
    const cached = cache[key];

    if (!cached) {
      return null;
    }

    const now = Date.now();
    const age = now - cached.timestamp;

    // Verifica se o cache ainda é válido (menos de 30 dias)
    if (age >= CACHE_DURATION_MS) {
      // Remove entrada expirada de forma assíncrona (não bloqueia)
      setImmediate(() => {
        try {
          const currentCache = loadCache();
          if (currentCache[key] && (Date.now() - currentCache[key].timestamp) >= CACHE_DURATION_MS) {
            delete currentCache[key];
            saveCache(currentCache);
          }
        } catch (error) {
          // Ignora erros em background
        }
      });
      return null;
    }

    return cached.data;
  } catch (error) {
    // Se houver erro ao ler cache, retorna null (não bloqueia)
    return null;
  }
}

/**
 * Salva resultado no cache (otimizado, salva apenas a entrada específica quando possível)
 */
function setCachedResult(cep, data) {
  // Salva tudo de forma assíncrona para não bloquear
  setImmediate(() => {
    try {
      const cache = loadCache();
      const key = getCacheKey(cep);
      
      cache[key] = {
        timestamp: Date.now(),
        data: data
      };

      saveCache(cache);
    } catch (error) {
      // Ignora erros em background
    }
  });
  
  return true;
}

/**
 * Limpa todo o cache
 */
function clearCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Limpa apenas entradas expiradas (versão otimizada, assíncrona)
 */
function clearExpiredCache() {
  try {
    const cache = loadCache();
    const cleaned = cleanExpiredEntries(cache, false);
    const removedCount = Object.keys(cache).length - Object.keys(cleaned).length;
    
    // Salva de forma assíncrona para não bloquear
    if (removedCount > 0) {
      setImmediate(() => {
        try {
          saveCache(cleaned);
        } catch (error) {
          // Ignora erros em background
        }
      });
    }
    
    return removedCount;
  } catch (error) {
    return 0;
  }
}

/**
 * Retorna informações sobre o cache
 */
function getCacheInfo() {
  const cache = loadCache();
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  let totalSize = 0;

  for (const [key, value] of Object.entries(cache)) {
    if (value && value.timestamp) {
      const age = now - value.timestamp;
      if (age < CACHE_DURATION_MS) {
        validEntries++;
      } else {
        expiredEntries++;
      }
      totalSize += JSON.stringify(value).length;
    }
  }

  return {
    totalEntries: Object.keys(cache).length,
    validEntries,
    expiredEntries,
    cacheFile: CACHE_FILE,
    cacheDir: CACHE_DIR,
    estimatedSize: totalSize
  };
}

module.exports = {
  getCachedResult,
  setCachedResult,
  clearCache,
  clearExpiredCache,
  getCacheInfo,
  CACHE_DURATION_MS,
  CACHE_FILE
};

