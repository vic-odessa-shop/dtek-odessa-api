const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

// Настройки «маскировки» под обычный браузер
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.dtek-oem.com.ua/ua/shutdowns',
    'X-Requested-With': 'XMLHttpRequest'
};

app.get('/check', async (req, res) => {
    const { street, house } = req.query;
    console.log(`--- ЗАПРОС: ${street}, дом ${house} ---`);

    try {
        // 1. Поиск улицы. Используем обновленный URL
        const streetRes = await axios.get(`https://www.dtek-oem.com.ua/ua/ajax/get-streets`, {
            params: { city: 'Одеса', query: street },
            headers
        });
        
        const streetId = streetRes.data[0]?.id;
        if (!streetId) return res.json({ status: 'error', message: 'Улица не найдена' });

        // 2. Поиск дома.
        const houseRes = await axios.get(`https://www.dtek-oem.com.ua/ua/ajax/get-houses`, {
            params: { street: streetId, query: house },
            headers
        });
        
        const houseObj = houseRes.data.find(h => h.title.toLowerCase().trim() === house.toLowerCase().trim()) || houseRes.data[0];
        const houseId = houseObj?.id;

        if (!houseId) return res.json({ status: 'error', message: 'Дом не найден' });

        // 3. ПОЛУЧЕНИЕ ГРАФИКА (Обновленный метод)
        // Иногда они требуют POST запрос, но попробуем сначала уточненный GET
        const scheduleRes = await axios.get(`https://www.dtek-oem.com.ua/ua/ajax/get-schedule`, {
            params: { city: 'Одеса', street: streetId, house: houseId },
            headers
        });

        if (scheduleRes.data && (scheduleRes.data.html || scheduleRes.data.table)) {
            console.log("УСПЕХ: График получен");
            res.json({ status: 'success', html: scheduleRes.data.html || scheduleRes.data.table });
        } else {
            console.log("ДТЭК прислал пустой ответ");
            res.json({ status: 'error', message: 'График временно недоступен на сайте ДТЭК' });
        }

    } catch (e) {
        console.log(`ОШИБКА: ${e.message}`);
        res.status(500).json({ status: 'error', message: 'ДТЭК изменил настройки доступа. Нужно обновить скрипт.' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
