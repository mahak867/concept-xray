module.exports = (req, res) => res.status(200).json({ ai: !!process.env.GEMINI_API_KEY });
