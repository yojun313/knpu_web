const { workerData, parentPort } = require('worker_threads');
const { spawn } = require('child_process');
const fs = require('fs').promises; // fs.promises 사용
const os = require('os');

const { scriptPath, args } = workerData;
const pythonProcess = spawn('python', ['-u', scriptPath, ...args]);

let terminationReason = 'completed'; // Default termination reason

pythonProcess.stdout.on('data', (data) => {
    parentPort.postMessage(data.toString());
});

pythonProcess.stderr.on('data', (data) => {
    parentPort.postMessage(`Error: ${data}`);
});

parentPort.on('message', (message) => {
    if (message === 'terminate') {
        terminationReason = 'terminated';
        pythonProcess.kill('SIGINT');
    }
});
