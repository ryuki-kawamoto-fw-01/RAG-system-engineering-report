import { NextResponse } from 'next/server';

function getPiiApiUrl(): string {
  const url = process.env.ORCHESTRATOR_PII_API_URL;
  if (!url) {
    throw new Error('ORCHESTRATOR_PII_API_URL is not set');
  }
  return url;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body.input;

    // PII認識を実行
    const piiResponse = await fetch(getPiiApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: userMessage }),
    });

    if (!piiResponse.ok) {
      const errorText = await piiResponse.text();
      console.error(`PII API request failed with status ${piiResponse.status}: ${errorText}`);
      throw new Error(`PII API request failed with status ${piiResponse.status}: ${errorText}`);
    }

    const responseData = await piiResponse.json();

    const piiBool = responseData.pii_bool;
    const piiList = responseData.pii_list;

    return NextResponse.json({ piiBool, piiList });
  } catch (error) {
    console.error(
      'Error during PII check:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      {
        error: 'PII check failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
