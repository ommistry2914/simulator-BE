import { Router } from "express";
import { generateWebsite, injectCMSData } from "../controllers/websiteGenerator.controller";


const router = Router();

// Main generation endpoint
router.post("/generate", (req, res, next) => {
  console.log("ello");
  next();
}, generateWebsite);


// CMS data injection endpoint
router.post("/inject-cms", injectCMSData);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    models: ['gpt-4', 'gpt-3.5-turbo', 'gemini-pro', 'claude-3']
  });
});

export default router;