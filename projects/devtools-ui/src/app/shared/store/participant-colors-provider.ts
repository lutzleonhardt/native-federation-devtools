import { Provider, computed, inject } from '@angular/core';
import { NF_HOST } from 'devtools-bridge';

import { PARTICIPANT_COLOR_LOOKUP, assignParticipantColors } from '../kit/participant-colors';
import { FederationModel } from './federation-model';
import { FederationStore } from './federation-store';

/**
 * Every remote name a participant chip can render — registry remotes PLUS
 * declaration participants and consumer relations: a declared participant may
 * lack its own registry entry (the missing-remote case) yet still renders as
 * a chip, so it must both receive a color and count against the palette
 * threshold. The host registration is excluded — it never carries an identity
 * color and must not count against the threshold.
 */
function renderableRemoteNames(model: FederationModel): string[] {
  const names = new Set<string>();
  for (const remote of model.remotes) {
    names.add(remote.name);
  }
  for (const declaration of model.registryEvidence.participantDeclarations) {
    names.add(declaration.participant);
  }
  for (const relation of model.resolutionProjection.consumerRelations) {
    names.add(relation.consumerRemote);
  }
  names.delete(NF_HOST);
  return [...names];
}

/**
 * Binds the kit's participant-color token to the capture's renderable
 * participant names.
 *
 * The kit stays store-free (kit-boundary guard), so this store-side provider
 * is the single capture-backed binding: registered in app.config.ts and
 * mirrored by the view specs that pin identity dots.
 */
export function provideParticipantColors(): Provider {
  return {
    provide: PARTICIPANT_COLOR_LOOKUP,
    useFactory: () => {
      const store = inject(FederationStore);
      return computed(() => {
        const model = store.model();
        return assignParticipantColors(model === null ? [] : renderableRemoteNames(model));
      });
    },
  };
}
