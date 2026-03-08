export interface ChallengeValidation {
  must_have?: Array<{
    field?: string;
    value?: string;
    present?: boolean;
    non_empty?: boolean;
    must_contain?: string[];
    order_independent?: boolean;
    position?: number;
    step?: string;
    finding_present?: string;
    acceptable_descriptions?: string[];
  }>;
  must_not_have?: Array<{
    field?: string;
    value?: string;
    location?: string;
  }>;
  ordering_tolerance?: string;
}

export interface ChallengeSpec {
  id: string;
  spec: string;
  validation: ChallengeValidation;
  eli_notes?: string;
  hints?: string[];
  environment?: string;
  prefilled?: Record<string, unknown>;
  success_text?: string;
}
