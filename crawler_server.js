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
let PORT = 3001;

const python_CRAWLER_WEB = path.join(__dirname, '..', 'BIGMACLAB/CRAWLER/CRAWLER_WEB.py');
const crawlWorker_path   = path.join(__dirname, 'crawler_worker.js');

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

let processes = {};


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
