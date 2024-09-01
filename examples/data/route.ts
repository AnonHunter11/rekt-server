import {
  actionSpecOpenApiPostRequestBody,
  actionsSpecOpenApiGetResponse,
  actionsSpecOpenApiPostResponse,
} from '../openapi';
import { ActionError, ActionGetResponse, ActionPostRequest, ActionPostResponse } from '@solana/actions';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {buildTransaction, getIcon, processCollections} from './utils';
const app = new OpenAPIHono();

app.openapi(createRoute({
    method: 'get',
    path: '/',
    tags: ['REKT for nfts'],
    responses: actionsSpecOpenApiGetResponse,
  }), async (c) => {
    return c.json(
        {
          type: 'action',
          icon: "https://i.imgur.com/Wc5MO5f.png",
          label: `REKT`,
          links: {
            actions: [
              {
                href: `/api/rekt/`,
                label: 'Calculate your Rekt (0.01 SOL)',
                parameters: [
                ]
              },
            ]
          },
          title: 'REKT',
          description: 'Find out your Rekt',
        } satisfies ActionGetResponse,{status:200})
  });


  app.openapi(createRoute({
    method: 'post',
    path: '/',
    tags: ['REKT'],
    
    body: actionSpecOpenApiPostRequestBody,
    responses: actionsSpecOpenApiPostResponse,
  }), async (c) => {
    try{
        const { account } = (await c.req.json()) as ActionPostRequest;
        let data = await processCollections(account);
        const transaction = await buildTransaction(account);
        const response: ActionPostResponse = {
            transaction,
            links:{
                next: {
                    type: 'inline',
                    action: {
                        type: 'completed',
                        title: 'REKT',
                        label: 'REKT',
                        description: `Wow, I hope you will recover from this.`,
                        icon: getIcon(data),
                    }
                }
            }
        };
        return c.json(response, { status: 200 });
    }
    catch(e){
        console.error(
            `Failed to send transaction`,
            e,
        );
          return c.json(
            {
              message: `Failed to prepare transaction`+ e ,
            } satisfies ActionError,
            {
              status: 500,
            },
        );
    }
  });


  export default app;

