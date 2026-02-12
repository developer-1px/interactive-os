import { createFileRoute } from "@tanstack/react-router";
import TodoHeadlessPlaygroundPage from "../../pages/playground/TodoHeadlessPlaygroundPage";

export const Route = createFileRoute("/_minimal/playground/headless")({
    component: TodoHeadlessPlaygroundPage,
});
