/**
 * Logger síncrono que força flush imediato para acompanhamento em tempo real
 */
function syncLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} ${message}\n`;
  
  // Usa writeSync para garantir que seja síncrono e imediato
  try {
    process.stdout.write(logMessage);
  } catch (error) {
    // Fallback para console.log se stdout.write falhar
    console.log(message);
  }
}

/**
 * Cria uma função getElapsed que retorna tempo decorrido formatado
 */
function createTimer() {
  const startTime = Date.now();
  return () => {
    const elapsed = Date.now() - startTime;
    return `[${elapsed}ms]`;
  };
}

module.exports = {
  syncLog,
  createTimer
};

