# Sistema de Controle de Eventos Acadêmicos - PRD

Sistema de Controle de Eventos Acadêmicos integrado ao backend de produção.

## Experiência

1. **Profissional** - Interface limpa e intuitiva para uso administrativo
2. **Eficiente** - Operações CRUD rápidas e responsivas com feedback imediato  
3. **Confiável** - Integração robusta com backend de produção e tratamento de erros

**Nível de Complexidade**: Light Application (múltiplas funcionalidades com estado básico)
- Sistema acadêmico completo com CRUD de eventos, estudantes e dias de eventos
- Integração com API REST de produção
- Autenticação JWT e gerenciamento de sessão

## Funcionalidades Essenciais

### Autenticação e Autorização
- **Funcionalidade**: Login com credenciais JWT e logout seguro
- **Propósito**: Controle de acesso ao sistema administrativo
- **Trigger**: Acesso inicial ao sistema
- **Progressão**: Tela login → Validação credenciais → Dashboard principal → Funcionalidades completas
- **Critério de Sucesso**: Usuários conseguem autenticar e acessar funcionalidades protegidas

### Gerenciamento de Eventos
- **Funcionalidade**: CRUD completo de eventos acadêmicos
- **Propósito**: Organizar e controlar eventos institucionais
- **Trigger**: Navegação para seção "Eventos"
- **Progressão**: Lista eventos → Criar/Editar evento → Definir parâmetros → Gerenciar dias → Publicar
- **Critério de Sucesso**: Eventos são criados, editados e publicados corretamente

### Gerenciamento de Dias de Eventos  
- **Funcionalidade**: Configuração de múltiplos dias por evento com horários específicos
- **Propósito**: Definir cronograma detalhado para eventos multi-dias
- **Trigger**: Modal "Gerenciar Dias" dentro de um evento
- **Progressão**: Selecionar evento → Abrir modal dias → Adicionar/editar dias → Definir horários e salas → Salvar
- **Critério de Sucesso**: Dias são configurados corretamente com validação de horários

### Gerenciamento de Estudantes
- **Funcionalidade**: CRUD de estudantes com busca e paginação
- **Propósito**: Manter base de dados de participantes
- **Trigger**: Navegação para seção "Estudantes"  
- **Progressão**: Lista estudantes → Buscar/filtrar → Criar/editar estudante → Validar dados → Salvar
- **Critério de Sucesso**: Estudantes são cadastrados e gerenciados eficientemente

### Dashboard de Visão Geral
- **Funcionalidade**: Resumo executivo do sistema
- **Propósito**: Visão rápida do estado atual
- **Trigger**: Login bem-sucedido
- **Progressão**: Login → Dashboard → Resumo métricas → Navegação rápida
- **Critério de Sucesso**: Informações relevantes são exibidas claramente

## Tratamento de Casos Extremos

- **Falha de Conectividade**: Exibição de mensagens de erro claras e opções de retry
- **Token Expirado**: Redirecionamento automático para login com mensagem explicativa
- **Dados Inválidos**: Validação de formulário em tempo real com feedback construtivo
- **Capacidade Esgotada**: Alertas visuais quando eventos atingem capacidade máxima
- **Conflitos de Horário**: Validação de sobreposição de horários em dias de eventos

## Direção de Design

Interface profissional e limpa que transmite confiabilidade e eficiência, com foco na produtividade administrativa. Design minimal com elementos funcionais bem definidos.

## Seleção de Cores

**Esquema**: Complementar (cores opostas)
Paleta profissional azul/branco com acentos laranjas para ações importantes.

- **Primary**: azul profundo `oklch(0.35 0.12 240)` - Transmite confiança e profissionalismo
- **Secondary**: cinza claro `oklch(0.95 0.02 240)` - Elementos de suporte e backgrounds
- **Accent**: laranja vibrante `oklch(0.70 0.15 45)` - CTAs e elementos de destaque
- **Background**: branco puro `oklch(1 0 0)` - Limpeza e legibilidade
- **Foreground**: azul escuro `oklch(0.25 0.12 240)` - Texto principal

**Contrastes Validados**:
- Primary sobre branco: 8.2:1 ✓  
- Accent sobre branco: 4.8:1 ✓
- Foreground sobre branco: 10.1:1 ✓
- Secondary-foreground sobre secondary: 9.5:1 ✓

## Seleção de Fonte

**Inter** - Fonte moderna e legível que transmite profissionalismo técnico sem perder acessibilidade.

**Hierarquia Tipográfica**:
- H1 (Título Principal): Inter Bold/32px/tight spacing
- H2 (Seções): Inter Semibold/24px/normal spacing  
- H3 (Subsecções): Inter Medium/20px/normal spacing
- Body (Texto): Inter Regular/16px/relaxed spacing
- Small (Auxiliar): Inter Regular/14px/normal spacing

## Animações

Movimento sutil e funcional que guia o usuário sem distrair. Transições suaves entre estados que comunicam mudanças de contexto.

**Significado Proposital**: Animações reforçam hierarquia e ajudam na orientação espacial
**Hierarquia de Movimento**: Elementos importantes (botões primários, modais) recebem mais atenção animada

## Seleção de Componentes

**Componentes shadcn utilizados**:
- **Card/CardHeader/CardContent**: Organização visual de conteúdo
- **Button**: Ações primárias e secundárias com estados bem definidos
- **Input/Label**: Formulários com validação clara
- **Dialog**: Modais para edição de dias de eventos
- **Table**: Listagens de dados estruturados
- **Alert**: Feedback de operações e erros
- **Tabs**: Navegação entre seções do dashboard
- **Badge**: Status de eventos e indicadores

**Customizações**:
- Botões com hover states sutis usando cores da paleta
- Cards com sombras mínimas para profundidade
- Inputs com foco destacado usando cor primária

**Estados Interativos**:
- Hover: Mudança sutil de cor/sombra
- Active: Feedback imediato visual
- Disabled: Redução de opacidade + cursor not-allowed
- Loading: Spinner integrado com cores da marca

**Ícones**: Phosphor Icons para ações comuns (Plus, Edit, Trash, etc.)

**Espaçamento**: Grid 4px usando classes Tailwind (`space-y-4`, `gap-6`, etc.)

**Mobile**: Layout responsivo com:
- Sidebar colapsível em telas menores
- Cards empilhados verticalmente 
- Botões com tamanho de toque adequado (44px mínimo)
- Tabelas com scroll horizontal quando necessário

## Integração de Produção

**Backend API**: `https://events-backend-zug5.onrender.com/api/v1/demo`

**Endpoints Ativos**:
- `GET /events` - Lista todos os eventos
- `GET /events/{id}/days` - Lista dias de um evento
- `POST /events/{id}/days` - Cria novo dia para evento
- `PUT /events/{id}/days/{dayId}` - Atualiza dia específico
- `DELETE /events/{id}/days/{dayId}` - Remove dia específico

**Autenticação**: Bearer token JWT pré-configurado para demonstração

**Status Atual**: Sistema totalmente funcional e integrado com backend de produção. Todas as operações CRUD estão operacionais com tratamento robusto de erros e feedback em tempo real.