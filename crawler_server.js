const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const fsextra = require('fs-extra')
const { Worker } = require('worker_threads');
const mysqlModule = require('./mysql')
const os = require('os')

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const python_CRAWLER_WEB = 'C:/GitHub/BIGMACLAB/CRAWLER/CRAWLER_WEB.py'

const computername = os.hostname()
let PORT;

// OMEN
if (computername == "DESKTOP-502IMU5") {
    crawler_folder_path = 'C:/BIGMACLAB/CRAWLER'
    PORT = 80
}
// Z8
else if (computername == "BIGMACLAB-Z8") {
    crawler_folder_path = 'D:/BIGMACLAB/CRAWLER'
    PORT = 81
}
else if (computername == "BigMacServer") {
    crawler_folder_path = 'D:/BIGMACLAB/CRAWLER'
    PORT = 82
}

const crawl_history_json = path.join(crawler_folder_path, 'crawler_history.json')
const scrapdata_path     = path.join(crawler_folder_path, 'scrapdata')
const crawlWorker_path   = path.join(__dirname, 'crawler_worker.js')


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crawl_dashboard.html'));
});

app.get('/history', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crawl_history.html'));
});

app.get('/add_crawler', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crawl_add.html'));
});

app.get('/getHistoryData', (req, res) => {
    fs.readFile(crawl_history_json, (err, data) => {
        if (err) {
            console.error('Failed to read file', err);
            res.status(500).send('Server error');
            return;
        }
        res.json(JSON.parse(data));
    });
});

app.delete('/deleteHistory', (req, res) => {
    const { index } = req.query; // Get index from query string
    fs.readFile(crawl_history_json, (err, data) => {
        if (err) {
            console.error('Failed to read file', err);
            res.status(500).send('Server error');
            return;
        }
        let history = JSON.parse(data);
        if (index >= 0 && index < history.length) {
            history.splice(index, 1); // Remove the item at the specified index
            fs.writeFile(crawl_history_json, JSON.stringify(history, null, 2), (err) => {
                if (err) {
                    console.error('Failed to write file', err);
                    res.status(500).send('Server error');
                    return;
                }
                res.json({ success: true });
            });
        } else {
            res.status(400).send('Invalid index');
        }
    });
});

let processes = {};

async function processDatabases(databases, DBname, requester) {
    for (const db of databases) {
        if (db.includes(DBname)) {
            try {
                await mysqlModule.deleteDatabase(db);

                const db_path = path.join(scrapdata_path, `${requester}_scrapdata`, db);
                await fsextra.remove(db_path);
            } catch (err) {
                console.error(`오류가 발생했습니다: ${err}`);
            }
        }
    }
}


io.on('connection', (socket) => {
    socket.on('crawlInfo_submit', (data) => {
        const processId = Date.now().toString();
        const { name, crawl_object, start_day, end_day, option_select, keyword, uploadToDrive } = data;
        socket.emit('redirect', '/');

        const worker = new Worker(crawlWorker_path, {
            workerData: {
                scriptPath: python_CRAWLER_WEB,
                args: [name, crawl_object, start_day, end_day, option_select, keyword, uploadToDrive]
            }
        });

        processes[processId] = worker;

        worker.on('message', (output) => {
            io.emit('crawl_progress', { processId, output, name, crawl_object, start_day, end_day, option_select, keyword, uploadToDrive, output });
        });

        worker.on('error', error => {
            console.error(`Worker error: ${error}`);
        });

        worker.on('exit', (code) => {
        });
    });

    socket.on('terminate_process', async (data) => {
        const requester = data.name;
        const processId = data.processId;
        const keyword = data.keyword;
        const crawl_object = data.crawl_object.replace(/\s+/g, '').toLowerCase();
        const start_day = data.start_day;
        const end_day = data.end_day;
        const DBname = `${crawl_object}_${keyword}_${start_day}_${end_day}`;

        try {
            const databases = await mysqlModule.getAllDatabases();
            await processDatabases(databases, DBname, requester);
        } catch (err) {
            console.error('Error fetching databases or processing them:', err);
            return;
        }

        if (processes[processId]) {
            processes[processId].terminate();
            processes[processId].postMessage('terminate');
            delete processes[processId];
            io.emit('process_terminated', processId);
        }
    });
});

server.listen(PORT, () => {
});
