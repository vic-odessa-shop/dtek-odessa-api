const express = require('express');
const cors = require('cors');
const cloudscraper = require('cloudscraper');
const app = express();

app.use(cors());

// Улучшенный загрузчик
const scrapper = (url) => {
    return new Promise((resolve, reject) => {
        cloudscraper.get(url, (error, response, body) => {
            if (error) return reject(error);
            try {
                // Пытаемся понять: нам прислали JSON или HTML?
                const data = JSON.parse(body);
                resolve(data);
            } catch (e) {
                // Если пришел HTML (ошибка 404 или проверка), выводим в лог начало ответа
                console.log("ДТЭК прислал HTML вместо данных. Кусочек ответа:", body.slice(0, 100));
                reject(new Error("Сайт ДТЭК просит обновить страницу или ввел капчу"));
            }
        });
    });
};

app.get('/check', async (req, res) => {
    const { street, house } = req.query;
    console.log(`--- ПОПЫТКА: ${street}, ${house} ---`);

    try {
        // 1. Поиск улицы (используем точный URL с сайта)
        const streetUrl = `https://www.dtek-oem.com.ua/ua/ajax/get-streets?city=%D0%9E%D0%B4%D0%B5%D1%81%D0%B0&query=${encodeURIComponent(street)}`;
        const streets = await scrapper(streetUrl);
        
        if (!streets || !streets[0]) return res.json({ status: 'error', message: 'Улица не найдена. Попробуйте "Люстдорфська"' });
        const streetId = streets[0].id;

        // 2. Поиск дома
        const houseUrl = `https://www.dtek-oem.com.ua/ua/ajax/get-houses?street=${streetId}&query=${encodeURIComponent(house)}`;
        const houses = await scrapper(houseUrl);
        
        if (!houses || !houses[0]) return res.json({ status: 'error', message: 'Дом не найден' });
        const houseId = houses[0].id;

        // 3. Получение графика
        const scheduleUrl = `https://www.dtek-oem.com.ua/ua/ajax/get-schedule?house=${houseId}`;
        const schedule = await scrapper(scheduleUrl);

        if (schedule && schedule.html) {
            console.log("ГРАФИК ПОЛУЧЕН!");
            res.json({ status: 'success', html: schedule.html });
        } else {
            res.json({ status: 'error', message: 'График пуст' });
        }

    } catch (e) {
        console.log("ОШИБКА:", e.message);
        res.json({ status: 'error', message: 'ДТЭК временно ограничил доступ. Попробуйте еще раз через минуту.' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Bypass server running`));
