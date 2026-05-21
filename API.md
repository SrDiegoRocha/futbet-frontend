# FutBet API — Guia de integração

Documento de referência para integrar o frontend Angular com a API FutBet. Cobre **todos** os endpoints, payloads, tipagens TypeScript, validações, regras de negócio relevantes pro cliente, status codes e fluxos.

---

## 1. Visão geral

### Base URL

```
http://localhost:8080
```

Em produção, vai mudar — manter como env var `API_BASE_URL`.

### Content-Type

Sempre `application/json` em requests com body. Responses sempre vêm em JSON UTF-8.

### Autenticação

A maior parte dos endpoints exige header:

```
Authorization: Bearer <accessToken>
```

Apenas os 3 endpoints de `/api/auth/*` aceitam sem token. Sem token em rota protegida → **403 Forbidden** (sem body útil) ou **401 Unauthorized** com `ApiError` quando o token está presente mas inválido/expirado.

### CORS

Hoje **não há configuração CORS no backend**. Em dev, configure `proxy.conf.json` no Angular apontando `/api` para `http://localhost:8080`. Quando for pra produção, o backend precisará habilitar CORS para o domínio do front.

### Formatos

- **Datas**: ISO 8601 UTC, ex. `2026-05-21T00:53:38.123Z`. Sempre instantes (`Instant`), nunca local time.
- **UUIDs**: strings v4, ex. `be243151-a22d-48b5-ba8d-4fa7747efb5a`. Todos os identificadores **públicos** (path params, response IDs) são UUID.
- **Numéricos**: `int`/`Integer` em Java vira `number` em JS.

---

## 2. Tratamento de erros

Toda resposta de erro segue o formato `ApiError`:

```ts
export interface ApiError {
  timestamp: string;          // ISO instant
  status: number;             // HTTP status code
  error: string;              // HTTP reason phrase ("Bad Request", "Conflict", etc.)
  message: string;            // mensagem técnica em inglês
  path: string;               // ex. "/api/auth/signin"
  fieldErrors: FieldError[] | null;
}

export interface FieldError {
  field: string;              // ex. "settings.matchLegMode"
  message: string;            // mensagem de validação (Bean Validation)
}
```

**Status codes esperados na aplicação inteira**

| Code | Quando aparece |
| ---- | -------------- |
| 200  | GET / PUT / POST de operação que retorna recurso |
| 201  | POST que cria recurso |
| 204  | DELETE bem-sucedido (sem body) |
| 400  | Payload inválido — `fieldErrors` populado |
| 401  | Token ausente/inválido/expirado, credenciais erradas |
| 403  | Rota autenticada sem token, ou caller sem permissão (ex. não é owner do torneio) |
| 404  | Recurso não existe ou caller não tem acesso a ele (ex. time de outro dono) |
| 409  | Conflito de regra de negócio (lifecycle, duplicidade, lock, etc.) |
| 500  | Erro inesperado — mensagem genérica |

> Estratégia: tratar 401 globalmente no interceptor (tentar refresh, se falhar redirecionar pro login). 400/409 mostrar `message` no UI. 403/404 dependendo do contexto.

---

## 3. Enums

Todos os enums são `string` no JSON. Sempre **maiúsculas com underscore**.

```ts
export type Role = 'USER' | 'ADMIN';

export type TournamentPrivacy = 'PUBLIC' | 'PRIVATE';
export type TournamentStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'FINISHED';
export type TournamentMemberRole = 'OWNER' | 'PARTICIPANT';
export type TournamentMemberStatus = 'ACTIVE' | 'LEFT' | 'BANNED';

export type TournamentPhaseType = 'ROUND_ROBIN' | 'KNOCKOUT' | 'GROUPS';
export type MatchLegMode = 'SINGLE' | 'TWO_LEGGED';
export type MatchGenerationMode = 'AUTOMATIC' | 'MANUAL';

export type TiebreakCriteria =
  | 'POINTS'
  | 'WINS'
  | 'GOAL_DIFFERENCE'
  | 'GOALS_FOR'
  | 'HEAD_TO_HEAD'
  | 'FEWEST_LOSSES';

export type MatchStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type ZoneSelectionMode = 'ALL' | 'BEST_RANKED';
```

---

## 4. Paginação (Spring Data `Page<T>`)

Algumas listagens retornam página, outras retornam array simples. Quando for página, o formato é:

```ts
export interface Page<T> {
  content: T[];
  number: number;             // página atual (0-indexed)
  size: number;
  numberOfElements: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
    sort: { empty: boolean; sorted: boolean; unsorted: boolean };
  };
  sort: { empty: boolean; sorted: boolean; unsorted: boolean };
}
```

Query params aceitos em rotas paginadas:

- `?page=0` (default 0)
- `?size=20` (default 20)
- `?sort=name,asc` ou `?sort=createdAt,desc` (múltiplos `sort` permitidos)

Onde indico abaixo `Page<TeamResponse>` é exatamente esse formato. Onde indico `TeamResponse[]` ou `List<TeamResponse>`, é array simples direto no body.

---

