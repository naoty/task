import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { IndexRoute } from "./routes/index";
import { TaskDetailRoute } from "./routes/tasks/$id";

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexRoute,
});

const taskDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tasks/$id",
  component: TaskDetailRoute,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, taskDetailRoute]),
});
