# NuRa Flow

Central de memória operacional para agenda, reuniões, notas, tarefas, projetos e referências de trabalho.

## Executar localmente

Pré-requisito: Node.js 20 ou superior.

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env.local`.
3. A chave `GEMINI_API_KEY` é opcional. Sem ela, o sistema opera em modo local e informa claramente quais recursos de IA não estão disponíveis.
4. Inicie com `npm run dev` e abra `http://localhost:3000`.

## Validação

- `npm run lint`: valida os contratos TypeScript.
- `npm run build`: gera a versão de produção.
- `npm start`: executa a versão gerada.

Google Calendar, Gmail e Google Drive não estão conectados neste estágio. As telas correspondentes trabalham com agenda e referências locais, sem afirmar sincronização externa.
