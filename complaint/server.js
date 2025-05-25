const express = require('express');
const session = require("express-session");
const iconv = require('iconv-lite');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const requestIp = require('request-ip')

const app = express();
const port = 3003;


const { spawn } = require("child_process");
const isWindows = process.platform === "win32";
const pythonPath = isWindows ? './venv/Scripts/python.exe' : './venv/bin/python';

const python_suegenerator = './sue_generator.py';
const python_save_doc = './save_doc.py';
const python_save_statement_doc = './save_statement_doc.py';
const python_admin_system_process = './admin_system_process.py';
const python_statement_generator = './statement_generator.py';
const result_page_html = './public/result_page.html';
const statement_result_page_html = './public/statement_result_page.html';
const admin_system_ejs = './views/admin_system.ejs';


// body-parser 미들웨어 사용

app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일(HTML, CSS)을 서빙하기 위해 express.static 미들웨어 사용
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: true
}));

app.use(requestIp.mw());

app.use((req, res, next) => {
  const clientIP = req.ip; // 클라이언트의 IP 주소를 가져옵니다.
  const currentTime = new Date().toLocaleString(); // 현재 시간을 가져옵니다.
  const headers = req.headers; // 요청 헤더를 가져옵니다.
  /*
  console.log("");
  console.log(`[${currentTime}] Client IP: ${clientIP}`);
  console.log('Headers:', JSON.stringify(headers['user-agent'], null, 2)); // JSON 형식의 문자열로 변환하여 출력
  */
  next(); // 다음 미들웨어 또는 라우트 핸들러로 이동합니다.
});

app.set('view engine', 'ejs');

//////////////////////////////////////////////////////////접속////////////////////////////////////////////////////////////////

app.get('/', (req, res) => {
  // HTML 파일을 렌더링합니다.
  res.sendFile(path.join(__dirname, 'public', 'first_page.html'));
});

/////////////////////////////////////////////////////////고소장////////////////////////////////////////////////////////////////

app.get('/sue_index', (req, res) => {
  // HTML 파일을 렌더링합니다.
  res.sendFile(path.join(__dirname, 'public', 'sue_index.html'));
});

// 첫 번째 페이지 작성 후 제출
app.post('/submit', (req, res) => {
  const first_formData = req.body;
  const redirect_page_name = first_formData['고소 죄명'];

  if (redirect_page_name) {
    req.session.first_formData = first_formData;
    req.session.redirect_page_name = redirect_page_name;
    res.redirect("/" + redirect_page_name);
  } else {
    // redirect_page_name이 없는 경우 처리
    res.redirect("/error"); // 오류 페이지로 리디렉션, 또는 다른 처리
  }
});

// 두번째 페이지는 코드 맨 밑에



// 결과창으로 이동(로딩창)
app.post('/loading_gpt', (req, res) => {
  req.session.second_formData = req.body;
  res.sendFile(path.join(__dirname, 'public', 'loading_gpt.html'));
});

// 결과창으로 이동
app.get('/gpt', (req, res) => {

  const second_formData = req.session.second_formData;
  const first_formData = req.session.first_formData;

  const pythonProcess = spawn(pythonPath, [python_suegenerator, JSON.stringify(first_formData), JSON.stringify(second_formData)]);

  let outputData = ''
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    outputData += iconv.decode(data, 'euc-kr');
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += iconv.decode(data, 'euc-kr');  // 오류 메시지 저장
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).send(`Python script failed.\nError: ${errorData.trim()}`);
    }
    const outputLines = outputData.trim().split('\n');
    // 예를 들어 첫 번째와 두 번째 라인을 가져옴
    const doc_edit_url = outputLines[0];
    const pdf_id = outputLines[1];
    const word_name = outputLines[2]

    req.session.doc_edit_url = doc_edit_url.trim();
    req.session.pdf_id = pdf_id;
    req.session.word_name = word_name;

    const pdf_url = 'https://drive.google.com/file/d/' + req.session.pdf_id + '/preview'

    fs.readFile(result_page_html, 'utf8', (err, html) => {
      if (err) {
        console.error(err);
        return;
      }
      // HTML 수정
      const modifiedHtml = html.replace('pdf_url', pdf_url);

      res.send(modifiedHtml);
    });
  });
});

