const express = require("express");
const axios = require("axios");
const router = express.Router();

// Judge0 CE public API (Community Edition)
const JUDGE0_API = "https://judge0-ce.p.rapidapi.com/submissions";

// ⚠️ If you use RapidAPI, add key in .env
// JUDGE0_API_KEY=your_key_here

router.post("/", async (req, res) => {
    const { language_id, source_code, stdin } = req.body;

    try {
        // send code to Judge0
        const response = await axios.post(
            `${JUDGE0_API}?base64_encoded=false&wait=true`,
            {
                language_id,
                source_code,
                stdin: stdin || "",
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
                    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
                }
                ,
            }
        );

        res.json({
            stdout: response.data.stdout,
            stderr: response.data.stderr,
            status: response.data.status,
            time: response.data.time,
            memory: response.data.memory,
        });
    } catch (error) {
        console.error("Execution error:", error.response?.data || error.message);
        res.status(500).json({ error: "Execution failed", details: error.response?.data || error.message });
    }

});

module.exports = router;
