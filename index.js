const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());

app.get('/proxy-schedule', async (req, res) => {
    const { houseId } = req.query;
    try {
        const response = await axios.get(`https://www.dtek-oem.com.ua/ua/ajax/get-schedule?house=${houseId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        res.json(response.data);
    } catch (e) {
        res.status(500).json({ error: 'ДТЭК недоступен' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Proxy running on ${PORT}`));
