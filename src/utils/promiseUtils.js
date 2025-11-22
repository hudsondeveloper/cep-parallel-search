/**
 * Polyfill para Promise.any com suporte a cancelamento
 * Retorna a primeira promise que resolver com sucesso
 * Rejeita apenas se todas as promises rejeitarem
 * Cancela automaticamente as outras promises quando uma resolve
 */
function promiseAny(promises, cancelCallbacks = []) {
  // Se Promise.any está disponível, use nativo
  if (Promise.any) {
    return Promise.any(promises).then(result => {
      // Cancela todas as outras promises quando uma resolve
      cancelCallbacks.forEach(cancel => {
        try {
          cancel();
        } catch (e) {
          // Ignora erros ao cancelar
        }
      });
      return result;
    });
  }

  // Polyfill para ambientes que não suportam Promise.any
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises) || promises.length === 0) {
      reject(new AggregateError([], 'Nenhuma promise fornecida'));
      return;
    }

    const errors = [];
    let rejectedCount = 0;
    let resolved = false;

    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(result => {
          if (!resolved) {
            resolved = true;
            // Cancela todas as outras promises
            cancelCallbacks.forEach((cancel, i) => {
              if (i !== index) {
                try {
                  cancel();
                } catch (e) {
                  // Ignora erros ao cancelar
                }
              }
            });
            resolve(result);
          }
        })
        .catch((error) => {
          // Ignora erros de cancelamento (AbortError)
          // Esses erros acontecem quando outra promise resolve primeiro
          const isAbortError = error.name === 'AbortError' || 
                              error.type === 'aborted' ||
                              (error instanceof Error && error.message && error.message.includes('cancelada'));
          
          if (!isAbortError) {
            errors[index] = error;
            rejectedCount++;
          } else {
            // Se foi cancelamento, conta como se tivesse sido ignorado
            // Mas não conta como erro real
            rejectedCount++;
          }

          if (rejectedCount === promises.length && !resolved) {
            // Filtra erros de cancelamento antes de criar AggregateError
            const realErrors = errors.filter(e => e !== undefined);
            // Cria um AggregateError se disponível, senão usa Error
            const aggregateError = realErrors.length > 0
              ? (new AggregateError
                  ? new AggregateError(realErrors, 'Todas as promises foram rejeitadas')
                  : Object.assign(new Error('Todas as promises foram rejeitadas'), { errors: realErrors }))
              : new Error('Todas as promises foram canceladas ou rejeitadas');
            reject(aggregateError);
          }
        });
    });
  });
}

/**
 * Cria uma promise com timeout que pode ser cancelada
 * Retorna um objeto com a promise e uma função de cancelamento
 */
function withTimeout(promise, timeoutMs, timeoutMessage = 'Operação excedeu o tempo limite') {
  let timeoutId = null;
  let isCancelled = false;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      if (!isCancelled) {
        reject(new Error(timeoutMessage));
      }
    }, timeoutMs);
  });

  const racePromise = Promise.race([promise, timeoutPromise])
    .finally(() => {
      // Limpa o timeout quando a promise resolve ou rejeita
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    });

  return {
    promise: racePromise,
    cancel: () => {
      isCancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  };
}

/**
 * Executa múltiplas promises em paralelo com timeout individual
 * Cancela automaticamente os timeouts e requisições pendentes quando uma resolve
 * 
 * NOTA: .map() aqui é usado corretamente porque:
 * - Recebe um array de Promises já criadas (não cria novas operações síncronas)
 * - Apenas aplica timeout a cada Promise existente
 * - Retorna um novo array de Promises com timeout aplicado
 * 
 * @param {Promise[]} promises - Array de promises para executar
 * @param {number} timeoutMs - Timeout em milissegundos
 * @param {Function[]} [additionalCancelCallbacks=[]] - Callbacks adicionais de cancelamento (ex: para abortar requisições HTTP)
 */
function parallelWithTimeout(promises, timeoutMs, additionalCancelCallbacks = []) {
  // Mapeia promises existentes e cria timeouts canceláveis
  const timeoutWrappers = promises.map((promise, index) => {
    return withTimeout(
      promise,
      timeoutMs,
      `Requisição ${index + 1} excedeu o timeout de ${timeoutMs}ms`
    );
  });

  // Extrai as promises e callbacks de cancelamento
  const promisesWithTimeout = timeoutWrappers.map((wrapper, index) => 
    wrapper.promise.catch(error => {
      // Adiciona informação sobre qual requisição falhou
      error.requestIndex = index;
      throw error;
    })
  );
  
  // Combina callbacks de cancelamento de timeouts com callbacks adicionais
  const cancelCallbacks = [
    ...timeoutWrappers.map(wrapper => wrapper.cancel),
    ...additionalCancelCallbacks
  ];

  return promiseAny(promisesWithTimeout, cancelCallbacks);
}

module.exports = {
  promiseAny,
  withTimeout,
  parallelWithTimeout
};


