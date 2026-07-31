export interface FlowDesignerRequest {
  text: string;
  type: string;
  consideration?: string;
}

export interface FlowDesignerResult {
  result: string;
  success: boolean;
  log: {
    model: string;
    inputToken: number;
    outputToken: number;
    responseTime: number;
  };
}
