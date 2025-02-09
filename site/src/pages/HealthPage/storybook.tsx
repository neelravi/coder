import { useQueryClient } from "react-query";
import {
  reactRouterParameters,
  reactRouterOutlet,
  RouteDefinition,
} from "storybook-addon-react-router-v6";
import {
  MockBuildInfo,
  MockEntitlements,
  MockExperiments,
  MockHealth,
  MockHealthSettings,
} from "testHelpers/entities";
import { Meta } from "@storybook/react";
import { HEALTH_QUERY_KEY, HEALTH_QUERY_SETTINGS_KEY } from "api/queries/debug";
import { DashboardProvider } from "components/Dashboard/DashboardProvider";
import { HealthLayout } from "./HealthLayout";

type MetaOptions = {
  element: RouteDefinition;
  path: string;
  params?: Record<string, string>;
};

export const generateMeta = ({ element, path, params }: MetaOptions): Meta => {
  return {
    render: HealthLayout,
    parameters: {
      layout: "fullscreen",
      reactRouter: reactRouterParameters({
        location: { pathParams: params },
        routing: reactRouterOutlet({ path }, element),
      }),
    },
    decorators: [
      (Story) => {
        const queryClient = useQueryClient();
        queryClient.setQueryData(HEALTH_QUERY_KEY, MockHealth);
        queryClient.setQueryData(HEALTH_QUERY_SETTINGS_KEY, MockHealthSettings);
        return <Story />;
      },
      (Story) => {
        const queryClient = useQueryClient();
        queryClient.setQueryData(["buildInfo"], MockBuildInfo);
        queryClient.setQueryData(["entitlements"], MockEntitlements);
        queryClient.setQueryData(["experiments"], MockExperiments);
        queryClient.setQueryData(["appearance"], MockExperiments);

        return (
          <DashboardProvider>
            <Story />
          </DashboardProvider>
        );
      },
    ],
  };
};
