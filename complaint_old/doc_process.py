# -*- coding: utf-8 -*-
import sys
import json
from openai import OpenAI
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from datetime import datetime
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2.credentials import Credentials
import os
import pickle
import io
from docx2pdf import convert



class doc_process:
    def __init__(self): 
        self.word_folder_path = os.path.join(os.path.dirname(__file__), 'docx_storage')
        self.pdf_folder_path = os.path.join(os.path.dirname(__file__), 'pdf_storage')
        self.word_statement_folder_path = os.path.join(os.path.dirname(__file__), 'docx_statement_storage')
        self.pdf_statement_folder_path = os.path.join(os.path.dirname(__file__), 'pdf_statement_storage')
        
        self.storage_json = os.path.join(os.path.dirname(__file__), 'public/storage.json')
        SCOPES = ['https://www.googleapis.com/auth/drive']

        # 인증 파일 경로
        creds = None
        if os.path.exists('token.pickle'):
            with open('token.pickle', 'rb') as token:
                creds = pickle.load(token)

        # 인증 정보가 없거나 유효하지 않으면 새로운 인증을 수행
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request()) # 유효기간이 만료된 토큰 새로고침
            else:
                # 인증 정보 파일 public/storage.json에서 인증을 진행
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.storage_json, SCOPES)
                # access_type='offline' 추가
                creds = flow.run_local_server(port=0, access_type='offline')
            # 새롭게 받은 인증 정보를 'token.pickle'에 저장
            with open('token.pickle', 'wb') as token:
                pickle.dump(creds, token)

        # Google Drive API 서비스 구축
        self.service = build('drive', 'v3', credentials=creds)
    
    def word_upload(self, word_name, word_path): # 워드 파일 업로드
        # 업로드할 파일에 대한 설정
        file_metadata = {
            'name': word_name,
            'mimeType': 'application/vnd.google-apps.document',
            'parents': ['1sSyz-gdk3K0DcL312tu2-FytO-U7svxY']
        }
        media = MediaFileUpload(word_path, mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document', resumable=True)

        # 파일 업로드 수행
        file = self.service.files().create(body=file_metadata, media_body=media, fields='id').execute()

        # 파일 ID를 통해 편집 링크 생성
        file_id = file.get('id')
        edit_link = f"https://docs.google.com/document/d/{file_id}/edit"
        return edit_link
    
    def word_download(self, word_url):
        id = word_url.split('/')[5]
        
        file_metadata = self.service.files().get(fileId=id).execute()
        file_name = file_metadata.get('name')
        
        request = self.service.files().export_media(fileId=id, mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()

        if not os.path.exists(self.word_folder_path):
            os.makedirs(self.word_folder_path)

        word_file_name = file_name + '.docx'
        word_file_path = os.path.join(self.word_folder_path, word_file_name)
        with open(word_file_path, 'wb') as f:
            f.write(fh.getbuffer())
        return word_file_name, word_file_path

    def pdf_upload(self, pdf_name, pdf_path): # pdf_name에는 pdf이름, pdf_path에는 pdf 경로 입력
        file_metadata = {
            'name': pdf_name,
            'parents' : ['1CPCPEym-YuYCz89Q-rxxzaCOueZIBs_R']
        }
        media = MediaFileUpload(pdf_path, mimetype='application/pdf')
        # 파일 업로드
        file = self.service.files().create(body=file_metadata, media_body=media, fields='id').execute()
        file_id = file.get('id')
        return file_id
    
    def pdf_download(self, pdf_id): # pdf_id 입력하면 다운로드
        file_metadata = self.service.files().get(fileId=id).execute()
        file_name = file_metadata.get('name')
        
        request = self.service.files().export_media(fileId=pdf_id, mimeType='application/pdf')
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()

        
        if not os.path.exists(self.pdf_folder_path):
            os.makedirs(self.pdf_folder_path)

        pdf_file_name = file_name + '.pdf'
        pdf_file_path = os.path.join(self.pdf_folder_path, pdf_file_name)
        with open(pdf_file_path, 'wb') as f:
            f.write(fh.getbuffer())
    
    def convert_word_to_pdf(self, word_name, word_path): # wrod_name에 문서 이름, word_path에 문서 경로
        pdf_path = os.path.join(self.pdf_folder_path, word_name.replace(".docx", ".pdf"))
        convert(word_path, pdf_path)
        return pdf_path

    def word_statement_download(self, word_url):
        id = word_url.split('/')[5]
        
        file_metadata = self.service.files().get(fileId=id).execute()
        file_name = file_metadata.get('name')
        
        request = self.service.files().export_media(fileId=id, mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()

        if not os.path.exists(self.word_statement_folder_path):
            os.makedirs(self.word_statement_folder_path)

        word_file_name = file_name + '.docx'
        word_file_path = os.path.join(self.word_statement_folder_path, word_file_name)
        with open(word_file_path, 'wb') as f:
            f.write(fh.getbuffer())
        return word_file_name, word_file_path
    
    def pdf_statement_download(self, pdf_id): # pdf_id 입력하면 다운로드
        file_metadata = self.service.files().get(fileId=id).execute()
        file_name = file_metadata.get('name')
        
        request = self.service.files().export_media(fileId=pdf_id, mimeType='application/pdf')
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()

        if not os.path.exists(self.pdf_statement_folder_path):
            os.makedirs(self.pdf_statement_folder_path)

        pdf_file_name = file_name + '.pdf'
        pdf_file_path = os.path.join(self.pdf_statement_folder_path, pdf_file_name)
        with open(pdf_file_path, 'wb') as f:
            f.write(fh.getbuffer())
    
    def convert_statement_word_to_pdf(self, word_name, word_path): # wrod_name에 문서 이름, word_path에 문서 경로
        pdf_path = self.pdf_statement_folder_path + word_name.replace(".docx", ".pdf")
        convert(word_path, pdf_path)
        return pdf_path

    

        
    

    