// 수정 버튼 눌렀을 때 구글 닥스 페이지로 이동
app.post('/docx', (req, res) => {
  if (req.session.doc_edit_url) {
    res.json({ url: req.session.doc_edit_url }); // JSON으로 URL 응답
  } else {
    res.status(404).json({ error: 'Document edit URL not found' });
  }
});

// 수정 반영(로딩창)
app.get('/loading_save', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'loading_save.html'));
});

// 수정사항 반영 및 pdf 새로고침
app.get('/save', (req, res) => {

  const pythonProcess = spawn(pythonPath, [python_save_doc, req.session.doc_edit_url]);

  let save_response = '';
  pythonProcess.stdout.on('data', (data) => {
    save_response = iconv.decode(data, 'euc-kr');
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).send(`Python script failed.\nError: ${errorData.trim()}`);
    }
    const pdf_url = 'https://drive.google.com/file/d/' + save_response + '/preview'

    fs.readFile(result_page_html, 'utf8', (err, html) => {
      if (err) {
        console.error(err);
        return;
      }
      // HTML 수정
      const modifiedHtml = html.replace('pdf_url', pdf_url);
      res.send(modifiedHtml);
    });
  });
});


// 결과창에서 워드 다운로드
app.get('/download_word', (req, res) => {
  const filename = req.session.word_name;
  const filePath = path.join(__dirname, 'docx_storage', filename);

  // 한글 파일명 처리
  const encodedFilename = encodeURIComponent(filename);

  // 브라우저 호환을 고려한 Content-Disposition 설정
  const userAgent = req.headers['user-agent'] || '';
  let contentDisposition;

  if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    // IE
    contentDisposition = `attachment; filename=${encodedFilename}`;
  } else if (userAgent.includes('Chrome')) {
    // Chrome
    contentDisposition = `attachment; filename*=UTF-8''${encodedFilename}`;
  } else if (userAgent.includes('Firefox')) {
    // Firefox
    contentDisposition = `attachment; filename*=UTF-8''${encodedFilename}`;
  } else {
    // 기타 브라우저
    contentDisposition = `attachment; filename="${Buffer.from(filename).toString('binary')}"`;
  }

  res.setHeader('Content-Disposition', contentDisposition);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('파일 전송 오류:', err);
      res.status(500).send('파일을 찾을 수 없습니다.');
    }
  });
});

// 결과창에서 pdf 다운로드
app.get('/download_pdf', (req, res) => {
  const originalFilename = req.session.word_name.replace('.docx', '.pdf');
  const filePath = path.join(__dirname, 'pdf_storage', originalFilename);

  const encodedFilename = encodeURIComponent(originalFilename);
  const userAgent = req.headers['user-agent'] || '';
  let contentDisposition;

  if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    // Internet Explorer
    contentDisposition = `attachment; filename=${encodedFilename}`;
  } else if (userAgent.includes('Chrome')) {
    // Chrome
    contentDisposition = `attachment; filename*=UTF-8''${encodedFilename}`;
  } else if (userAgent.includes('Firefox')) {
    // Firefox
    contentDisposition = `attachment; filename*=UTF-8''${encodedFilename}`;
  } else {
    // 기타 브라우저 (Safari 등)
    contentDisposition = `attachment; filename="${Buffer.from(originalFilename).toString('binary')}"`;
  }

  res.setHeader('Content-Disposition', contentDisposition);
  res.setHeader('Content-Type', 'application/pdf');

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('파일 전송 오류:', err);
      res.status(500).send('파일을 찾을 수 없습니다.');
    }
  });
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////진술 조서////////////////////////////////////////////////////////////////


// 진술조서 시스템 메인창(로딩)
app.get('/loading_admin_system', (req, res) => {
  // HTML 파일을 렌더링합니다.
  res.sendFile(path.join(__dirname, 'public', 'loading_admin_system.html'));
});

