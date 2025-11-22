const { 
  searchCep, 
  ValidationError, 
  ServiceError, 
  TimeoutError,
  VALID_PROVIDERS,
  isValidProvider,
  clearCache,
  clearExpiredCache,
  getCacheInfo
} = require('../dist/index');

/**
 * Exemplo básico de uso
 */
async function exemploBasico() {
  try {
    console.time('exemploBasico');
    console.log('=== Exemplo Básico ===');
    const result = await searchCep('41650191',{useCache: true,providers: ['viacep']});
    console.log('Resultado:', result);
    console.timeEnd('exemploBasico');
    return result;
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

/**
 * Exemplo com tratamento de erros específicos
 */
async function exemploComTratamentoErros() {
  try {
    console.log('\n=== Exemplo com Tratamento de Erros ===');
    const result = await searchCep('1'); // CEP inexistente
    console.log('Resultado:', result);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Erro de validação:', error.message);
      console.error('Detalhes:', error.errors);
    } else if (error instanceof ServiceError) {
      console.error('Erro nos serviços:', error.message);
      console.error('Erros individuais:', error.errors);
    } else if (error instanceof TimeoutError) {
      console.error('Timeout:', error.message);
    } else {
      console.error('Erro desconhecido:', error);
    }
  }
}

/**
 * Exemplo com opções personalizadas
 */
async function exemploComOpcoes() {
  try {
    console.log('\n=== Exemplo com Opções ===');
    const result = await searchCep('01310100', {
      timeout: 5000,
      providers: ['viacep']
    });
    console.log('Resultado:', result);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

/**
 * Exemplo de validação de providers
 */
async function exemploValidacaoProviders() {
  console.log('\n=== Exemplo Validação de Providers ===');
  
  // Lista de providers válidos
  console.log('Providers válidos:', VALID_PROVIDERS);
  
  // Verificar provider individual
  console.log('brasilapi é válido?', isValidProvider('brasilapi'));
  console.log('invalid é válido?', isValidProvider('invalid'));
  
  // Tentar usar provider inválido
  try {
    await searchCep('01310100', {
      providers: ['invalid-provider']
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('✅ Erro de validação capturado:', error.message);
      console.log('Detalhes:', error.errors);
    }
  }
  
  // Tentar usar providers duplicados
  try {
    await searchCep('01310100', {
      providers: ['brasilapi', 'brasilapi', 'viacep']
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('✅ Erro de duplicatas capturado:', error.message);
    }
  }
}

/**
 * Exemplo com CEP como número
 */
async function exemploCepComoNumero() {
  try {
    console.log('\n=== Exemplo CEP como Número ===');
    const result = await searchCep(1310100); // Sem zeros à esquerda
    console.log('Resultado:', result);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

/**
 * Exemplo com múltiplos CEPs
 * 
 * NOTA: O uso de .map() com async está correto aqui porque:
 * - searchCep() retorna uma Promise (operação assíncrona HTTP)
 * - .map() executa de forma síncrona, mas retorna um array de Promises
 * - Promise.all() aguarda todas as Promises resolverem em paralelo
 * - Isso permite executar múltiplas requisições HTTP simultaneamente
 */
async function exemploMultiplosCeps() {
  console.log('\n=== Exemplo Múltiplos CEPs ===');
  const ceps = ['01310100', '20040020', '30130100'];
  
  // .map() cria todas as Promises de forma síncrona (correto para operações assíncronas)
  const promises = ceps.map(async (cep) => {
    try {
      const result = await searchCep(cep);
      return { cep, sucesso: true, dados: result };
    } catch (error) {
      return { cep, sucesso: false, erro: error.message };
    }
  });

  const resultados = await Promise.all(promises);
  resultados.forEach(result => {
    if (result.sucesso) {
      console.log(`✅ ${result.cep}: ${result.dados.city} - ${result.dados.street}`);
    } else {
      console.log(`❌ ${result.cep}: ${result.erro}`);
    }
  });
}

/**
 * Exemplo mostrando campos extras do ViaCEP
 */
async function exemploCamposExtrasViaCep() {
  try {
    console.log('\n=== Exemplo Campos Extras ViaCEP ===');
    const result = await searchCep('41650194', {
      providers: ['viacep'] // Força uso do ViaCEP para ver campos extras
    });
    
    console.log('Campos básicos:');
    console.log(`  CEP: ${result.cep}`);
    console.log(`  Estado: ${result.state}`);
    console.log(`  Cidade: ${result.city}`);
    console.log(`  Rua: ${result.street}`);
    console.log(`  Bairro: ${result.neighborhood}`);
    
    if (result.service === 'viacep') {
      console.log('\nCampos extras do ViaCEP:');
      console.log(`  Complemento: ${result.complemento || 'N/A'}`);
      console.log(`  Unidade: ${result.unidade || 'N/A'}`);
      console.log(`  Estado completo: ${result.estado || 'N/A'}`);
      console.log(`  Região: ${result.regiao || 'N/A'}`);
      console.log(`  IBGE: ${result.ibge || 'N/A'}`);
      console.log(`  GIA: ${result.gia || 'N/A'}`);
      console.log(`  DDD: ${result.ddd || 'N/A'}`);
      console.log(`  SIAFI: ${result.siafi || 'N/A'}`);
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

/**
 * Exemplo demonstrando o cache automático
 */
async function exemploCache() {
  console.log('\n=== Exemplo Cache Automático ===');
  
  const cep = '41650195';
  
  // Primeira consulta - faz requisição HTTP
  console.log('1. Primeira consulta (faz requisição HTTP)...');
  const start1 = Date.now();
  const result1 = await searchCep(cep);
  const time1 = Date.now() - start1;
  console.log(`   Tempo: ${time1}ms`);
  console.log(`   Resultado: ${result1.city} - ${result1.street}`);
  
  // Segunda consulta - retorna do cache (muito mais rápido!)
  console.log('\n2. Segunda consulta (retorna do cache)...');
  const start2 = Date.now();
  const result2 = await searchCep(cep);
  const time2 = Date.now() - start2;
  console.log(`   Tempo: ${time2}ms (${Math.round(time1 / time2)}x mais rápido!)`);
  console.log(`   Resultado: ${result2.city} - ${result2.street}`);
  
  // Consulta sem cache
  console.log('\n3. Consulta sem cache (força requisição HTTP)...');
  const start3 = Date.now();
  const result3 = await searchCep(cep, { useCache: false });
  const time3 = Date.now() - start3;
  console.log(`   Tempo: ${time3}ms`);
  
  // Informações do cache
  console.log('\n4. Informações do cache:');
  const cacheInfo = getCacheInfo();
  console.log(`   Total de entradas: ${cacheInfo.totalEntries}`);
  console.log(`   Entradas válidas: ${cacheInfo.validEntries}`);
  console.log(`   Entradas expiradas: ${cacheInfo.expiredEntries}`);
  console.log(`   Arquivo de cache: ${cacheInfo.cacheFile}`);
  
  // Limpar cache expirado
  console.log('\n5. Limpando cache expirado...');
  const removed = clearExpiredCache();
  console.log(`   ${removed} entradas expiradas foram removidas`);
}

// Executa todos os exemplos
async function executarExemplos() {
  await exemploBasico();
  // await exemploComTratamentoErros();
  // await exemploComOpcoes();
  // await exemploCepComoNumero();
  // await exemploMultiplosCeps();
  // await exemploValidacaoProviders();
  // await exemploCamposExtrasViaCep();
  // await exemploCache();
}

// Executa se chamado diretamente
if (require.main === module) {
return  executarExemplos().catch(console.error);
}

module.exports = {
  exemploBasico,
  exemploComTratamentoErros,
  exemploComOpcoes,
  exemploCepComoNumero,
  exemploMultiplosCeps,
  exemploValidacaoProviders,
  exemploCamposExtrasViaCep,
  exemploCache
};


