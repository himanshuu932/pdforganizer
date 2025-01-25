const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyBZM6dTMcLhZ-nY7Uetow2JbxTsAP4lqxg");

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const chat = model.startChat({
  history: [
    {
      role: "user",
      parts: [{ text: "Hello" }],
    },
    {
      role: "model",
      parts: [{ text: "Great to meet you. What would you like to know?" }],
    },
  ],
});

(async () => {
  try {
    const result = await chat.sendMessage("I have 2 dogs in my house.");
    console.log(await result.response.text()); // Call `text` function to get the response text.

    const result2 = await chat.sendMessage("How many paws are in my house?");
    console.log(await result2.response.text()); // Call `text` function to get the response text.
  } catch (error) {
    console.error("Error:", error);
  }
})();
