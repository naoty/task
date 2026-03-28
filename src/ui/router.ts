import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { IndexRoute } from "./routes/index";

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexRoute,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute]),
});
