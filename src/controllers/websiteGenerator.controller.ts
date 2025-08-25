// controllers/websiteGenerator.controller.ts
import { Request, Response } from "express";
import { websiteGeneratorService } from "../services/websiteGenerator.service";
import { z } from "zod";

// Validation schema
const generateWebsiteSchema = z.object({
  projectName: z.string().min(1, "Project name is required").max(100),
  projectDescription: z.string().min(10, "Project description must be at least 10 characters").max(1000),
  industry: z.string().optional(),
  targetAudience: z.string().optional(),
  features: z.string().optional(),
  colorScheme: z.string().optional(),
  model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'gemini-2.5-flash', 'claude-3']).default('gemini-2.5-flash'),
});

export const generateWebsite = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validationResult = generateWebsiteSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors
      });
      return;
    }

    const params = validationResult.data;

    // Set headers for Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Send initial response
    res.write(`data: ${JSON.stringify({ 
      type: 'start', 
      message: `Starting website generation with ${params.model}...` 
    })}\n\n`);

    let generatedCode = '';
    let tokenCount = 0;

    // Generate website with streaming
    await websiteGeneratorService.generateWebsite(params, {
      onToken: (token: string) => {
        tokenCount++;
        generatedCode += token;
        
        // Send token update every 10 tokens to reduce overhead
        if (tokenCount % 10 === 0) {
          res.write(`data: ${JSON.stringify({ 
            type: 'token', 
            content: token,
            totalTokens: tokenCount 
          })}\n\n`);
        }
      },

      onComplete: (fullCode: string) => {
        try {
          // Extract CMS structure
          const cmsStructure = websiteGeneratorService.extractCMSStructure(fullCode);
          
          // Send complete response
          res.write(`data: ${JSON.stringify({ 
            type: 'complete', 
            content: fullCode,
            cmsStructure: cmsStructure,
            metadata: {
              projectName: params.projectName,
              model: params.model,
              generatedAt: new Date().toISOString(),
              tokenCount: tokenCount
            }
          })}\n\n`);
          
          // Send final done signal
          res.write(`data: [DONE]\n\n`);
          res.end();
        } catch (error) {
          console.error('Error in onComplete:', error);
          res.write(`data: ${JSON.stringify({ 
            type: 'error', 
            message: 'Error processing generated content' 
          })}\n\n`);
          res.end();
        }
      },

      onError: (error: Error) => {
        console.error('Website generation error:', error);
        res.write(`data: ${JSON.stringify({ 
          type: 'error', 
          message: error.message 
        })}\n\n`);
        res.end();
      }
    });

  } catch (error) {
    console.error('Controller error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
      });
    }
  }
};

// Additional controller for CMS data injection
export const injectCMSData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { template, cmsData } = req.body;
    
    if (!template || !cmsData) {
      res.status(400).json({
        error: "Both template and cmsData are required"
      });
      return;
    }

    const updatedTemplate = websiteGeneratorService.injectCMSData(template, cmsData);
    
    res.json({
      success: true,
      updatedTemplate,
      message: "CMS data injected successfully"
    });

  } catch (error) {
    console.error('CMS injection error:', error);
    res.status(500).json({
      error: "Failed to inject CMS data",
      message: (error as Error).message
    });
  }
};