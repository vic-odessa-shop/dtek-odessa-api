const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/check', async (req, res) => {
    const { street, house } = req.query;
    console.log(`--- ЗАПРОС: ${street}, ${house} ---`);

    try {
        // Используем прокси для обхода блокировки по IP
        const proxy = "https://api.allorigins.win/get?url=";
        
        // 1. Ищем улицу
        const urlStreet = encodeURIComponent(`https://www.dtek-oem.com.ua/ua/ajax/get-streets?city=Одеса&query=${street}`);
        const streetRes = await axios.get(`${proxy}${urlStreet}`);
        const streets = JSON.parse(streetRes.data.contents);

        if (!streets || !streets[0]) return res.json({ status: 'error', message: 'Улица не найдена' });
        const streetId = streets[0].id;

        // 2. Ищем дом
        const urlHouse = encodeURIComponent(`https://www.dtek-oem.com.ua/ua/ajax/get-houses?street=${streetId}&query=${house}`);
        const houseRes = await axios.get(`${proxy}${urlHouse}`);
        const houses = JSON.parse(houseRes.data.contents);

        if (!houses || !houses[0]) return res.json({ status: 'error', message: 'Дом не найден' });
        const houseId = houses[0].id;

        // 3. Получаем график
        const urlSchedule = encodeURIComponent(`https://www.dtek-oem.com.ua/ua/ajax/get-schedule?house=${houseId}`);
        const scheduleRes = await axios.get(`${proxy}${urlSchedule}`);
        const schedule = JSON.parse(scheduleRes.data.contents);

        if (schedule && schedule.html) {
            res.json({ status: 'success', html: schedule.html });
        } else {
            res.json({ status: 'error', message: 'График пуст' });
        }

    } catch (e) {
        console.log("ОШИБКА:", e.message);
        res.status(500).json({ status: 'error', message: 'Ошибка прокси. Попробуйте еще раз.' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server started`));
