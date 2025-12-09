const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyB8Aeg_aBxGOo5_CuWyBfNKDp_7BwDwRUY");

async function listModels() {
  try {
    // Note: listModels is not directly available on genAI instance in some versions, 
    // but let's try to use the model manager if available or just try a known model.
    // Actually, the SDK doesn't expose listModels easily in the main entry point in all versions.
    // Let's try to just run a simple generation with a model I suspect might work.
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Success with gemini-1.5-flash:", result.response.text());
  } catch (error) {
    console.error("Error with gemini-1.5-flash:", error.message);
  }
}

listModels();
