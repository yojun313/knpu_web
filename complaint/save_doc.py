from doc_process import doc_process
import sys

word_url = sys.argv[1]

save_process = doc_process()
word_file_name, word_file_path = save_process.word_download(word_url)
pdf_path = save_process.convert_word_to_pdf(word_file_name, word_file_path)
pdf_id = save_process.pdf_upload(word_file_name, pdf_path)
print(pdf_id)