// 진술조서 시스템 메인창 이동
app.get('/admin_system', (req, res) => {
  const pythonProcess = spawn(pythonPath, [python_admin_system_process]);

  pythonProcess.stdout.on('data', (data) => {
    const outputData = iconv.decode(data, 'euc-kr');
    const sue_info = JSON.parse(outputData);

    res.render(admin_system_ejs, { data: sue_info });
  });
});

// 진술조서 생성 (로딩)
let globalWordname;
app.get('/loading_statement', (req, res) => {
  globalWordname = req.query.wordPath;
  res.sendFile(path.join(__dirname, 'public', 'loading_statement.html'));
});

// 진술조서 생성 이동
app.get('/statement', (req, res) => {
  const pythonProcess = spawn(pythonPath, [python_statement_generator, globalWordname]);

  let outputData = ''

  pythonProcess.stdout.on('data', (data) => {
    outputData += iconv.decode(data, 'euc-kr');
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).send(`Python script failed.\nError: ${errorData.trim()}`);
    }
    const outputLines = outputData.trim().split('\n');

    const statement_doc_edit_url = outputLines[0];
    const statement_pdf_id = outputLines[1];
    const statement_word_name = outputLines[2]



    req.session.statement_doc_edit_url = statement_doc_edit_url.trim();
    req.session.statement_pdf_id = statement_pdf_id;
    req.session.statement_word_name = statement_word_name;

    const pdf_url = 'https://drive.google.com/file/d/' + req.session.statement_pdf_id + '/preview'

    fs.readFile(statement_result_page_html, 'utf8', (err, html) => {
      if (err) {
        console.error(err);
        return;
      }
      // HTML 수정
      const modifiedHtml = html.replace('pdf_url', pdf_url);

      res.send(modifiedHtml);
    });
  });
});

// 수정 버튼 눌렀을 때 진술서 구글 닥스 페이지로 이동
app.post('/statement_docx', (req, res) => {
  if (req.session.statement_doc_edit_url) {
    res.json({ url: req.session.statement_doc_edit_url }); // JSON으로 URL 응답
  } else {
    res.status(404).json({ error: 'Document edit URL not found' });
  }
});

// 진술조서 수정 반영
app.get('/loading_statement_save', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'loading_statement_save.html'));
});

// 진술조서 수정 반영
app.get('/statement_save', (req, res) => {

  const pythonProcess = spawn(pythonPath, [python_save_statement_doc, req.session.statement_doc_edit_url]);

  let save_response = '';
  pythonProcess.stdout.on('data', (data) => {
    save_response = iconv.decode(data, 'euc-kr');
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).send(`Python script failed.\nError: ${errorData.trim()}`);
    }
    const pdf_url = 'https://drive.google.com/file/d/' + save_response + '/preview'

    fs.readFile(statement_result_page_html, 'utf8', (err, html) => {
      if (err) {
        console.error(err);
        return;
      }
      // HTML 수정
      const modifiedHtml = html.replace('pdf_url', pdf_url);
      res.send(modifiedHtml);
    });
  });
});

// 결과창에서 진술서 워드 다운로드
app.get('/download_statement_word', (req, res) => {
  const filename = req.session.statement_word_name;
  const filePath = path.join(__dirname, 'docx_statement_storage', filename);

  // 파일명 인코딩
  const encodedFilename = encodeURIComponent(filename).replace(/\+/g, '%20');

  // Content-Disposition 설정
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);

  res.sendFile(filePath);
});

// 결과창에서 진술서 pdf 다운로드
app.get('/download_statement_pdf', (req, res) => {
  const filename = req.session.statement_word_name.replace('.docx', '.pdf');
  const filePath = path.join(__dirname, 'pdf_statement_storage', filename);

  // 파일명 인코딩
  const encodedFilename = encodeURIComponent(filename).replace(/\+/g, '%20');

  // Content-Disposition 설정
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);

  res.sendFile(filePath);
});


// 두 번째 페이지로 이동
app.get('/:redirect_page_name', (req, res) => {
  const pageName = req.session.redirect_page_name;

  if (pageName) {
    res.sendFile(path.join(__dirname, 'public', pageName + '.html'));
  } else {
    // 세션에 pageName이 없는 경우 처리
    res.status(404).send('Page not found'); // 404 오류 처리
  }
});


app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running at http://localhost:${port}`);
});