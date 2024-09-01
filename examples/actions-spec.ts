import { OpenAPIHono } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { actionsSpecOpenApiGetResponse } from './openapi';
import { Context, Env, TypedResponse } from 'hono';
const app = new OpenAPIHono();

app.openapi(createRoute({
    method: 'get',
    path: '/actions.json',
    responses: actionsSpecOpenApiGetResponse,
  }), async (c) => {
    return c.json({
        rules:[
            {
                "pathPattern":"/api/rekt/",
                "apiPath":"/api/rekt/",
            }
            
        ]
    }, 
    200)
  });



app.openapi(createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'text/html': {
          schema: {
            type: 'string'
          }
        }
      }
    }
  }}),
  (c: Context<Env, "/", {}>) => {
    return c.html('<h1>Hello World</h1>') as unknown as TypedResponse<{}, 200, string>;
  }
);

export default app;