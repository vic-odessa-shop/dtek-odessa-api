const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/check', async (req, res) => {
    const { street, house } = req.query;
    console.log(`--- НОВЫЙ ЗАПРОС: Улица: ${street}, Дом: ${house} ---`);

    try {
        // 1. Поиск ID улицы
        const streetRes = await axios.get(`https://www.dtek-oem.com.ua/ua/ajax/get-streets`, {
            params: { city: 'Одеса', query: street }
        });
        
        const streetId = streetRes.data[0]?.id;
        if (!streetId) {
            console.log("ОШИБКА: Улица не найдена");
            return res.json({ status: 'error', message: 'Улица не найдена' });
        }
        console.log(`OK: Найдена улица ID: ${streetId} (${streetRes.data[0].title})`);

        // 2. Поиск ID дома
        const houseRes = await axios.get(`https://www.dtek-oem.com.ua/ua/ajax/get-houses`, {
            params: { street: streetId, query: house }
        });
        
        // Фильтруем, чтобы найти точное совпадение номера дома
        const houseObj = houseRes.data.find(h => h.title.toLowerCase().trim() === house.toLowerCase().trim()) || houseRes.data[0];
        const houseId = houseObj?.id;

        if (!houseId) {
            console.log("ОШИБКА: Дом не найден");
            return res.json({ status: 'error', message: 'Дом не найден' });
        }
        console.log(`OK: Найден дом ID: ${houseId} (${houseObj.title})`);

        // 3. Получение графика
        const scheduleRes = await axios.get(`https://www.dtek-oem.com.ua/ua/ajax/get-schedule`, {
            params: { house: houseId }
        });

        if (scheduleRes.data && scheduleRes.data.html) {
            console.log("УСПЕХ: График получен");
            res.json({ status: 'success', html: scheduleRes.data.html });
        } else {
            console.log("ОШИБКА: ДТЭК вернул пустой график");
            res.json({ status: 'error', message: 'ДТЭК не вернул график для этого дома' });
        }

    } catch (e) {
        console.log(`КРИТИЧЕСКАЯ ОШИБКА: ${e.message}`);
        res.status(500).json({ status: 'error', message: 'Ошибка связи с ДТЭК' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
