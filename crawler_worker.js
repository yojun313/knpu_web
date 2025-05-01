const { workerData, parentPort } = require('worker_threads');
const { spawn } = require('child_process');
const fs = require('fs').promises; // fs.promises 사용
const os = require('os');
const path = require('path')

const computername = os.hostname()
if (computername == "DESKTOP-502IMU5") {
    crawler_folder_path = 'C:/BIGMACLAB/CRAWLER'
}
else {
    crawler_folder_path = 'D:/BIGMACLAB/CRAWLER'
}

const crawl_history_path = path.join(crawler_folder_path, 'crawler_history.json')

const { scriptPath, args } = workerData;
const pythonProcess = spawn('python', ['-u', scriptPath, ...args]);

let terminationReason = 'completed'; // Default termination reason

pythonProcess.stdout.on('data', (data) => {
    parentPort.postMessage(data.toString());
});

pythonProcess.stderr.on('data', (data) => {
    parentPort.postMessage(`Error: ${data}`);
});

pythonProcess.on('close', async (code) => {
    if (code !== 0) {
        // 프로세스가 비정상적으로 종료된 경우
        return;
    }

    const newCrawlData = {
        name: args[0],
        crawl_object: args[1],
        start_day: args[2],
        end_day: args[3],
        option_select: args[4],
        keyword: args[5],
        uploadToDrive: args[6],
        timestamp: new Date().toISOString(),
    };

    try {
        const data = await fs.readFile(crawl_history_path, 'utf8');
        let crawlDataList = [];

        if (data) {
            try {
                const parsedData = JSON.parse(data);
                if (Array.isArray(parsedData)) {
                    crawlDataList = parsedData;
                } else {
                    console.error('Parsed data is not an array, initializing as empty array.');
                }
            } catch (parseError) {
                console.error('Error parsing JSON data:', parseError);
            }
        }

        crawlDataList.push(newCrawlData);

        await fs.writeFile(crawl_history_path, JSON.stringify(crawlDataList, null, 2));
    } catch (err) {
        console.error('Error reading or writing JSON data:', err);
    }
});

parentPort.on('message', (message) => {
    if (message === 'terminate') {
        terminationReason = 'terminated';
        pythonProcess.kill('SIGINT');
    }
});
