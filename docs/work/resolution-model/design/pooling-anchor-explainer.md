# Pooling-Anchor-Explainer: skip + servedBy im pooling-anchor-Capture

Status: source-verified Grundtext (2026-08-21). Ersetzt die
pooling-anchor skip/anchor-Erklärung aus der 7.10-Session (Task-8-Log,
Open Issues) — deren `cached`-Deutung war falsch und ist hier korrigiert.
Konsumenten: Task 10 (Diagnostics-Findings) und Task 8.6
(Registration-Tooltips / Begriffstabelle). UI-Wortlaute, die hieraus
entstehen, bleiben englisch und folgen den etablierten Wording-Verträgen
(registry-evidence-only Action-Notes, capture-relative Phrasierung).

Quellenstand (lokale read-only Checkouts unter `/home/lutz/projects/nf/`,
GitHub-Org `native-federation`):

| Repo | Stand | Rolle |
|---|---|---|
| `orchestrator` | Tag v4.6.0 (`8e5e0b3`) | Runtime: Versionswahl, Pooling, Import-Map |
| `native-federation-core` | Tag v4.4.0 | Build: `pool`-Config, remoteEntry.json |
| `playground` | `acdd0dd` ("add pooling-anchor evidence scenario") | Szenario-Configs des Captures |

Der Capture selbst ist im Repo festgehalten:
`projects/devtools-bridge/src/lib/fixtures/pooling-anchor.fixture.ts`
(Header nennt orchestrator v4.6.0 / `8e5e0b3` als Erzeuger). Jede
Behauptung unten wurde am zitierten Stand gegengelesen; die eine
Korrektur gegenüber dem eingereichten Text ist markiert
(Anchor-Tiebreak, vollständige Reihenfolge).

## Der genaue Ablauf

Die Konfiguration erzeugt dieses Portfolio:

| Build | Main | `/extra` | Pool-Tag |
|---|---:|---:|---|
| Host | 2.0.0 | – | – |
| mfe1 | 1.0.0 | 1.0.0 | `family` |
| mfe2 | 1.0.0 | 1.0.0 | – |

Das steht in den Playground-Configs
(`playground@acdd0dd scenarios/pooling-anchor/configs/`):
`host.federation.config.mjs` (2.0.0, bewusst ohne Pool und ohne
Secondary), `mfe1.federation.config.mjs` (1.0.0-Familie, als einziger
mit `pool: 'family'` auf beiden Deklarationen),
`mfe2.federation.config.mjs` (dieselbe 1.0.0-Familie, bewusst ohne
Pool-Tag — beweist, dass ungetaggte Deklarationen einem fremd
gebildeten Pool unterliegen).

### 1. Normale Versionswahl

Der Resolver verarbeitet zunächst jedes External unabhängig:

```text
@nf-lab/conflict-lib
  2.0.0 Host  -> share
  1.0.0 MFEs  -> skip

@nf-lab/conflict-lib/extra
  1.0.0 mfe1/mfe2 -> share
```

Der Host gewinnt Main zwingend durch Host-Priorität. Da `2.0.0` in der
von beiden MFEs angegebenen Range `>=1.0.0 <3.0.0` liegt, wird deren
1.0.0 zunächst `skip`. Genau diese Zuweisung macht
`orchestrator@v4.6.0 src/lib/core/2.app/steps/apply-winner.ts`
(`createApplyWinner`, L48).

Bis hierhin hieße `skip` tatsächlich: „Diese Version wird nicht als
Default veröffentlicht; verwende die gewählte Share-Version."

### 2. Pooling läuft nach dieser Wahl

Die Pipeline ist explizit
(`orchestrator@v4.6.0 src/lib/core/2.app/flows/init.flow.ts` L15–17):

```text
determineSharedExternals
        ↓
poolSharedExternals
        ↓
generateImportMap
```

Ohne Pooling wäre die globale Kombination:

