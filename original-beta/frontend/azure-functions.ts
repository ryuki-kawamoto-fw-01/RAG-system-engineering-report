class AzureFunctionsClient {
  private endpoint: string | undefined;
  private credential: string | undefined;
  private endpointEnvName: string;
  private credentialEnvName: string;

  constructor(endpointEnvName: string, credentialEnvName: string) {
    this.endpointEnvName = endpointEnvName;
    this.credentialEnvName = credentialEnvName;
    this.endpoint = process.env[endpointEnvName];
    this.credential = process.env[credentialEnvName];
  }

  private getApiUrl(functionName: string): string {
    if (!this.endpoint) {
      throw new Error(`環境変数${this.endpointEnvName}を確認してください`);
    }
    if (!this.credential) {
      throw new Error(`環境変数${this.credentialEnvName}を確認してください`);
    }
    return `${this.endpoint}/${functionName}?code=${this.credential}`;
  }

  public async sendJson<FReq, FRes>(
    functionName: string,
    method: string,
    body?: FReq
  ): Promise<FRes> {
    const apiUrl = this.getApiUrl(functionName);
    const response = await fetch(apiUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // レスポンスのContent-Typeを確認
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error(`Expected JSON response but got: ${contentType}`);
    }

    const data = await response.json();
    if (!response.ok) {
      // バックエンドからのエラーメッセージを直接使用
      const errorMessage = data.message || data.error_message || JSON.stringify(data);
      throw new Error(errorMessage);
    }
    return data;
  }

  public async sendJsonWithStatus<FReq, FRes>(
    functionName: string,
    method: string,
    body: FReq
  ): Promise<{ data: FRes; statusCode: number }> {
    const apiUrl = this.getApiUrl(functionName);
    const response = await fetch(apiUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      // バックエンドからのエラーメッセージを直接使用
      const errorMessage = data.message || data.error_message || JSON.stringify(data);
      throw new Error(errorMessage);
    }
    return {
      data,
      statusCode: response.status,
    };
  }

  public async sendForm<FRes>(functionName: string, formData: FormData): Promise<FRes> {
    const apiUrl = this.getApiUrl(functionName);
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (response.ok) {
      return data;
    }
    // バックエンドからのエラーメッセージを直接使用
    const errorMessage = data.message || data.error_message || JSON.stringify(data);
    throw new Error(errorMessage);
  }
}

// AzureFunctionsClientに"環境変数名"を渡すと、内部で process.env から値を取得します
export const documentRegisterAzureFunctions = new AzureFunctionsClient(
  'ORCHESTRATOR_DOCUMENT_API_ENDPOINT',
  'ORCHESTRATOR_DOCUMENT_API_CREDENTIAL'
);

export const standardRegisterAzureFunctions = new AzureFunctionsClient(
  'ORCHESTRATOR_STANDARD_API_ENDPOINT',
  'ORCHESTRATOR_STANDARD_API_CREDENTIAL'
);

export const chatFileManageAzureFunctions = new AzureFunctionsClient(
  'ORCHESTRATOR_FILE_API_ENDPOINT',
  'ORCHESTRATOR_FILE_API_CREDENTIAL'
);

export const useCaseAzureFunctions = new AzureFunctionsClient(
  'ORCHESTRATOR_USE_CASE_API_ENDPOINT',
  'ORCHESTRATOR_USE_CASE_API_CREDENTIAL'
);

export const ItAzureFunctions = new AzureFunctionsClient(
  'ORCHESTRATOR_IT_API_ENDPOINT',
  'ORCHESTRATOR_IT_API_CREDENTIAL'
);

export const AgentAzureFunctions = new AzureFunctionsClient(
  'ORCHESTRATOR_AGENT_API_ENDPOINT',
  'ORCHESTRATOR_AGENT_API_CREDENTIAL'
);

export const mfgAzureFunctions = new AzureFunctionsClient(
  'ORCHESTRATOR_MFG_API_ENDPOINT',
  'ORCHESTRATOR_MFG_API_CREDENTIAL'
);

export const manualAzureFunctions = new AzureFunctionsClient(
  'ORCHESTRATOR_MANUAL_API_ENDPOINT',
  'ORCHESTRATOR_MANUAL_API_CREDENTIAL'
);
