# 🌍 LABRADOR

Jogo de estratégia geopolítica multijogador em tempo real.

---

## 📁 Estrutura do Projeto

```
labrador/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/page.tsx          ← Tela de login
│   │   │   └── cadastro/page.tsx       ← Criar conta + país
│   │   │
│   │   └── game/
│   │       ├── layout.tsx              ← Header + BottomNav (wrapper)
│   │       ├── home/page.tsx           ← Banner, stats, chat global
│   │       ├── feed/page.tsx           ← Artigos com likes/dislikes
│   │       ├── state/page.tsx          ← Parlamento, leis, stats país
│   │       ├── war/page.tsx            ← Guerras, treinamento militar
│   │       ├── work/page.tsx           ← Infraestrutura, edifícios
│   │       ├── rede/page.tsx           ← Diplomacia, alianças
│   │       │
│   │       ├── mapa/page.tsx           ← Mapa mundial interativo
│   │       ├── armazem/page.tsx        ← Estoque de recursos
│   │       ├── orcamento/page.tsx      ← Receitas e despesas
│   │       ├── passaporte/page.tsx     ← Perfil do país
│   │       ├── briefing/page.tsx       ← Notificações e avisos
│   │       ├── mercado/page.tsx        ← Compra/venda de recursos
│   │       ├── tax/page.tsx            ← Configuração de impostos
│   │       ├── configuracoes/page.tsx  ← Editar país e líder
│   │       │
│   │       └── pais/
│   │           └── [slug]/page.tsx     ← Perfil de outro país (visita)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx              ← Header fixo com logo
│   │   │   └── BottomNav.tsx           ← Menu inferior com abas
│   │   ├── menus/
│   │   │   └── SideMenu.tsx            ← Menu lateral (≡)
│   │   ├── home/                       ← Componentes da HOME
│   │   ├── feed/                       ← Componentes do FEED
│   │   ├── state/                      ← Componentes do STATE
│   │   ├── war/                        ← Componentes do WAR
│   │   ├── work/                       ← Componentes do WORK
│   │   └── rede/                       ← Componentes do REDE
│   │
│   ├── lib/supabase/
│   │   ├── client.ts                   ← Supabase client-side
│   │   └── server.ts                   ← Supabase server-side (admin)
│   │
│   ├── store/
│   │   └── authStore.ts                ← Zustand: usuário e país logado
│   │
│   ├── context/
│   │   └── AuthContext.tsx             ← Provider de autenticação
│   │
│   └── types/
│       ├── database.ts                 ← Tipos do banco Supabase
│       └── index.ts                    ← Tipos gerais do app
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql      ← Execute no SQL Editor do Supabase
```

---

## 🚀 Como Iniciar

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.local.example .env.local
# Preencha com suas credenciais do Supabase
```

### 3. Criar banco de dados
- Acesse seu projeto no [supabase.com](https://supabase.com)
- Vá em **SQL Editor**
- Cole e execute o arquivo `supabase/migrations/001_initial_schema.sql`

### 4. Renomear pasta de rota dinâmica
- No VS Code, renomeie a pasta `src/app/game/pais/SLUG` para `src/app/game/pais/[slug]`
- (Não é possível criar pastas com `[` `]` em alguns sistemas de arquivo)

### 5. Rodar em desenvolvimento
```bash
npm run dev
```
Acesse: http://localhost:3000

---

## 🗄️ Banco de Dados (Supabase)

### Tabelas principais
| Tabela | Descrição |
|--------|-----------|
| `countries` | Dados de cada país/jogador |
| `regions` | Regiões de cada país |
| `buildings` | Edifícios construídos |
| `resources` | Estoque de recursos |
| `military` | Equipamentos militares |
| `parliament` | Assentos parlamentares |
| `laws` | Leis propostas e ativas |
| `taxes` | Alíquotas de impostos |
| `wars` | Guerras ativas e encerradas |
| `military_training` | Treinos em andamento |
| `articles` | Artigos do feed |
| `article_votes` | Votos em artigos |
| `comments` | Comentários em artigos |
| `chat_messages` | Mensagens do chat global |
| `diplomatic_relations` | Relações entre países |
| `market_offers` | Ofertas do mercado |
| `notifications` | Notificações/briefing |

### Habilitar Realtime
No Supabase Dashboard > **Database > Replication**, habilite para:
- `chat_messages`
- `wars`
- `notifications`
- `articles`

---

## 🎮 Páginas do Jogo

### Abas principais (menu inferior)
| Aba | Rota | Descrição |
|-----|------|-----------|
| HOME | `/game/home` | Banner, estatísticas, chat global |
| FEED | `/game/feed` | Artigos com votação |
| STATE | `/game/state` | Parlamento, leis, stats |
| WAR | `/game/war` | Guerras e treinamento |
| WORK | `/game/work` | Infraestrutura |
| REDE | `/game/rede` | Diplomacia |

### Menu lateral (≡) — apenas HOME e STATE
| Item | Rota |
|------|------|
| MAPA | `/game/mapa` |
| ARMAZÉM | `/game/armazem` |
| ORÇAMENTO | `/game/orcamento` |
| PASSAPORTE | `/game/passaporte` |
| BRIEFING | `/game/briefing` |
| MERCADO | `/game/mercado` |
| TAX | `/game/tax` |
| CONFIGURAÇÕES | `/game/configuracoes` |

### Visita a outro país
Rota: `/game/pais/[slug]`
Mostra perfil público + ações diplomáticas

---

## 🛠️ Stack Tecnológica

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Banco de Dados:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Email + Google OAuth)
- **Estado global:** Zustand
- **Mapa:** Leaflet + React-Leaflet
- **Deploy sugerido:** Vercel