```text
Main   2.0.0 aus Host
Extra  1.0.0 aus mfe1
```

Diesen Mix hat aber kein einzelner Build ausgeliefert:

- Der Host hat Main 2.0.0, aber kein `/extra`.
- `mfe1` und `mfe2` haben Main plus `/extra`, aber beide auf 1.0.0.

Das ist genau die Inkohärenz, die Pooling verhindern soll: Eine
gekoppelte Familie darf nicht aus Builds zusammengesetzt werden, die
diese Kombination nie gemeinsam gebaut haben.

### 3. Warum ist `mfe1` der Anchor?

Für `mfe1` und `mfe2` scheitert der „Witness"-Test: Kein Build enthält
Main 2.0.0 plus Extra 1.0.0.

Danach sucht der Orchestrator pro Consumer einen Build, der alle
deklarierten Mitglieder und Entry-Points in akzeptierten Versionen
liefern kann (`assignServingBuilds`,
`orchestrator@v4.6.0 src/lib/core/2.app/steps/pooling/pool-shared-externals.ts`
L399; der `servedBy`-Write bei L543):

- Host: nein, `/extra` fehlt.
- mfe1: ja, Main 1.0.0 plus Extra 1.0.0.
- mfe2: ebenfalls ja.

Der Anchor-Tiebreak ist vollständig: **Host → meiste vollständig
gedeckte Consumer → Ankunftsreihenfolge → Name**
(`orchestrator@v4.6.0 src/lib/core/2.app/steps/pooling/anchoring.ts`,
Doku-Kommentar L180–181, `assignAnchors` L185). Im Szenario sind mfe1
und mfe2 beide Nicht-Hosts mit voller Deckung — der Gleichstand fällt
auf die Ankunftsreihenfolge; `mfe1` kommt laut Manifest zuerst und wird
Anchor.

Wichtig: Pooling zählt hier die in `remoteEntry.json` deklarierten
Externals. Durch `includeSecondaries: { keepAll: true }` deklarieren die
MFEs auch `/extra`, selbst wenn der konkrete Component-Code es nicht
direkt importiert.

### 4. Warum bleibt die Action trotzdem `skip`?

Pooling wählt keine neue Share-Version. Es lässt die Basisentscheidung
bestehen:

```text
Main 2.0.0 bleibt der globale share-Winner.
Main 1.0.0 bleibt die skip-Registration.
```

Pooling ergänzt stattdessen pro Consumer das Routing-Metadatum:

```text
mfe1, Main 1.0.0: servedBy = "mfe1"
mfe2, Main 1.0.0: servedBy = "mfe1"
```

(`pool-shared-externals.ts` L543: `entry.meta.servedBy = build`.)

Daher sind diese beiden Aussagen gleichzeitig wahr:

- `1.0.0` hat die normale Main-Share-Wahl verloren → `skip`.
- Für die kohärente Pool-Familie müssen beide MFEs trotzdem Main 1.0.0
  aus `mfe1` beziehen → `servedBy: "mfe1"`.

`skip` beschreibt also die Registration-Disposition, nicht abschließend
die effektive Browser-Auflösung.

## Die resultierende Import-Map

Der Orchestrator erzeugt daraus:

```text
imports:
  @nf-lab/conflict-lib       -> Host/Main 2.0.0
  @nf-lab/conflict-lib/extra -> mfe1/Extra 1.0.0

scopes ./mfe1/:
  @nf-lab/conflict-lib       -> mfe1/Main 1.0.0

scopes ./mfe2/:
  @nf-lab/conflict-lib       -> mfe1/Main 1.0.0
```

`generate-import-map.ts` überspringt zwar `skip` als normalen globalen
Mapping-Kandidaten, sammelt vorher aber die `servedBy`-Overrides und
schreibt sie anschließend als Consumer-Scopes (`collectServed` /
`ServedScope`,
`orchestrator@v4.6.0 src/lib/core/2.app/steps/generate-import-map.ts`
L298–310; Scopes, die `imports` nur wiederholen würden, werden
verworfen).

