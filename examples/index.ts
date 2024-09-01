import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import rekt from './data/route';
import actions from './actions-spec';
const app = new OpenAPIHono();

app.use(
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization', 'Accept-Encoding'],
    allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  })
);

// <--Actions-->
app.route('/api/rekt/', rekt);
app.route('/',actions);
app.doc('/doc', {
  info: {
    title: 'An API',
    version: 'v1',
  },
  openapi: '3.1.0',
});

app.get(
  '/swagger-ui',
  swaggerUI({
    url: '/doc',
  })
);

export default {
  fetch: app.fetch,
};
