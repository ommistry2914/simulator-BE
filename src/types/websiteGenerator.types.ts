export interface WebsiteGenerationRequest {
  projectName: string;
  projectDescription: string;
  industry?: string;
  targetAudience?: string;
  features?: string;
  colorScheme?: string;
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'gemini-pro' | 'claude-3';
}

export interface WebsiteGenerationResponse {
  type: 'start' | 'token' | 'complete' | 'error';
  content?: string;
  message?: string;
  cmsStructure?: object;
  metadata?: {
    projectName: string;
    model: string;
    generatedAt: string;
    tokenCount: number;
  };
}

export interface CMSDataStructure {
  hero: {
    title: string;
    subtitle: string;
    buttonText: string;
    backgroundImage?: string;
  };
  about: {
    title: string;
    description: string;
    image?: string;
  };
  services: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  contact: {
    title: string;
    email: string;
    phone: string;
    address: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
  };
}