Darum läuft tatsächlich:

- Host mit 2.0.0.
- `mfe1` mit 1.0.0 aus `mfe1`.
- `mfe2` mit 1.0.0 aus `mfe1`.

Die Anzeige „2 resolved versions" ist deshalb korrekt. Sie bedeutet
nicht zwingend „Fehlkonfiguration", sondern zunächst: Im beobachteten
Browserzustand existieren effektive Bindings auf zwei Tags.

## Was bedeuten die Begriffe?

| Begriff | Bedeutung | Konfigurierbar? |
|---|---|---|
| `share` | Gewinner der normalen Versionswahl für dieses External und diesen Share-Scope | Nein, abgeleitet |
| `skip` | Diese Version wird nicht als Default-Share-Version veröffentlicht | Nein, abgeleitet |
| `pool` | Vom Build publizierter Tag, der gekoppelte Externals zu einem Pool-Graph verbindet | Ja |
| `family` | Hier nur der frei gewählte Wert von `pool`; kein reserviertes NF-Schlüsselwort | Ja, beliebiger Name |
| `servedBy` | Der Build, aus dem diese konkrete Remote-Deklaration effektiv bedient werden soll | Nein, Runtime-Ergebnis |
| Anchor | Der von Pooling ausgewählte, vollständig deckende Build | Nein, Algorithmusbegriff |
| `anchored` | Devtools-Zustand: `servedBy` ist vorhanden und die beobachtete Import-Map zeigt tatsächlich auf dessen Kandidaten | Nein, Devtools-Ableitung |
| `cached` | Diese konkrete Quelle wurde in einer erzeugten/committeten Import-Map veröffentlicht | Nein, Runtime-Zustand |
| `shareScope` | Separater Namensraum für die normale Versionswahl | Ja |

`pool` und `shareScope` sind also nicht dasselbe:

- `shareScope` isoliert Versionswahlen.
- `pool` koordiniert gekoppelte Externals innerhalb eines solchen
  Scopes (Pooling läuft pro Share-Scope).
- Ein Pool überspannt keine Share-Scopes.
- Der spezielle `strict`-Share-Scope wird nicht gepoolt
  (`orchestrator@v4.6.0 src/lib/core/2.app/steps/pooling/pool.util.ts`
  L39: `scopeType(scope) !== 'strict'`).

### Warum ist `servedBy: "mfe1"` auch bei `mfe1` selbst gesetzt?

Das ist ein Self-Anchor. Für Main ist der globale Basis-Build der Host.
Damit `mfe1` trotzdem seine eigene kohärente 1.0.0-Familie ausführt,
braucht auch `mfe1` einen Scope-Override auf sich selbst.

Für `/extra` fehlt `servedBy`, weil dessen globale Basis ohnehin bereits
`mfe1` ist. Dort wäre der Override redundant.

### Was bedeutet `cached` hier wirklich?

**Korrektur gegenüber der 7.10-Session-Erklärung:** `cached: true` ist
in diesem Capture nicht die Ursache der 1.0.0-Verwendung. Die 1.0.0
wird durch die nachgelagerte Pooling-Entscheidung verwendet; `cached`
wird anschließend beim Erzeugen der Import-Map auf dem tatsächlich
publizierten Source-Metadatensatz gesetzt
(`orchestrator@v4.6.0 src/lib/core/2.app/steps/generate-import-map.ts`
L134, L139, L167) und ist damit hier überwiegend Wirkung, nicht
Auslöser.

Deshalb:

- `mfe1` Main: `cached: true`, weil die Scopes auf seine Datei zeigen.
- `mfe2` Main: `cached: false`, weil seine eigene Datei nicht verwendet
  wird.
- Host Main: `cached: true`, weil die globale Map darauf zeigt.

