const { searchCep, ValidationError, ServiceError } = require('./index');

// Mock dos serviços para testes
jest.mock('./services', () => {
  const mockService = {
    name: 'test',
    search: jest.fn()
  };

  return {
    getServicesByNames: jest.fn(() => [mockService])
  };
});

describe('searchCep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve validar CEP inválido', async () => {
    await expect(searchCep('123456789')).rejects.toThrow(ValidationError);
  });

  test('deve validar CEP vazio', async () => {
    await expect(searchCep('')).rejects.toThrow(ValidationError);
  });

  // test('deve aceitar CEP como número', async () => {
  //   const { getServicesByNames } = require('./services');
  //   const mockService = {
  //     name: 'test',
  //     search: jest.fn().mockResolvedValue({
  //       cep: '01310100',
  //       state: 'SP',
  //       city: 'São Paulo',
  //       street: 'Avenida Paulista',
  //       neighborhood: 'Bela Vista',
  //       service: 'test'
  //     })
  //   };
  //   getServicesByNames.mockReturnValue([mockService]);

  //   const result = await searchCep(1310100);
  //   expect(result.cep).toBe('01310100');
  // });

  // test('deve remover caracteres especiais', async () => {
  //   const { getServicesByNames } = require('./services');
  //   const mockService = {
  //     name: 'test',
  //     search: jest.fn().mockResolvedValue({
  //       cep: '01310100',
  //       state: 'SP',
  //       city: 'São Paulo',
  //       street: 'Avenida Paulista',
  //       neighborhood: 'Bela Vista',
  //       service: 'test'
  //     })
  //   };
  //   getServicesByNames.mockReturnValue([mockService]);

  //   const result = await searchCep('01310-100');    
  //   expect(result.cep).toBe('01310100');
  // });
});


