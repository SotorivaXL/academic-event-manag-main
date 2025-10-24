# Sistema de Controle de Eventos Acadêmicos - PRD

## Visão Geral do Projeto

### Status Atual
- **Backend API**: Integrada e funcional (https://events-backend-zug5.onrender.com)
- **Funcionalidades Implementadas**: 
  - Autenticação de usuários com API real
  - Gerenciamento de alunos (CRUD completo)
  - **ATUALIZADO**: Gerenciamento de eventos (CRUD completo com API)
  - Gerenciamento de dias de eventos (CRUD completo)
- **Próximos Passos**: Inscrições, controle de presença, certificados

## Funcionalidades Principais

### 1. Autenticação
- **Status**: ✅ Implementado e Atualizado
- Login real com username/password na API
- Tokens JWT (access + refresh) da API
- Tenant "demo" configurado
- Credenciais: admin@demo / admin123
- Logout funcional

### 2. Gerenciamento de Alunos  
- **Status**: ✅ Implementado
- Listagem com busca paginada
- Criação de novos alunos
- Edição de dados existentes
- Exclusão de alunos
- Integração completa com API backend

### 3. Gerenciamento de Eventos
- **Status**: ✅ Implementado e Atualizado para API
- **ATUALIZADO**: CRUD completo integrado com API backend
- Criação de eventos com todos os campos da API:
  - Título e descrição (obrigatórios)
  - Local (venue)
  - Capacidade total
  - Carga horária em horas
  - Percentual mínimo de presença
  - Status (draft/published/completed)
- Edição e exclusão de eventos
- Interface moderna com cards responsivos
- **NOVO**: Gestão de dias dos eventos
  - Adicionar múltiplos dias para cada evento
  - Definir horários (início/fim) para cada dia
  - Especificar sala/local por dia
  - Configurar capacidade específica por dia
  - Interface amigável com modal dedicado

### 4. Dias de Eventos (Funcionalidade Recém-Implementada)
- **Status**: ✅ Novo - Recém Implementado
- **API Endpoints**:
  - `GET /api/v1/demo/events/{id}/days` - Listar dias
  - `POST /api/v1/demo/events/{id}/days` - Criar dia
  - `PUT /api/v1/demo/events/{id}/days/{dayId}` - Atualizar dia  
  - `DELETE /api/v1/demo/events/{id}/days/{dayId}` - Excluir dia

- **Funcionalidades**:
  - Modal dedicado para gerenciar dias de cada evento
  - Formulário validado para criação/edição
  - Visualização organizada por data
  - Validação de horários (início < fim)
  - Capacidade específica por dia
  - Operações CRUD completas

## Arquitetura Técnica

### Frontend (React + TypeScript)
- **Framework**: React com TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Estado**: Hooks customizados + useKV para persistência
- **API**: Classe ApiService centralizada
- **Autenticação**: Context API + localStorage para tokens JWT

### Hooks Customizados
- `useAuth`: Gerenciamento de autenticação
- `useEvents`: **ATUALIZADO** - Operações CRUD de eventos integradas com API
- `useEventDays`: Operações CRUD de dias de eventos
- `useStudents`: Operações CRUD de alunos

### Componentes Principais
- `AuthProvider`: Contexto de autenticação
- `MainApp`: Shell principal da aplicação
- `EventManagement`: **ATUALIZADO** - Gestão completa de eventos com API
- `EventDaysDialog`: Modal para gerenciar dias
- `StudentManagement`: Gestão de alunos
- `Dashboard`: Visão geral do sistema

## Integração com API

### Estrutura da API
- **Base URL**: `https://events-backend-zug5.onrender.com/api/v1/demo`
- **Autenticação**: Bearer token (JWT) obtido via login real
- **Tenant**: Multi-tenant com "demo" como padrão
- **Content-Type**: `application/json` para dados, `form-data` para login

### Campos da API de Eventos
```typescript
{
  title: string;           // Título do evento
  description: string;     // Descrição detalhada
  venue: string;          // Local/venue
  capacity_total: number; // Capacidade total
  workload_hours: number; // Carga horária
  min_presence_pct: number; // % mínimo de presença
  status: string;         // draft/published/completed
  start_at?: string;      // Data início (opcional)
  end_at?: string;        // Data fim (opcional)
}
```

### Endpoints Ativos
```bash
# Autenticação
POST /auth/login (Content-Type: application/x-www-form-urlencoded)

# Eventos  
GET /events
POST /events
GET /events/{id}
PUT /events/{id}
DELETE /events/{id}

# Dias de Eventos
GET /events/{id}/days
POST /events/{id}/days
PUT /events/{id}/days/{dayId}
DELETE /events/{id}/days/{dayId}

# Alunos
GET /students?query=&page=1&size=20
POST /students
GET /students/{id}
PUT /students/{id}
DELETE /students/{id}
```

## Design e UX

### Princípios de Design
- **Simplicidade**: Interface limpa e intuitiva
- **Consistência**: Padrões visuais unificados
- **Funcionalidade**: Foco na eficiência operacional
- **Responsividade**: Adaptável a diferentes dispositivos

### Sistema de Cores
- **Primary**: Azul escuro profissional
- **Background**: Branco limpo
- **Cards**: Sombras sutis para profundidade
- **Estados**: Cores semânticas (sucesso, erro, warning)

### Tipografia
- **Font**: Inter (clean, professional)
- **Hierarquia**: Bem definida entre títulos e textos
- **Legibilidade**: Contraste adequado em todos os elementos

## Próximas Implementações

### 1. Sistema de Inscrições
- Inscrição de alunos em eventos
- Lista de espera automática
- Confirmação por e-mail
- Status de inscrição

### 2. Controle de Presença
- QR Code dinâmico por inscrição
- Scanner para check-in/check-out
- Validação por dia/sessão
- Modo offline com sincronização

### 3. Certificados
- Geração automática baseada em presença
- Templates customizáveis
- QR Code de verificação
- Distribuição digital

## Critérios de Qualidade

### Performance
- Carregamento < 2s para listagens
- Operações CRUD < 500ms
- Interface responsiva

### UX
- Feedback imediato para todas as ações
- Estados de loading visíveis
- Mensagens de erro claras
- Confirmações para ações destrutivas

### Acessibilidade
- Navegação por teclado
- Contraste de cores adequado
- Labels descritivos
- Estados de foco visíveis

## Estado da Implementação

### ✅ Concluído
- Autenticação completa com API real
- CRUD de alunos
- **NOVO**: CRUD de eventos completamente integrado com API
  - Criação com todos os campos necessários
  - Edição e exclusão
  - Interface moderna e responsiva
- CRUD de dias de eventos com interface dedicada
- Integração com API backend
- Design system consistente

### 🚧 Em Desenvolvimento
- Sistema de inscrições
- Dashboard com métricas
- Relatórios básicos

### 📋 Planejado
- Controle de presença
- Geração de certificados
- Notificações
- Exportação de dados

## Conclusão

O sistema está agora completamente integrado com a API backend para o gerenciamento de eventos. A funcionalidade de criação de eventos foi atualizada para trabalhar diretamente com a API, incluindo todos os campos necessários como carga horária, capacidade total, e configurações de presença mínima.

A próxima grande implementação será o sistema de inscrições, que permitirá aos alunos se inscreverem nos eventos e começar o fluxo de controle de presença e emissão de certificados.