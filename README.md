# javascript_serverless_api

API REST serverless em Node.js criada como laboratório prático para fixar os conceitos do curso **AWS Cloud Practitioner Essentials** (AWS Training & Certification).

A proposta aqui foi tirar do papel o cenário usado ao longo do curso — um programa de fidelidade de cafeteria — e implementar o fluxo de ponta a ponta rodando **100% localmente**, simulando API Gateway, AWS Lambda e Amazon DynamoDB sem depender de conta ativa ou cartão cadastrado na AWS.

## O que está sendo praticado

Mais do que montar um CRUD, cada parte do repositório mapeia um conceito teórico visto nas anotações do curso:

- **Computação Serverless (AWS Lambda + API Gateway):** funções isoladas orientadas a eventos HTTP, emuladas localmente com Serverless Framework e `serverless-offline`.
- **Banco NoSQL Chave-Valor/Documento (Amazon DynamoDB):** modelagem sem esquema rígido com chave de partição `id` (UUID v4) na tabela `ClientsFidelity`.
- **Leitura pontual vs. varredura completa (`GetCommand` vs. `ScanCommand`):** comparação prática entre buscar um registro direto pela chave de partição (leitura direcionada) e varrer a tabela inteira com `Scan`, além de validar o formato do UUID antes de consumir leitura no banco.
- **Infraestrutura como Código (IaC):** declaração das funções, rotas HTTP, tabela DynamoDB e permissões de IAM (princípio do menor privilégio: `PutItem`, `Scan`, `GetItem`) no `serverless.yml`.
- **Interação programática com a AWS:** uso combinado do **AWS CLI** (criação e inspeção da tabela local) e do **AWS SDK for JavaScript v3** (comunicação da aplicação com o banco).

## Stack e ferramentas

- Node.js `v20.x`
- Serverless Framework + `serverless-offline`
- AWS SDK for JavaScript v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`)
- Amazon DynamoDB Local (executado via Java JRE)
- AWS CLI v2

## Estrutura do projeto

```text
javascript_serverless_api/
├── serverless.yml                  # Definição IaC (rotas, Lambdas, IAM e tabela DynamoDB)
├── package.json
└── src/
    ├── database/
    │   └── dynamoClient.js         # Cliente DynamoDB configurado para alternar local/nuvem via IS_OFFLINE
    ├── handlers/
    │   ├── hello.js                # GET /hello (health check inicial)
    │   ├── createCustomer.js       # POST /clients
    │   ├── listCustomers.js        # GET /clients
    │   └── getCustomer.js          # GET /clients/{id}
    ├── services/
    │   └── customerService.js      # Regras de negócio, validação de UUID e comandos do SDK v3
    └── utils/
        └── httpResponse.js         # Padronização de respostas HTTP e headers CORS

```

## Nota sobre o ambiente local

Inicialmente o projeto usava o plugin `serverless-dynamodb-local`, mas ele ainda depende internamente do AWS SDK v2 e gera conflito de validação de credenciais (`UnrecognizedClientException`) com versões recentes do DynamoDB Local.

Para evitar gambiarras em plugin sem manutenção, o banco passou a rodar diretamente via JAR oficial da AWS com as flags `-sharedDb` e `-inMemory`, e a tabela é provisionada via AWS CLI apontando para `http://localhost:8000`. As credenciais configuradas no ambiente local (`fakeMyKeyId` / `fakeSecretAccessKey`) servem apenas para satisfazer a assinatura exigida pelo SDK.

## Como executar localmente

### Pré-requisitos

* Node.js 20+
* Java JRE instalado (para rodar o DynamoDB Local)
* AWS CLI instalado e configurado com credenciais fictícias (`aws configure`, região `us-east-1`)
* Binários do DynamoDB Local baixados em `.dynamodb/`

### Passo a passo

1. Instale as dependências:

```bash
npm install

```

2. **Terminal 1** — suba o DynamoDB Local em memória na porta `8000`:

```bash
java -Djava.library.path=./.dynamodb/DynamoDBLocal_lib -jar ./.dynamodb/DynamoDBLocal.jar -sharedDb -inMemory -port 8000

```

3. **Terminal 2** — crie a tabela `ClientsFidelity` no banco local via AWS CLI:

```bash
aws dynamodb create-table \
  --table-name ClientsFidelity \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000

```

4. Ainda no **Terminal 2**, inicie o emulador do API Gateway e das funções Lambda:

```bash
npx sls offline

```

A API ficará disponível em `http://localhost:3000/dev`.

## Endpoints

| Método | Rota | Operação DynamoDB | Respostas |
| --- | --- | --- | --- |
| `GET` | `/dev/hello` | - | `200 OK` |
| `POST` | `/dev/clients` | `PutItem` | `201 Created`, `400 Bad Request` |
| `GET` | `/dev/clients` | `Scan` | `200 OK`, `500 Internal Server Error` |
| `GET` | `/dev/clients/{id}` | `GetItem` | `200 OK`, `400 Bad Request` (UUID inválido), `404 Not Found` |

### Exemplos com `curl`

Criar cliente (inicia automaticamente com `10` pontos de fidelidade):

```bash
curl -i -X POST http://localhost:3000/dev/clients \
  -H "Content-Type: application/json" \
  -d '{"name": "Augusto", "email": "augusto@cafeteria.com"}'

```

Listar todos os clientes:

```bash
curl -i http://localhost:3000/dev/clients

```

Buscar cliente por ID:

```bash
curl -i http://localhost:3000/dev/clients/<UUID>

```

Inspecionar a tabela diretamente via AWS CLI:

```bash
aws dynamodb scan --table-name ClientsFidelity --endpoint-url http://localhost:8000

```

## Progresso e próximos passos

* [x] Estrutura base com Serverless Framework e `serverless-offline`
* [x] Integração local com DynamoDB via AWS SDK v3 e AWS CLI
* [x] Cadastro (`POST /clients`) e listagem (`GET /clients`)
* [x] Busca por chave de partição (`GET /clients/{id}`) com validação de UUID e respostas padronizadas
* [ ] Padronizar `createCustomer` e `listCustomers` com `src/utils/httpResponse.js`
* [ ] Atualização atômica de pontos de fidelidade (`PATCH /clients/{id}/points` com `UpdateCommand`)
* [ ] Remoção de cliente (`DELETE /clients/{id}` com `DeleteCommand`)
* [ ] Script shell (`.sh`) para automatizar a subida e o encerramento do ambiente local

## Referência de estudo

Projeto desenvolvido como prática complementar ao curso **AWS Cloud Practitioner Essentials (Português)** — AWS Training & Certification (concluído em maio de 2026).

## Autor

Augusto Ortigoso Barbosa

* GitHub: https://github.com/supp3rguto
* LinkedIn: https://www.linkedin.com/in/augusto-barbosa-769602194