## 5. Autenticação (`/api/auth`)

Endpoints abertos (sem token). Retornam `AuthResponse` em sucesso.

### `AuthResponse`

```ts
export interface AuthResponse {
  accessToken: string;        // JWT HS256, vida curta (15min)
  refreshToken: string;       // JWT HS256, vida longa (7d)
  tokenType: 'Bearer';
  expiresIn: number;          // TTL do accessToken em segundos
  user: UserSummary;
}

export interface UserSummary {
  id: string;                 // UUID público do usuário
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  createdAt: string;          // ISO instant
}
```

### `POST /api/auth/signup` → 201

Cria usuário (role `USER`, `active=true`) e devolve tokens.

```ts
export interface SignUpRequest {
  name: string;               // 2–120 chars
  email: string;              // formato válido, normalizado pra lowercase, único
  password: string;           // 8–100 chars
  avatarUrl?: string | null;  // URL válida até 500 chars
}
```

Erros específicos:
- **409** `Email already in use` — email já cadastrado.

### `POST /api/auth/signin` → 200

```ts
export interface SignInRequest {
  email: string;
  password: string;
}
```

Erros:
- **401** `Invalid email or password` — credenciais inválidas ou usuário inativo (`active=false`).

### `POST /api/auth/refresh` → 200

```ts
export interface RefreshTokenRequest {
  refreshToken: string;
}
```

Retorna novo par. O refresh token antigo continua válido até expirar — não há revogação. O endpoint só aceita tokens com claim `type=REFRESH`.

Erros:
- **401** `Invalid or expired token`

### Estratégia de cliente recomendada

1. Guardar `accessToken` + `refreshToken` (cookie httpOnly via backend ou localStorage; localStorage é mais simples mas vulnerável a XSS — a escolha é tua).
2. Interceptor HTTP injeta `Authorization: Bearer <accessToken>` em toda request `/api/**` exceto `/api/auth/**`.
3. Interceptor de resposta detecta 401, tenta `POST /api/auth/refresh`; se sucesso, refaz a request original; se falhar, logout e redireciona pra login.
4. Decodificar o JWT no client é seguro (não é segredo) — útil pra exibir `name` antes de fazer outra chamada.

---

## 6. Times (`/api/teams`)

Todos os endpoints exigem auth. **Visibilidade**: cada usuário só vê os próprios times.

### `TeamResponse`

```ts
export interface TeamResponse {
  id: string;                 // UUID público
  name: string;
  shortName: string | null;   // 2–5 chars
  badgeUrl: string | null;
  primaryColor: string;       // #RRGGBB
  secondaryColor: string;     // #RRGGBB
  createdAt: string;
  updatedAt: string;
}
```

### `POST /api/teams` → 201

```ts
export interface CreateTeamRequest {
  name: string;               // 2–80 chars
  shortName?: string | null;  // 2–5 chars (opcional)
  badgeUrl?: string | null;   // URL válida, até 500 chars (opcional)
  primaryColor: string;       // regex ^#[0-9a-fA-F]{6}$
  secondaryColor: string;     // regex ^#[0-9a-fA-F]{6}$
}
```

Erros:
- **400** com `fieldErrors` — payload inválido.
- **409** `You already have a team with this name` — nome já em uso pelo mesmo dono (case-insensitive). Note: outro usuário pode ter time com o mesmo nome.

### `GET /api/teams` → 200 `Page<TeamResponse>`

Lista paginada dos meus times. Aceita `page`, `size`, `sort`.

### `GET /api/teams/{id}` → 200 `TeamResponse`

`{id}` é o `publicId` (UUID). **404** se não existe ou pertence a outro usuário (não diferenciamos os dois — não vazar existência alheia).

### `PUT /api/teams/{id}` → 200 `TeamResponse`

Body = `CreateTeamRequest` (mesma estrutura para Update). Verificação de duplicidade só dispara se o nome mudou. **404** se não é dono.

### `DELETE /api/teams/{id}` → 204

Soft delete (`active=false`). O time desaparece das listagens mas continua no banco. Permite recriar outro time com o mesmo nome depois.

---

## 7. Torneios — CRUD principal (`/api/tournaments`)

### `TournamentResponse`

```ts
export interface TournamentResponse {
  id: string;                                 // UUID público
  name: string;
  description: string | null;
  inviteCode: string;                         // 8 chars alfanuméricos
  privacy: TournamentPrivacy;
  status: TournamentStatus;
  maxParticipants: number | null;
  maxTeams: number | null;
  owner: { id: string; name: string };
  settings: TournamentSettingsResponse;
  memberCount: number;                        // só conta ACTIVE
  teamCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentSettingsResponse {
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  exactScorePoints: number;
  winnerPoints: number;
  wrongPoints: number;
  tiebreakCriteria: TiebreakCriteria[];       // lista ordenada (ordem importa)
}
```

### `POST /api/tournaments` → 201

Cria torneio em status `DRAFT`. Owner vira `TournamentMember` automático com role `OWNER` e status `ACTIVE`.

