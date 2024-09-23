const express = require("express");
const app = express();
const env = require("dotenv");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
app.use(express.json());
env.config();
app.use(cors({ origin: process.env.ORIGIN }));

const genAi = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAi.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post("/api/prompt", async (req, res) => {
  try {
    const { prompt } = req.body;
    let arr = [];
    let previous = "";
    const utilText =
      "I need you to rate the question, from 1 to 5 only for the programming prompts, where the hardness rating is based on the difficulty from a programmer's point of view. You need to reply with the rating, just the number, no other details. A low number indicates low difficulty, and a high number indicates more difficulty.if the prompts contains any other questions or texts other than programming, make the rating as 1";
    const result = await model.generateContent(utilText + " " + prompt);

    const startTime = Date.now();
    const hardness = result.response.text().charAt(0) - "0";

    const first = await model.generateContent(prompt);
    previous = first.response.text();

    if (hardness == 1 || !hardness) {
      const endTime = Date.now();
      const timer = (endTime - startTime) / 1000;
      return res.status(200).json({ hardness, timer, message: previous });
    }

    for (let i = 1; i <= hardness; i++) {
      const multiple = await generateMultiple(prompt, previous);
      previous = multiple;
      arr.push(multiple);
      console.log(arr.length);
    }
    const final = await generateFinal(prompt, arr);
    const endTime = Date.now();
    const timer = Math.ceil((endTime - startTime) / 1000);
    console.log(timer);

    res.status(200).json({ hardness, timer, message: final });
  } catch (error) {
    res.status(500).json({ error: "Internal server error: " + error.message });
  }
});

async function generateMultiple(prompt, previous) {
  try {
    const utilText =
      "generate correct content for the prompt better that previous";
    const result = await model.generateContent(
      previous + " " + utilText + " " + prompt
    );
    previous = result.response.text();
    console.log("executed");
    return result.response.text();
  } catch (error) {
    throw new Error("Erron in analysing " + error.message);
  }
}

async function generateFinal(prompt, arr) {
  try {
    const utilText =
      "the above is the question, below are the answers array, iterate the array if answers and analyse all the answers, and finally generate an correct code for the question";
    const result = await model.generateContent(
      prompt + "\n" + utilText + "\n" + arr
    );
    // console.log("final array size" + arr.length);
    return result.response.text();
  } catch (error) {
    throw new Error("Problem in generating " + error.message);
  }
}

app.listen(process.env.PORT, () => {
  console.log("server started");
});
