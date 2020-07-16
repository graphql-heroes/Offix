import { createClient, defaultExchanges, subscriptionExchange, Client as URQLClient } from "urql";
import { SubscriptionClient, ClientOptions } from "subscriptions-transport-ws";
import { NetworkStatus } from "../../utils/NetworkStatus";

export interface GraphQLClientConfig {
  /**
   * GraphQl client endpoint url
   */
  url: string;

  /**
   * GraphQL client websocket url
   */
  wsUrl?: string;

  /**
   * Subscription client options
   */
  wsConfig?: ClientOptions;
}

const defaultWsConfig: ClientOptions = {
  reconnect: true,
  lazy: false,
  reconnectionAttempts: 10000000,
  inactivityTimeout: 100,
  // TODO hook into reconnect to reinitialize work
  connectionCallback: undefined
};

export function createGraphQLClient(clientConfig: GraphQLClientConfig): { gqlClient: URQLClient; networkStatus: NetworkStatus | undefined} {
  const { wsUrl, wsConfig, ...config } = clientConfig;
  if (!wsUrl) {
    return {
      gqlClient: createClient(config),
      networkStatus: undefined
    };
  }

  const subscriptionClient = new SubscriptionClient(wsUrl, {
    ...defaultWsConfig,
    ...wsConfig
  });

  const exchanges = [
    ...defaultExchanges,
    subscriptionExchange({
      forwardSubscription: operation => {
        return subscriptionClient.request(operation);
      }
    })
  ];

  return {
    gqlClient: createClient({ ...config, url: config.url, exchanges }),
    networkStatus: new NetworkStatus(subscriptionClient)
  };
}