```ts
export interface CreateTournamentRequest {
  name: string;                               // 3–80 chars
  description?: string | null;                // até 500 chars
  privacy: TournamentPrivacy;
  maxParticipants?: number | null;            // ≥ 2
  maxTeams?: number | null;                   // ≥ 2
  settings: TournamentSettingsPayload;
}

export interface TournamentSettingsPayload {
  winPoints: number;                          // ≥ 0
  drawPoints: number;                         // ≥ 0
  lossPoints: number;                         // ≥ 0
  exactScorePoints: number;                   // ≥ 0
  winnerPoints: number;                       // ≥ 0
  wrongPoints: number;                        // ≥ 0
  tiebreakCriteria: TiebreakCriteria[];       // lista não vazia, sem duplicados
}
```

### `PUT /api/tournaments/{id}` → 200

Body = `UpdateTournamentRequest` (mesma estrutura de `CreateTournamentRequest`).

Regras de edição **por status**:

| Status | name/description | settings | privacy | maxParticipants/maxTeams |
| ------ | ---------------- | -------- | ------- | ------------------------ |
| DRAFT | sim | sim | sim | sim |
| OPEN | sim | sim | sim | sim |
| IN_PROGRESS | sim | sim | **não** (409) | sim |
| FINISHED | **não** (409) | **não** | **não** | **não** |

Diminuir `maxParticipants` abaixo do número atual de membros ativos, ou `maxTeams` abaixo do número de times vinculados → **409**.

Erros específicos:
- **400** `Tiebreak criteria must not contain duplicates` — lista com enums repetidos.

### `GET /api/tournaments/mine` → 200 `Page<TournamentResponse>`

Meus torneios (qualquer status, qualquer privacy).

### `GET /api/tournaments/public` → 200 `Page<TournamentResponse>`

Públicos com status `OPEN` ou `IN_PROGRESS`. Privados nunca aparecem aqui.

### `GET /api/tournaments/joined` → 200 `Page<TournamentResponse>`

Torneios onde sou `TournamentMember` com status `ACTIVE`.

### `GET /api/tournaments/{id}` → 200 `TournamentResponse`

Detalhe. Acessível para: owner, qualquer member, ou qualquer um se o torneio for PUBLIC OPEN/IN_PROGRESS. Senão **404**.

### `POST /api/tournaments/{id}/status` → 200

Avança o status linearmente. Owner-only.

```ts
export interface ChangeStatusRequest {
  targetStatus: TournamentStatus;
}
```

Transições válidas:
- `DRAFT → OPEN`
- `OPEN → IN_PROGRESS`
- `IN_PROGRESS → FINISHED`

Qualquer outra (`OPEN → DRAFT`, `DRAFT → IN_PROGRESS`, etc.) → **409** `Cannot transition tournament from X to Y`.

### `POST /api/tournaments/{id}/invite-code/regenerate` → 200

Gera novo `inviteCode` de 8 chars. Owner-only. O código anterior **deixa de funcionar imediatamente**.

### `DELETE /api/tournaments/{id}` → 204

Soft delete. Owner-only.

### `POST /api/tournaments/join` → 200 `TournamentResponse`

Entra como participante via código de convite. Funciona em torneios `OPEN` ou `IN_PROGRESS`.

```ts
export interface JoinTournamentRequest {
  inviteCode: string;         // 8 chars
}
```

Comportamento:
- Se for primeira vez do user no torneio: cria `TournamentMember` com role `PARTICIPANT` e status `ACTIVE`.
- Se já saiu antes (status `LEFT`): reativa.
- Se já é `ACTIVE`: **409** `You are already a member of this tournament`.
- Se foi banido (status `BANNED`): **403** `You are banned from this tournament` — permanente.

Outros erros:
- **404** `Tournament not found` — código inexistente ou torneio soft-deletado.
- **409** `Cannot modify tournament in status DRAFT/FINISHED: tournament is not accepting members` — torneio fora de OPEN/IN_PROGRESS.
- **409** `Tournament is full: max participants reached` — atingiu `maxParticipants`.

---

## 8. Membros do torneio (`/api/tournaments/{tournamentId}/members`)

### `TournamentMemberResponse`

```ts
export interface TournamentMemberResponse {
  userId: string;             // UUID público
  name: string;
  avatarUrl: string | null;
  role: TournamentMemberRole;
  status: TournamentMemberStatus;
  joinedAt: string;
  leftAt: string | null;
  bannedAt: string | null;
}
```

### `GET /api/tournaments/{tournamentId}/members` → 200 `Page<TournamentMemberResponse>`

Lista paginada de todos os membros (incluindo LEFT e BANNED).

### `DELETE /api/tournaments/{tournamentId}/members/me` → 204

Sair voluntariamente. Status vira `LEFT`, `leftAt` registrado. Pode rejoin com o mesmo invite code.

Erros:
- **409** `Tournament owner cannot leave their own tournament` — owner não pode usar este endpoint.

### `DELETE /api/tournaments/{tournamentId}/members/{userId}` → 204

Banir um membro. Owner-only. Status vira `BANNED`, permanente.

