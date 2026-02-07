const express = require('express');
const cors = require('cors');
const cloudscraper = require('cloudscraper');
const app = express();

app.use(cors());

// Вспомогательная функция для запросов через "обходчик"
const scrapper = (url) => {
    return new Promise((resolve, reject) => {
        cloudscraper.get(url, (error, response, body) => {
            if (error) reject(error);
            else resolve(JSON.parse(body));
        });
    });
};

app.get('/check', async (req, res) => {
    const { street, house } = req.query;
    console.log(`--- ПОПЫТКА ОБХОДА: ${street}, ${house} ---`);

    try {
        // 1. Поиск улицы
        const streetUrl = `https://www.dtek-oem.com.ua/ua/ajax/get-streets?city=Одеса&query=${encodeURIComponent(street)}`;
        const streets = await scrapper(streetUrl);
        
        if (!streets[0]) return res.json({ status: 'error', message: 'Улица не найдена' });
        const streetId = streets[0].id;

        // 2. Поиск дома
        const houseUrl = `https://www.dtek-oem.com.ua/ua/ajax/get-houses?street=${streetId}&query=${encodeURIComponent(house)}`;
        const houses = await scrapper(houseUrl);
        
        if (!houses[0]) return res.json({ status: 'error', message: 'Дом не найден' });
        const houseId = houses[0].id;

        // 3. Получение графика
        const scheduleUrl = `https://www.dtek-oem.com.ua/ua/ajax/get-schedule?house=${houseId}`;
        const schedule = await scrapper(scheduleUrl);

        if (schedule && schedule.html) {
            console.log("ПРОРВАЛИСЬ! График получен.");
            res.json({ status: 'success', html: schedule.html });
        } else {
            res.json({ status: 'error', message: 'ДТЭК прислал пустой ответ' });
        }

    } catch (e) {
        console.log("ОШИБКА ОБХОДА:", e.message);
        res.json({ status: 'error', message: 'Защита ДТЭК слишком сильная. Попробуйте через 5 минут.' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Bypass server running`));
