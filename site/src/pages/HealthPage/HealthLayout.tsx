import { useMutation, useQuery, useQueryClient } from "react-query";
import { Loader } from "components/Loader/Loader";
import { Helmet } from "react-helmet-async";
import { pageTitle } from "utils/page";
import { createDayString } from "utils/createDayString";
import { DashboardFullPage } from "components/Dashboard/DashboardLayout";
import ReplayIcon from "@mui/icons-material/Replay";
import { health, refreshHealth } from "api/queries/debug";
import { useTheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import { NavLink, Outlet } from "react-router-dom";
import { css } from "@emotion/css";
import kebabCase from "lodash/fp/kebabCase";
import { Suspense } from "react";
import { HealthIcon } from "./Content";
import { HealthSeverity } from "api/typesGenerated";
import NotificationsOffOutlined from "@mui/icons-material/NotificationsOffOutlined";
import { useDashboard } from "components/Dashboard/DashboardProvider";

export function HealthLayout() {
  const theme = useTheme();
  const dashboard = useDashboard();
  const queryClient = useQueryClient();
  const { data: healthStatus } = useQuery({
    ...health(),
    refetchInterval: 30_000,
  });
  const { mutate: forceRefresh, isLoading: isRefreshing } = useMutation(
    refreshHealth(queryClient),
  );
  const sections = {
    derp: "DERP",
    access_url: "Access URL",
    websocket: "Websocket",
    database: "Database",
    workspace_proxy: dashboard.experiments.includes("moons")
      ? "Workspace Proxy"
      : undefined,
  } as const;
  const visibleSections = filterVisibleSections(sections);

  return (
    <>
      <Helmet>
        <title>{pageTitle("Health")}</title>
      </Helmet>

      {healthStatus ? (
        <DashboardFullPage>
          <div
            css={{
              display: "flex",
              flexBasis: 0,
              flex: 1,
              overflow: "hidden",
            }}
          >
            <div
              css={{
                width: 256,
                flexShrink: 0,
                borderRight: `1px solid ${theme.palette.divider}`,
                fontSize: 14,
              }}
            >
              <div
                css={{
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div>
                  <div
                    css={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <HealthIcon size={32} severity={healthStatus.severity} />

                    <Tooltip title="Refresh health checks">
                      <IconButton
                        size="small"
                        disabled={isRefreshing}
                        data-testid="healthcheck-refresh-button"
                        onClick={() => {
                          forceRefresh();
                        }}
                      >
                        {isRefreshing ? (
                          <CircularProgress size={16} />
                        ) : (
                          <ReplayIcon css={{ width: 20, height: 20 }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </div>
                  <div css={{ fontWeight: 500, marginTop: 16 }}>
                    {healthStatus.healthy ? "Healthy" : "Unhealthy"}
                  </div>
                  <div
                    css={{
                      color: theme.palette.text.secondary,
                      lineHeight: "150%",
                    }}
                  >
                    {healthStatus.healthy
                      ? Object.keys(visibleSections).some((key) => {
                          const section =
                            healthStatus[key as keyof typeof visibleSections];
                          return (
                            section.warnings && section.warnings.length > 0
                          );
                        })
                        ? "All systems operational, but performance might be degraded"
                        : "All systems operational"
                      : "Some issues have been detected"}
                  </div>
                </div>

                <div css={{ display: "flex", flexDirection: "column" }}>
                  <span css={{ fontWeight: 500 }}>Last check</span>
                  <span
                    css={{
                      color: theme.palette.text.secondary,
                      lineHeight: "150%",
                    }}
                  >
                    {createDayString(healthStatus.time)}
                  </span>
                </div>

                <div css={{ display: "flex", flexDirection: "column" }}>
                  <span css={{ fontWeight: 500 }}>Version</span>
                  <span
                    css={{
                      color: theme.palette.text.secondary,
                      lineHeight: "150%",
                    }}
                  >
                    {healthStatus.coder_version}
                  </span>
                </div>
              </div>

              <nav css={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {Object.keys(visibleSections)
                  .sort()
                  .map((key) => {
                    const label =
                      visibleSections[key as keyof typeof visibleSections];
                    const healthSection =
                      healthStatus[key as keyof typeof visibleSections];

                    return (
                      <NavLink
                        end
                        key={key}
                        to={`/health/${kebabCase(key)}`}
                        className={({ isActive }) =>
                          css({
                            background: isActive
                              ? theme.palette.action.hover
                              : "none",
                            pointerEvents: isActive ? "none" : "auto",
                            color: isActive
                              ? theme.palette.text.primary
                              : theme.palette.text.secondary,
                            border: "none",
                            fontSize: 14,
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            textAlign: "left",
                            height: 36,
                            padding: "0 24px",
                            cursor: "pointer",
                            textDecoration: "none",

                            "&:hover": {
                              background: theme.palette.action.hover,
                              color: theme.palette.text.primary,
                            },
                          })
                        }
                      >
                        <HealthIcon
                          size={16}
                          severity={healthSection.severity as HealthSeverity}
                        />
                        {label}
                        {healthSection.dismissed && (
                          <NotificationsOffOutlined
                            css={{
                              fontSize: 14,
                              marginLeft: "auto",
                              color: theme.palette.text.disabled,
                            }}
                          />
                        )}
                      </NavLink>
                    );
                  })}
              </nav>
            </div>

            <div css={{ overflowY: "auto", width: "100%" }}>
              <Suspense fallback={<Loader />}>
                <Outlet context={healthStatus} />
              </Suspense>
            </div>
          </div>
        </DashboardFullPage>
      ) : (
        <Loader />
      )}
    </>
  );
}

const filterVisibleSections = <T extends object>(sections: T) => {
  return Object.keys(sections).reduce(
    (visible, sectionName) => {
      const sectionValue = sections[sectionName as keyof typeof sections];

      if (!sectionValue) {
        return visible;
      }

      return {
        ...visible,
        [sectionName]: sectionValue,
      };
    },
    {} as Partial<typeof sections>,
  );
};
