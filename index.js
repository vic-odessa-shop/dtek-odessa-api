const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/check', async (req, res) => {
    const { street, house } = req.query;
    try {
        // 1. Поиск ID улицы
        const streetRes = await axios.get(`https://www.dtek-oem.com.ua/ua/ajax/get-streets`, {
            params: { city: 'Одеса', query: street }
        });
        const streetId = streetRes.data[0]?.id;
        if (!streetId) return res.json({ status: 'error', message: 'Улица не найдена. Пишите на укр. (напр. Маразліївська)' });

        // 2. Поиск ID дома
        const houseRes = await axios.get(`https://www.dtek-oem.com.ua/ua/ajax/get-houses`, {
            params: { street: streetId, query: house }
        });
        const houseId = houseRes.data[0]?.id;
        if (!houseId) return res.json({ status: 'error', message: 'Дом не найден' });

        // 3. Получение графика
        const scheduleRes = await axios.get(`https://www.dtek-oem.com.ua/ua/ajax/get-schedule`, {
            params: { house: houseId }
        });

        res.json({ status: 'success', html: scheduleRes.data.html });
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'ДТЭК не отвечает. Попробуйте позже.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