Erros:
- **403** `Only the tournament owner can perform this action`
- **409** `Tournament owner cannot leave their own tournament` — owner não pode se autobanir (sim, mesma mensagem).

---

## 9. Times vinculados ao torneio (`/api/tournaments/{tournamentId}/teams`)

### `TournamentTeamResponse`

```ts
export interface TournamentTeamResponse {
  teamId: string;             // UUID público do Team
  name: string;
  shortName: string | null;
  badgeUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  addedAt: string;
}
```

### `GET /api/tournaments/{tournamentId}/teams` → 200 `Page<TournamentTeamResponse>`

### `POST /api/tournaments/{tournamentId}/teams/{teamId}` → 201

Vincula um time do **próprio owner** ao torneio. Owner-only.

Erros:
- **403** `You can only add your own teams to a tournament` — tentou vincular time de outro usuário.
- **409** `Team is already part of this tournament` — duplicado.
- **409** `Tournament is full: max teams reached` — atingiu `maxTeams`.
- **409** `Cannot modify tournament in status IN_PROGRESS/FINISHED: teams can only be changed in DRAFT or OPEN`.

### `DELETE /api/tournaments/{tournamentId}/teams/{teamId}` → 204

Desvincula. Mesmas regras de status do POST.

---

## 10. Fases do torneio (`/api/tournaments/{tournamentId}/phases`)

Cada torneio é uma **sequência ordenada** de phases. Cada phase tem seu próprio formato (round-robin / knockout / grupos) e suas próprias regras de geração e ida-volta.

### `PhaseResponse`

