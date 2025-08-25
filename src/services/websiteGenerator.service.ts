// services/websiteGenerator.service.ts
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import config from "../config/db/index";

interface GenerateWebsiteParams {
  projectName: string;
  projectDescription: string;
  industry?: string;
  targetAudience?: string;
  features?: string;
  colorScheme?: string;
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'gemini-2.5-flash' | 'claude-3';
}

interface StreamCallback {
  onToken: (token: string) => void;
  onComplete: (fullCode: string) => void;
  onError: (error: Error) => void;
}

class WebsiteGeneratorService {
  // private openai: OpenAI;
  private genAI: GoogleGenerativeAI;
  private anthropic: Anthropic;

  constructor() {
    // this.openai = new OpenAI({ 
    //   apiKey: process.env.OPENAI_API_KEY 
    // });
    this.genAI = new GoogleGenerativeAI(config.gemini_api_key);
    this.anthropic = new Anthropic({ apiKey: config.anthropic_api_key });
    console.log("genAi", this.genAI);
  }


  private generatePrompt(params: GenerateWebsiteParams): string {
    return `Create a complete, modern React component website with the following requirements:

PROJECT DETAILS:
- Project Name: ${params.projectName}
- Description: ${params.projectDescription}
- Industry: ${params.industry || 'General'}
- Target Audience: ${params.targetAudience || 'General'}
- Key Features: ${params.features || 'Standard website features'}
- Color Scheme: ${params.colorScheme || 'Modern and professional'}

TECHNICAL REQUIREMENTS:
1. Generate a complete HTML file with React components (using CDN)
2. Use Tailwind CSS for styling (CDN version)
3. Make it fully responsive and modern
4. Include proper component structure with hooks (useState, useEffect)
5. Add smooth animations and transitions
6. Use modern design patterns (glassmorphism, gradients, etc.)

CMS INTEGRATION REQUIREMENTS:
7. Create a separate data configuration object at the top that contains all text content, images, and settings
8. Structure the data object to be easily replaceable by CMS content
9. Use destructuring to pull content from the data object
10. Add comments indicating CMS integration points
11. Include placeholder data that can be easily replaced

STRUCTURE THE CODE AS FOLLOWS:
- Complete HTML document with all CDN links
- Data configuration object (CMS-ready)
- React functional components with hooks
- Tailwind CSS classes
- Responsive design
- Professional animations

Generate ONLY the complete HTML code, no explanations. Make it production-ready and beautiful.`;
  }

  async generateWebsite(params: GenerateWebsiteParams, callback: StreamCallback): Promise<void> {
    const prompt = this.generatePrompt(params);
    let fullResponse = '';

    try {
      switch (params.model) {
        case 'gpt-4':
        case 'gpt-3.5-turbo':
          await this.handleOpenAIStream(prompt, params.model, callback, fullResponse);
          break;

        case 'gemini-2.5-flash':
          await this.handleGeminiStream(prompt, callback, fullResponse);
          break;

        case 'claude-3':
          await this.handleClaudeStream(prompt, callback, fullResponse);
          break;

        default:
          throw new Error(`Unsupported model: ${params.model}`);
      }
    } catch (error) {
      callback.onError(error as Error);
    }
  }

  private async handleOpenAIStream(
    prompt: string, 
    model: string, 
    callback: StreamCallback, 
    fullResponse: string
  ): Promise<void> {
    // const stream = await this.openai.chat.completions.create({
    //   model: model,
    //   messages: [
    //     {
    //       role: 'system',
    //       content: 'You are an expert React developer who creates beautiful, modern, CMS-ready websites using React and Tailwind CSS. Always generate complete, production-ready code.'
    //     },
    //     { role: 'user', content: prompt }
    //   ],
    //   stream: true,
    //   temperature: 0.7,
    //   max_tokens: 4000,
    // });

    // for await (const chunk of stream) {
    //   const content = chunk.choices[0]?.delta?.content || '';
    //   if (content) {
    //     fullResponse += content;
    //     callback.onToken(content);

    //     // Check if we have complete HTML
    //     if (fullResponse.includes('</html>') && fullResponse.includes('<!DOCTYPE html>')) {
    //       callback.onComplete(fullResponse);
    //     }
    //   }
    // }
  }

private async handleGeminiStream(
    prompt: string, 
    callback: StreamCallback, 
    fullResponse: string
  ): Promise<void> {
    const model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
    });
    
    const result = await model.generateContentStream({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    });

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullResponse += chunkText;
        callback.onToken(chunkText);

        if (fullResponse.includes('</html>') && fullResponse.includes('<!DOCTYPE html>')) {
          callback.onComplete(fullResponse);
        }
      }
    }
  }

  private async handleClaudeStream(
    prompt: string, 
    callback: StreamCallback, 
    fullResponse: string
  ): Promise<void> {
    const stream = await this.anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const content = chunk.delta.text;
        fullResponse += content;
        callback.onToken(content);

        if (fullResponse.includes('</html>') && fullResponse.includes('<!DOCTYPE html>')) {
          callback.onComplete(fullResponse);
        }
      }
    }
  }

  // Method to extract CMS data structure from generated code
  extractCMSStructure(generatedCode: string): object {
    try {
      // Extract the data configuration object from the generated code
      const dataObjectMatch = generatedCode.match(/const\s+(?:websiteData|data|content)\s*=\s*({[\s\S]*?});/);
      
      if (dataObjectMatch) {
        // Safely evaluate the data object (be careful in production)
        const dataString = dataObjectMatch[1];
        return JSON.parse(dataString);
      }
      
      return {};
    } catch (error) {
      console.error('Error extracting CMS structure:', error);
      return {};
    }
  }

  // Method to inject CMS data into website template
  injectCMSData(template: string, cmsData: object): string {
    try {
      // Replace the data object in the template with CMS data
      const updatedTemplate = template.replace(
        /const\s+(?:websiteData|data|content)\s*=\s*{[\s\S]*?};/,
        `const websiteData = ${JSON.stringify(cmsData, null, 2)};`
      );
      
      return updatedTemplate;
    } catch (error) {
      console.error('Error injecting CMS data:', error);
      return template;
    }
  }
}

export const websiteGeneratorService = new WebsiteGeneratorService();