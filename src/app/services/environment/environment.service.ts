import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../reducers';
import * as fromEnvironments from '../../reducers/environments';
import * as fromHeaders from '../../reducers/headers/headers';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {

  environmentsState: fromEnvironments.State;

  constructor(
    private store: Store<fromRoot.State>
  ) {
    this.store.subscribe(data => {
      this.environmentsState = data.environments;
    });
  }

  getActiveEnvironment(): any {
    let baseEnvironment = {};
    let subEnvironment = {};

    try {
      baseEnvironment = JSON.parse(this.environmentsState.base.variablesJson);
    } catch (ex) {}

    if (this.environmentsState.activeSubEnvironment) {
      const activeSubEnvState = this.environmentsState.subEnvironments.find(env => {
        return env.id === this.environmentsState.activeSubEnvironment;
      });

      if (activeSubEnvState) {
        try {
          subEnvironment = JSON.parse(activeSubEnvState.variablesJson);
        } catch (ex) {}
      }
    }

    return { ...baseEnvironment, ...subEnvironment };
  }

  /**
   * Update all variables in content with values from the environment variables.
   * Variables are written with double curly braces .e.g. {{ VARIABLE_ONE }}
   * @param content {string}
   */
  hydrate(content: string): string {

    if (!content) {
      return content;
    }

    const activeEnvironment = this.getActiveEnvironment();

    return content.replace(/{{\s*[\w\.]+\s*}}/g, (match) => {
      const variable = match.match(/[\w\.]+/)[0];

      return activeEnvironment[variable];
    });
  }

  hydrateHeaders(headers: fromHeaders.Header[]): fromHeaders.Header[] {
    const hydratedHeaders = headers.map(header => {
      return {
        key: this.hydrate(header.key),
        value: this.hydrate(header.value),
      };
    });

    const environmentHeadersMap = this.getActiveEnvironment().headers;

    if (environmentHeadersMap) {
      const environmentHeaders = Object.keys(environmentHeadersMap).map(key => {
        return {
          key,
          value: environmentHeadersMap[key],
        }
      });

      return [ ...environmentHeaders, ...hydratedHeaders ];
    }

    return hydratedHeaders;
  }
}