```ts
export interface PhaseResponse {
  id: string;                 // UUID público
  name: string;
  position: number;           // 0-indexed
  phaseType: TournamentPhaseType;
  matchLegMode: MatchLegMode;
  matchGenerationMode: MatchGenerationMode;
  qualifiersPerGroup: number | null;     // só relevante em GROUPS
  playsInsideGroupOnly: boolean | null;  // só relevante em GROUPS
  hasThirdPlace: boolean;                // só relevante em KNOCKOUT
  groupCount: number;
  teamCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### `POST /api/tournaments/{tournamentId}/phases` → 201

Cria phase. Se for a phase de posição `0` (primeira), **auto-popula** o `PhaseTeam` com todos os `TournamentTeam` do torneio.

```ts
export interface CreatePhaseRequest {
  name: string;                                  // 1–60 chars
  phaseType: TournamentPhaseType;
  matchLegMode: MatchLegMode;
  matchGenerationMode: MatchGenerationMode;
  qualifiersPerGroup?: number | null;            // ≥ 1, só usado em GROUPS
  playsInsideGroupOnly?: boolean | null;         // só usado em GROUPS
  hasThirdPlace?: boolean | null;                // só usado em KNOCKOUT
}
```

Para outros `phaseType`, os campos que não fazem sentido são ignorados pelo backend (sempre vêm `null` ou `false` no response).

### `GET /api/tournaments/{tournamentId}/phases` → 200 `PhaseResponse[]`

Lista ordenada por `position` ascendente.

### `GET /api/tournaments/{tournamentId}/phases/{phaseId}` → 200 `PhaseResponse`

### `PUT /api/tournaments/{tournamentId}/phases/{phaseId}` → 200

Body = `UpdatePhaseRequest` (mesma estrutura de `CreatePhaseRequest`).

### `POST /api/tournaments/{tournamentId}/phases/{phaseId}/move` → 200

Reordena phases. Service faz o shift automático das demais para manter posições contíguas.

```ts
export interface MovePhaseRequest {
  position: number;           // ≥ 0
}
```

### `DELETE /api/tournaments/{tournamentId}/phases/{phaseId}` → 204

Hard delete. Bloqueado quando há matches associados (**409** `Cannot remove phase because it has matches attached`).

### Lifecycle vs status do torneio

- **DRAFT/OPEN**: cria/edita/deleta/reordena phases livremente.
- **IN_PROGRESS**: estrutura trava → **409** `Phase structure is locked while tournament is IN_PROGRESS`.
- **FINISHED**: read-only.

---

## 11. Grupos da fase (`/api/tournaments/{tid}/phases/{pid}/groups`)

Só válido em phase do tipo `GROUPS`.

### `PhaseGroupResponse`

```ts
export interface PhaseGroupResponse {
  id: string;                 // UUID público
  name: string;
  position: number;
  teamCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### `POST /api/tournaments/{tid}/phases/{pid}/groups` → 201

```ts
export interface CreatePhaseGroupRequest {
  name: string;               // 1–40 chars, livre
}
```

Erros:
- **409** `Groups can only be added to a phase of type GROUPS` — phase não é GROUPS.
- **409** `This phase already has a group with that name` — nome duplicado (case-insensitive) na mesma phase.

### `GET /api/tournaments/{tid}/phases/{pid}/groups` → 200 `PhaseGroupResponse[]`

### `PUT /api/tournaments/{tid}/phases/{pid}/groups/{groupId}` → 200

```ts
export interface UpdatePhaseGroupRequest {
  name: string;
}
```

### `DELETE /api/tournaments/{tid}/phases/{pid}/groups/{groupId}` → 204

Hard delete. Bloqueado se há matches no grupo (**409** `Cannot remove group because it has matches attached`).

---

## 12. Times da fase (`/api/tournaments/{tid}/phases/{pid}/teams`)

Quais times participam **daquela phase**. Em phase 0, é auto-populado com os `TournamentTeam`. Em phases seguintes, admin adiciona manualmente (ou são propagados pelo `finalize`).

### `PhaseTeamResponse`

```ts
export interface PhaseTeamResponse {
  teamId: string;             // UUID público do Team
  teamName: string;
  shortName: string | null;
  badgeUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  groupId: string | null;     // UUID do PhaseGroup; null em ROUND_ROBIN/KNOCKOUT
  groupName: string | null;
  addedAt: string;
}
```

### `GET /api/tournaments/{tid}/phases/{pid}/teams` → 200 `PhaseTeamResponse[]`

### `POST /api/tournaments/{tid}/phases/{pid}/teams/{teamId}` → 201

Adiciona time à phase. O time precisa estar em `TournamentTeam` (vinculado ao torneio).

Erros:
- **409** `Team is not part of this tournament` — time não está no roster do torneio.
- **409** `Team is already part of this tournament` — duplicado na phase.

### `PUT /api/tournaments/{tid}/phases/{pid}/teams/{teamId}` → 200

Atribui (ou desatribui com `groupId: null`) o time a um grupo.

```ts
export interface MovePhaseTeamRequest {
  groupId: string | null;     // UUID do PhaseGroup ou null
}
```

Erros:
- **404** `Team is not in this phase`
- **404** `Group not found`

### `DELETE /api/tournaments/{tid}/phases/{pid}/teams/{teamId}` → 204

Remove time da phase. Bloqueado se há matches envolvendo o time na phase (**409**).

### `POST /api/tournaments/{tid}/phases/{pid}/teams/draw` → 200 `PhaseTeamResponse[]`

Sorteia (round-robin de distribuição com `SecureRandom`) os `PhaseTeam`s **sem grupo** entre os grupos existentes da phase.

Erros:
- **409** `BEST_RANKED zones are only valid on GROUPS phases` — phase não é GROUPS.
- **409** `Phase has no groups configured to draw teams into` — sem grupos.

---

## 13. Zonas (`/api/tournaments/{tid}/phases/{pid}/zones`)

Faixas de posição na tabela da phase com uma regra: o que acontece com os times daquela faixa quando a phase termina (avança pra outra phase ou cai no vácuo).

### `ZoneResponse`

```ts
export interface ZoneResponse {
  id: string;                 // UUID público
  name: string;
  fromPosition: number;
  toPosition: number;
  selectionMode: ZoneSelectionMode;
  bestRankedCount: number | null;
  nextPhaseId: string | null;
  nextPhaseName: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}
```

### `POST /api/tournaments/{tid}/phases/{pid}/zones` → 201

```ts
export interface CreateZoneRequest {
  name: string;                       // 1–60 chars
  fromPosition: number;               // ≥ 1
  toPosition: number;                 // ≥ fromPosition
  selectionMode: ZoneSelectionMode;
  bestRankedCount?: number | null;    // obrigatório se BEST_RANKED
  nextPhaseId?: string | null;        // UUID da phase destino, ou null pra "eliminado"
}
```

Validações:
- `fromPosition <= toPosition` (senão **409**).
- Não pode sobrepor outra zone da mesma phase (**409** `zone overlaps with existing zone 'X'`).
- `BEST_RANKED` exige: phase `GROUPS`, `fromPosition == toPosition`, `bestRankedCount > 0` e `≤ groupCount`.
- `nextPhaseId`, se preenchido, precisa pertencer ao mesmo torneio e ter `position` maior que a phase atual (**409** `nextPhase must come after the current phase`).

### `GET /api/tournaments/{tid}/phases/{pid}/zones` → 200 `ZoneResponse[]`

Ordenado por `position` ascendente.

### `PUT /api/tournaments/{tid}/phases/{pid}/zones/{zoneId}` → 200

Body = `UpdateZoneRequest` (mesma estrutura de `CreateZoneRequest`).

### `DELETE /api/tournaments/{tid}/phases/{pid}/zones/{zoneId}` → 204

### Diferenças de lifecycle

Zonas podem ser criadas/editadas/deletadas em `DRAFT`, `OPEN` **e** `IN_PROGRESS`. Só travam em `FINISHED`. (Diferente da estrutura — phases/groups/phaseTeam — que trava em IN_PROGRESS.)

---

## 14. Partidas (`/api/tournaments/{tid}/phases/{pid}/matches`)

### `MatchResponse`

```ts
export interface MatchResponse {
  id: string;                 // UUID público
  phaseId: string;
  groupId: string | null;
  groupName: string | null;
  round: number;
  tieId: string;              // UUID que agrupa pernas de ida e volta
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  scheduledAt: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TeamRef {
  id: string;
  name: string;
  shortName: string | null;
  badgeUrl: string | null;
}
```

### `POST /api/tournaments/{tid}/phases/{pid}/matches` → 201

```ts
export interface CreateMatchRequest {
  homeTeamId: string;             // UUID do Team (precisa estar em PhaseTeam)
  awayTeamId: string;             // distinto do home
  round: number;                  // ≥ 0
  groupId?: string | null;        // obrigatório em GROUPS phase; proibido fora
  tieId?: string | null;          // opcional; sistema gera se omitido
  scheduledAt?: string | null;    // ISO instant; opcional
}
```

Validações cruzadas (todas retornam **409**):
- `A team cannot play against itself` (homeTeamId == awayTeamId)
- `home/away team is not registered in this phase` (time não em PhaseTeam)
- `groupId is required for GROUPS phase` / `groupId only applies to GROUPS phase`
- `home/away team is not in the specified group`
- `A team cannot play twice in the same round` (mandante ou visitante já joga essa rodada na phase)
- `tieId already belongs to a different phase`
- `tie legs must have inverted home/away teams`
- `tie legs must be in different rounds`
- `a tie can have at most two legs`

### `GET /api/tournaments/{tid}/phases/{pid}/matches` → 200 `MatchResponse[]`

Query opcional:
- `?round=N` — filtra por rodada
- `?groupId=UUID` — filtra por grupo

(Os dois são mutuamente exclusivos no service — só um é considerado por chamada.)

### `GET /api/tournaments/{tid}/phases/{pid}/matches/{matchId}` → 200 `MatchResponse`

### `PUT /api/tournaments/{tid}/phases/{pid}/matches/{matchId}` → 200

Atualiza dados de agendamento. Bloqueado se match já está `COMPLETED` (**409** `Cannot edit match scheduling after result is set; clear result first`).

```ts
export interface UpdateMatchRequest {
  homeTeamId: string;
  awayTeamId: string;
  round: number;
  groupId?: string | null;
  scheduledAt?: string | null;
}
```

> Note: `tieId` **não** é editável após criação.

### `PUT /api/tournaments/{tid}/phases/{pid}/matches/{matchId}/result` → 200

Lança ou edita o resultado. Após salvar, **recalcula pontos de todos os palpites** vinculados ao match.

```ts
export interface SetMatchResultRequest {
  homeScore: number;          // ≥ 0
  awayScore: number;          // ≥ 0
}
```

Validações:
- **409** `Results can only be set while tournament is IN_PROGRESS`
- **409** `Cannot set result on a cancelled match`
- **409** `Match has no scheduled time; set it before lançar result`
- **409** `Results can only be set after the prediction deadline (scheduledAt)` — `now < scheduledAt`

### `PUT /api/tournaments/{tid}/phases/{pid}/matches/{matchId}/cancel` → 200

Marca como `CANCELLED` e zera placares. Os palpites do match perdem todos os pontos (mas mantém os placares pra histórico).

### `DELETE /api/tournaments/{tid}/phases/{pid}/matches/{matchId}` → 204

Hard delete. Bloqueado em torneio `FINISHED`.

---

## 15. Geração automática de partidas

### `POST /api/tournaments/{tid}/phases/{pid}/matches/generate` → 201 `MatchResponse[]`

Owner-only. Sem body.

**Pré-condições**:
- Torneio não pode estar `FINISHED`.
- `phase.matchGenerationMode` precisa ser `AUTOMATIC` (senão **409** `Phase has matchGenerationMode=MANUAL; cannot auto-generate`).
- Em `ROUND_ROBIN`/`GROUPS`: phase precisa estar **vazia** de matches.
- Em `KNOCKOUT`: phase vazia gera round 1; com matches já presentes, gera a próxima rodada a partir dos vencedores.

**Algoritmo**:
- `ROUND_ROBIN`/`GROUPS`: algoritmo de círculo (Berger). Shuffle inicial com `SecureRandom`, bye para N ímpar, `N-1` rodadas em `SINGLE` e `2*(N-1)` em `TWO_LEGGED` (ida e volta com `tieId` comum). Em `GROUPS`, executa por grupo.
- `KNOCKOUT`: requer **potência de 2** de times na primeira chamada (**409** `KNOCKOUT requires a power of 2 of teams (got N)`). Emparelha 1×último, 2×penúltimo, etc. Chamadas seguintes detectam vencedores da rodada anterior (single ou agregado em TWO_LEGGED) e geram a próxima.
- `hasThirdPlace=true` em KNOCKOUT: quando estiver gerando a rodada final, cria também a disputa de 3º lugar entre os 2 perdedores das semifinais.

**Outros erros possíveis** (todos 409):
- `Phase already has matches; clear them before generating` (RR/GROUPS)
- `Phase needs at least 2 teams to generate matches`
- `GROUPS phase has no groups configured`
- `Team 'X' is not assigned to any group`
- `Group 'X' needs at least 2 teams`
- `Previous round still has unfinished matches` (KO)
- `Tie X has no winner (draw on aggregate); resolve manually` (KO TWO_LEGGED com empate no agregado)
- `Phase already has a champion; no more rounds to generate`

---

## 16. Classificação e finalização

### `StandingsResponse`

```ts
export interface StandingsResponse {
  phaseId: string;
  groups: GroupStandings[];   // 1 entrada em ROUND_ROBIN/KNOCKOUT; N em GROUPS
}

export interface GroupStandings {
  groupId: string | null;     // null se phase não é GROUPS
  groupName: string | null;
  rows: StandingRow[];
}

export interface StandingRow {
  position: number;           // 1-indexed
  teamId: string;
  teamName: string;
  shortName: string | null;
  badgeUrl: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
```

### `GET /api/tournaments/{tid}/phases/{pid}/standings` → 200 `StandingsResponse`

Calculado **on-demand** a partir dos matches `COMPLETED` da phase, aplicando `winPoints`/`drawPoints`/`lossPoints` do settings e ordenando pelos `tiebreakCriteria` do torneio (na ordem definida). `HEAD_TO_HEAD` aplica-se dentro do grupo apenas (não entre grupos).

Matches `SCHEDULED` ou `CANCELLED` não contam.

### `POST /api/tournaments/{tid}/phases/{pid}/finalize` → 200 `StandingsResponse`

Owner-only. Processa as zones da phase e materializa os times classificados como `PhaseTeam` na `nextPhase` apontada por cada zone.

**Pré-condições** (todos retornam **409**):
- Todos os matches resolvidos (`COMPLETED` ou `CANCELLED`, sem `SCHEDULED`): `Phase has N unfinished matches`.
- Pelo menos 1 match: `Phase has no matches to finalize`.
- `nextPhase` da zone não pode já ter times: `Next phase 'X' already has teams; cannot finalize` (idempotência).

**Processamento**:
- Zonas em ordem de `position`.
- `selectionMode = ALL`: pega times nas posições `[fromPosition, toPosition]` de cada grupo e cria `PhaseTeam` no `nextPhase`.
- `selectionMode = BEST_RANKED`: junta os times da posição `fromPosition` de **todos os grupos**, ranqueia (pontos → vitórias → saldo → gols pró → menos derrotas → nome) e leva os top `bestRankedCount`.
- Zone com `nextPhase = null` → times daquela faixa caem no vácuo.

---

## 17. Palpites (`/api/tournaments/{tid}/matches/{mid}/predictions` + variantes)

### `PredictionResponse`

```ts
export interface PredictionResponse {
  id: string;                 // UUID público
  matchId: string;
  userId: string;
  userName: string;
  homeScore: number;
  awayScore: number;
  points: number;             // recomputado quando o resultado do match muda
  createdAt: string;
  updatedAt: string;
}
```

### `PUT /api/tournaments/{tid}/matches/{mid}/predictions/me` → 200

**Upsert**: se o usuário ainda não tem palpite no match, cria; senão atualiza.

```ts
export interface PlacePredictionRequest {
  homeScore: number;          // ≥ 0
  awayScore: number;          // ≥ 0
}
```

Validações (todos 409 exceto onde indicado):
- `Predictions are only accepted while tournament is IN_PROGRESS` — torneio fora de IN_PROGRESS.
- `Match is cancelled`
- `Match has no scheduled time`
- `Predictions are locked for this match` — `now >= scheduledAt`.
- **403** `You are not an active member of this tournament`

### `DELETE /api/tournaments/{tid}/matches/{mid}/predictions/me` → 204

Remove meu palpite. Bloqueado após a deadline.

### `GET /api/tournaments/{tid}/matches/{mid}/predictions` → 200 `PredictionResponse[]`

Lista todos os palpites do match.

**Visibilidade**:
- Owner do torneio: sempre vê.
- Member ACTIVE: só vê depois que `now >= match.scheduledAt`. Antes disso → **409** `Predictions become visible only after the match deadline`.

### `GET /api/tournaments/{tid}/predictions/me` → 200 `PredictionResponse[]`

Meus palpites no torneio inteiro. Acessível pra qualquer member ACTIVE (incluindo owner).

---

## 18. Ranking

### `RankingRowResponse`

```ts
export interface RankingRowResponse {
  position: number;           // 1-indexed
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalPoints: number;
  exactScoreHits: number;     // palpites com placar exato em matches COMPLETED
  winnerHits: number;         // acertou só o vencedor
  wrongs: number;             // errou completamente
  totalPredictions: number;   // total de palpites do user no torneio
}
```

### `GET /api/tournaments/{tid}/ranking` → 200 `RankingRowResponse[]`

Calculado on-demand. Ordenado por `totalPoints` desc → `exactScoreHits` desc → `winnerHits` desc → `wrongs` asc → nome asc.

Sem paginação por enquanto — array completo. Qualquer usuário autenticado pode chamar.

---

## 19. Sistema de pontuação dos palpites

Vinda do `TournamentSettings` do torneio:

- **Placar exato** (`exactScorePoints`, default 5): `predictionHome == actualHome && predictionAway == actualAway`.
- **Acerto de vencedor / empate** (`winnerPoints`, default 2): erra o placar mas acerta quem ganhou (ou que empatou). Comparação via `Math.sign(home - away)`.
- **Erro completo** (`wrongPoints`, default 0): desfecho diferente.

Match `CANCELLED` zera os pontos dos palpites associados. Match `SCHEDULED` mantém `points = 0` (não foi avaliado ainda).

---

## 20. Fluxos típicos pro frontend

### Cadastro e login

1. `POST /api/auth/signup` ou `/signin` → guarda tokens.
2. Interceptor de request injeta `Authorization: Bearer <accessToken>`.
3. Interceptor de resposta: 401 → tenta `/refresh`; se falhar → logout.

### Criar e configurar torneio

1. `POST /api/tournaments` (status nasce DRAFT).
2. Vincula times próprios: `POST /api/tournaments/{id}/teams/{teamId}` para cada um.
3. Cria phases: `POST /api/tournaments/{id}/phases` na ordem desejada. A 1ª (position 0) já recebe os times automaticamente.
4. Em phase GROUPS: cria grupos via `POST /api/tournaments/{tid}/phases/{pid}/groups`, depois distribui times (manualmente via `PUT teams/{teamId}` com `groupId`, ou via `POST teams/draw`).
5. Cria zones (`POST /api/tournaments/{tid}/phases/{pid}/zones`) configurando avanço entre phases.
6. Avança status: `POST /api/tournaments/{id}/status` com `{ targetStatus: "OPEN" }`.
7. Compartilha `inviteCode` com participantes — `POST /api/tournaments/join`.
8. Quando estiver pronto pra começar: `POST /api/tournaments/{id}/status` com `{ targetStatus: "IN_PROGRESS" }`.

### Geração de partidas

Em phase com `matchGenerationMode = AUTOMATIC`, chama `POST /api/tournaments/{tid}/phases/{pid}/matches/generate` (geralmente quando torneio está em OPEN ou IN_PROGRESS).

Em `MANUAL`, o admin cria cada partida via `POST .../matches`.

### Fluxo de palpite (usuário comum)

1. Usuário acessa torneio onde é member ACTIVE.
2. Lista matches: `GET /api/tournaments/{tid}/phases/{pid}/matches` (vai precisar iterar todas as phases do torneio).
3. Pra cada match com `scheduledAt > now` e `status = SCHEDULED`, mostra formulário de palpite.
4. `PUT /api/tournaments/{tid}/matches/{mid}/predictions/me` salva o palpite. Same endpoint pra editar.
5. Após o deadline (`now >= scheduledAt`), exibe palpites de todos via `GET .../predictions`.
6. `GET /api/tournaments/{tid}/ranking` para mostrar a tabela de pontuação.

### Fluxo de lançar resultado (admin)

1. Match em `SCHEDULED` com `scheduledAt < now` (ou seja, deadline passou).
2. Owner abre a tela de lançar resultado.
3. `PUT /api/tournaments/{tid}/phases/{pid}/matches/{mid}/result` com `{ homeScore, awayScore }`.
4. Backend automaticamente recalcula pontos dos palpites.
5. Standings (`GET .../standings`) e ranking (`GET .../ranking`) refletem os novos pontos.
6. Owner pode editar o resultado a qualquer momento enquanto torneio está IN_PROGRESS — dispara recálculo de novo.

### Avançar entre phases

Quando todos os matches de uma phase estiverem resolvidos:

1. Owner chama `POST /api/tournaments/{tid}/phases/{pid}/finalize`.
2. Sistema processa as zones e popula `PhaseTeam` da próxima phase com os classificados.
3. Owner pode então gerar matches da próxima phase (`POST .../matches/generate`) ou criar manualmente.

### Encerrar torneio

`POST /api/tournaments/{id}/status` com `{ targetStatus: "FINISHED" }`. A partir daí, tudo fica read-only (não dá mais pra lançar resultado, palpitar, mudar nada).

---

## 21. Convenções e dicas

- **IDs em path params são sempre o UUID público** (`publicId`), nunca o `id` interno (Long).
- **Timestamps** sempre em UTC ISO 8601 com sufixo `Z`. Não há offset local.
- **Cores** sempre `#RRGGBB` em maiúscula ou minúscula — backend valida com regex.
- **Body de erros** sempre o mesmo `ApiError`. Tratar centralizado vale a pena.
- **Erros 409** muitas vezes têm mensagem técnica em inglês — vale criar um mapa de mensagem → texto amigável em pt-BR no frontend, ou exibir direto da API quando o public-facing.
- **Quando der 404** numa rota que envolve owner-context (ex.: GET `/api/teams/{id}` de um time alheio), é proposital — não vaza existência de recursos de outros usuários.
- **Spring `Page<>`**: o `pageable` interno traz mais info do que costuma ser usado; geralmente bastam `content`, `totalElements` e `totalPages` no front.
- **Refresh token** não fica em URL — sempre no body do `POST /api/auth/refresh`.
- **`Authorization` header não é necessário no `/signup`, `/signin`, `/refresh`** — qualquer cliente pode chamar. Para todo o resto, é obrigatório.
