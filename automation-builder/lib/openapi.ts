export const agentBuilderOpenApi = {
  openapi: "3.0.0",
  info: {
    title: "Entrestate Agent Builder API",
    version: "0.1.0",
  },
  paths: {
    "/api/automation-builder/templates": {
      get: {
        summary: "List agent templates",
        responses: {
          "200": { description: "OK" },
        },
      },
    },
    "/api/automation-builder/templates/{id}": {
      get: {
        summary: "Get a template by id",
        parameters: [{ name: "id", in: "path", required: true }],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
    },
    "/api/automation-builder/agents": {
      get: { summary: "List agents", responses: { "200": { description: "OK" } } },
      post: { summary: "Create agent", responses: { "201": { description: "Created" } } },
    },
    "/api/automation-builder/agents/{id}": {
      get: { summary: "Get agent", responses: { "200": { description: "OK" } } },
      put: { summary: "Update agent", responses: { "200": { description: "OK" } } },
      delete: { summary: "Delete agent", responses: { "200": { description: "OK" } } },
    },
    "/api/automation-builder/agents/{id}/clone": {
      post: { summary: "Clone agent", responses: { "201": { description: "Created" } } },
    },
    "/api/automation-builder/agents/{id}/share": {
      post: { summary: "Share agent", responses: { "200": { description: "OK" } } },
    },
    "/api/automation-builder/agents/{id}/publish": {
      post: { summary: "Publish agent", responses: { "200": { description: "OK" } } },
    },
    "/api/automation-builder/agents/{id}/versions": {
      get: { summary: "List versions", responses: { "200": { description: "OK" } } },
      post: { summary: "Create version", responses: { "201": { description: "Created" } } },
    },
    "/api/automation-builder/runs": {
      get: { summary: "List runs", responses: { "200": { description: "OK" } } },
      post: { summary: "Create run", responses: { "201": { description: "Created" } } },
    },
    "/api/automation-builder/runs/{id}": {
      get: { summary: "Get run", responses: { "200": { description: "OK" } } },
    },
    "/api/automation-builder/runs/{id}/stream": {
      get: { summary: "Stream run via SSE", responses: { "200": { description: "OK" } } },
    },
    "/api/automation-builder/connectors": {
      get: { summary: "List connectors", responses: { "200": { description: "OK" } } },
    },
    "/api/automation-builder/connectors/test": {
      post: { summary: "Test connector", responses: { "200": { description: "OK" } } },
    },
    "/api/automation-builder/connectors/credentials": {
      get: { summary: "List credentials", responses: { "200": { description: "OK" } } },
      post: { summary: "Create credential", responses: { "201": { description: "Created" } } },
    },
    "/api/automation-builder/audit": {
      get: { summary: "List audit events", responses: { "200": { description: "OK" } } },
    },
  },
}