Es bedeutet nicht zwingend „bereits heruntergeladen oder ausgeführt"
und beweist hier keinen früheren Bootstrap. Bei späteren Re-Elections
bekommt eine bereits committete Quelle allerdings Basis-Priorität.

## Wie konfiguriert man Pooling?

Explizites Pooling erfolgt buildseitig im `shared`-Eintrag:

```js
shared: share({
  '@nf-lab/conflict-lib': {
    singleton: true,
    strictVersion: false,
    requiredVersion: '>=1.0.0 <3.0.0',
    includeSecondaries: { keepAll: true },
    pool: 'family',
  },
}),
```

`pool` ist Teil des öffentlichen `ExternalConfig` und wird bis ins
`remoteEntry.json` weitergereicht
(`native-federation-core@v4.4.0
src/lib/domain/config/external-config.contract.ts` L12; normalisiert
L29).

Dabei gilt:

- Pooling betrifft Shared Externals, praktisch also `singleton: true`.
- Ein expliziter Pool-Tag reicht aus; `useAutoExternalPooling` muss
  dafür nicht aktiviert sein (`pool.util.ts` L39: getaggte Scopes sind
  auch ohne das Feature poolbar).
- Ein einzelner Tag ohne zweites Pool-Mitglied bewirkt nichts und
  erzeugt eine Warnung
  (`orchestrator@v4.6.0 src/lib/core/2.app/steps/pooling/pool-graph.ts`
  L99–100 Doku, Warn-Ausgabe L159; Auto-Scope-Singletons bleiben
  bewusst still).
- Derselbe String ist keine globale Pool-ID. Pool-Identität entsteht
  als zusammenhängende Komponente aus den von jeweils einem Remote
  gemeinsam getaggten Mitgliedern (`pool-graph.ts` L92:
  „pool = connected component", Disjoint-Set-Union).
- Ein Remote kann durch seine Tags einen Pool bilden, dem anschließend
  auch ungetaggte Deklarationen anderer Remotes unterliegen. Genau das
  passiert bei `mfe2`.
- Bei expliziten Tags sollte ein Remote alle wirklich gekoppelten
  Mitglieder taggen.

Alternativ kann man im Host Auto-Pooling aktivieren:

```ts
await initFederation(manifest, {
  feature: {
    useAutoExternalPooling: true,
  },
});
```

Dann werden scoped Packages pro Remote nach npm-Scope verbunden
(`pool-graph.ts` L73–74, `autoScope` über das `@scope/`-Muster), etwa
`@angular/core`, `@angular/common` und `@angular/router`. Unscoped
Paare wie `react`/`react-dom` werden nicht automatisch erkannt; dafür
braucht man explizite gemeinsame Pool-Tags.

`servedBy`, `anchor` und `anchored` konfiguriert man nicht. Das sind
Ergebnis beziehungsweise evidenzbasierte Darstellung.

## Einordnung der Devtools-Anzeige

Die Anzeige ist bewusst zweidimensional:

- `skip-registration` kommt aus der Registry-Action der Source 1.0.0.
- `explicit anchor`/`anchored` kommt aus `servedBy` plus der
  beobachteten Import-Map.

Die Devtools nennen eine Deklaration nur dann `anchored`, wenn das
`servedBy`-Ziel tatsächlich mit einem beobachteten Target übereinstimmt
(normative Mapping-State-Präzedenz `anchored → self-filled →
own-selected → fallback → not-selected → blocked → unknown`,
`projects/devtools-ui/src/app/shared/store/resolution/derive-declaration-claims.ts`
`sharedMappingState`, ~L340).

Kurz gesagt: Der Host gewinnt die Versionswahl, aber Pooling gewinnt
anschließend die Provenienzentscheidung für die MFEs. Deshalb ist Main
1.0.0 gleichzeitig `skip` und effektiv benutzt. Pooling optimiert dabei
nicht primär Downloads, sondern garantiert eine Familie, die wirklich
gemeinsam von einem Build ausgeliefert wurde.
