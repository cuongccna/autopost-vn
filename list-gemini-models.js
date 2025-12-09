const { GoogleGenerativeAI } = require("@google/generative-ai");

// Try both keys if needed, but let's start with the one in .env.local
const genAI = new GoogleGenerativeAI("AIzaSyBDs1oIzDxhq4w5KfOIABFw8ltJSWdQI8A");

async function listModels() {
  try {
    // Access the model manager directly if possible, or use the generic request
    // The Node.js SDK usually exposes a model manager.
    // Let's try to fetch the models list using a raw fetch if the SDK method is obscure
    // But first, let's try the SDK's likely method.
    
    // Note: In some versions of the SDK, it's genAI.getGenerativeModel... 
    // but listing might be different.
    // Let's try a direct fetch to the API endpoint to be sure.
    
    const apiKey = "AIzaSyBDs1oIzDxhq4w5KfOIABFw8ltJSWdQI8A";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("Available models:");
      data.models.forEach(m => {
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
          console.log(`- ${m.name} (${m.displayName})`);
        }
      });
    } else {
      console.log("No models found or error:", JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error("Error listing models:", error.message);
  }
}

listModels();
