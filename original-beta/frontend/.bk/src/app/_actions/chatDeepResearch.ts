import { SendDeepResearchInput } from '../_schemas/send-deep-research-chat';

const getApiUrl = (functionName: string): string => {
  const endpoint = process.env.ORCHESTRATOR_DEEP_API_ENDPOINT;
  const credential = process.env.ORCHESTRATOR_DEEP_API_CREDENTIAL;
  return `${endpoint}/${functionName}?code=${credential}`;
};

export async function getInstanceId(sendDeepResearchInput: SendDeepResearchInput): Promise<string> {
  const lastHumanMessage = sendDeepResearchInput.messages.at(-1)?.content;

  const response = await fetch(getApiUrl('startOrchestrator'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: lastHumanMessage }),
  });

  if (!response.ok) {
    throw new Error('Failed to start orchestrator');
  }
  const json: { id: string } = await response.json();
  return json.id;
}

export async function getResult(id: string): Promise<Response> {
  const response = await fetch(`${getApiUrl('getResult')}&instance_id=${id}`);
  if (!response.ok) {
    const errorResponse = await response.json();
    return new Response(JSON.stringify({ error: errorResponse.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (response.status === 202) {
    return new Response(JSON.stringify({ content: '処理中です', searchResults: [] }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const data = await response.json();
  const [content, searchResults = []] = data.result as [string, { title: string; url: string }[]];
  return new Response(JSON.stringify({ content, searchResults }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
