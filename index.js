const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

// Новые заголовки "под браузер"
const headers = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Origin': 'https://www.dtek-oem.com.ua',
    'Referer': 'https://www.dtek-oem.com.ua/ua/shutdowns'
};

app.get('/check', async (req, res) => {
    const { street, house } = req.query;
    console.log(`--- ЗАПУСК ПОИСКА: ${street} ---`);

    try {
        // Пробуем альтернативный адрес API
        const baseUrl = 'https://www.dtek-oem.com.ua/ua/ajax/get-streets';
        
        const streetRes = await axios.get(baseUrl, {
            params: { city: 'Одеса', query: street },
            headers: headers
        });

        if (!streetRes.data || streetRes.data.length === 0) {
            console.log("ОШИБКА: ДТЭК не выдал список улиц (404 или пусто)");
            return res.json({ status: 'error', message: 'Улица не найдена. Попробуйте ввести часть названия' });
        }

        const streetId = streetRes.data[0].id;
        console.log(`Улица найдена! ID: ${streetId}`);

        const houseRes = await axios.get('https://www.dtek-oem.com.ua/ua/ajax/get-houses', {
            params: { street: streetId, query: house },
            headers: headers
        });

        const houseId = houseRes.data[0]?.id;
        if (!houseId) return res.json({ status: 'error', message: 'Дом не найден' });

        const scheduleRes = await axios.get('https://www.dtek-oem.com.ua/ua/ajax/get-schedule', {
            params: { house: houseId },
            headers: headers
        });

        res.json({ status: 'success', html: scheduleRes.data.html });
        console.log("ПОБЕДА: График отправлен в HTML!");

    } catch (e) {
        console.log(`ОШИБКА ДОСТУПА: ${e.message}`);
        res.status(500).json({ status: 'error', message: 'ДТЭК блокирует запрос. Пробую обходной путь...' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
