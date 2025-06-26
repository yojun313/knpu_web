# manage_content.py
import os
import sys
import json
import shutil
from typing import List, Optional
import tkinter as tk
from tkinter import filedialog
import requests
from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich import box

# ---------- 환경 변수 & Cloudflare R2 설정 ----------
load_dotenv()                                     # .env 로부터 ↓ 값들 읽기
ACCESS_KEY_ID      = os.getenv("ACCESS_KEY_ID")
SECRET_ACCESS_KEY  = os.getenv("SECRET_ACCESS_KEY")
ACCOUNT_ID         = os.getenv("ACCOUNT_ID")
BUCKET_NAME        = os.getenv("BUCKET_NAME")
R2_ENDPOINT        = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"

# 서버 API 엔드포인트 (원하면 수정)
API_BASE           = "http://localhost:8002/api"
MEMBER_EDIT_URL    = f"{API_BASE}/edit/member"
MEMBER_LIST_URL    = f"{API_BASE}/members"
NEWS_EDIT_URL      = f"{API_BASE}/edit/news"

LOCAL_TEMP_DIR     = "./uploads"   # 업로드 전 임시 복사 폴더
os.makedirs(LOCAL_TEMP_DIR, exist_ok=True)

# ---------- boto3 : R2 클라이언트 ----------
import boto3
s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=ACCESS_KEY_ID,
    aws_secret_access_key=SECRET_ACCESS_KEY,
    region_name="auto",
)

def upload_image(src_path: str, object_name: Optional[str] = None) -> str:
    """
    src_path 의 파일을 R2 버킷에 업로드 후 public URL 반환
    """
    if not object_name:
        object_name = os.path.basename(src_path)

    # boto3 는 로컬 파일이 있어야 하므로, 없는 경우 예외
    if not os.path.exists(src_path):
        raise FileNotFoundError(src_path)

    s3.upload_file(src_path, BUCKET_NAME, object_name)
    return f"{R2_ENDPOINT}/{BUCKET_NAME}/{object_name}"


# ---------- Tkinter 파일 선택 ----------
def choose_local_file(title="이미지 선택") -> Optional[str]:
    try:
        # 루트 창 생성
        root = tk.Tk()
        path = filedialog.askopenfilename(
            title=title,
            filetypes=[("Image Files", "*.png;*.jpg;*.jpeg;*.webp")]
        )
        return path or None
    except Exception as e:
        console.print(f"[red]파일 다이얼로그 오류:[/] {e}")
        return None



# ---------- Rich 콘솔 ----------
console = Console()

# ---------- 헬퍼 ----------
def prompt_list(label: str, default: Optional[List[str]] = None) -> List[str]:
    """
    ';' 로 구분된 문자열을 받아 List[str] 로 반환.
    빈 입력이면 default 를 그대로 유지
    """
    default_str = "; ".join(default) if default else ""
    value = Prompt.ask(f"{label}  (세미콜론 ; 로 여러 개 입력 / Enter=유지)", default=default_str)
    return [x.strip() for x in value.split(";") if x.strip()] if value else (default or [])

def show_object(obj: dict, title="객체"):
    table = Table(title=title, box=box.ROUNDED, title_style="bold green")
    table.add_column("키", style="cyan bold", no_wrap=True)
    table.add_column("값", style="white")

    for k, v in obj.items():
        table.add_row(str(k), json.dumps(v, ensure_ascii=False) if isinstance(v, (list, dict)) else str(v))
    console.print(table)

# ---------- 멤버/뉴스 CRUD ----------
def fetch_members() -> List[dict]:
    try:
        return requests.get(MEMBER_LIST_URL).json()
    except Exception as e:
        console.print(f"[red]멤버 목록 불러오기 실패:[/] {e}")
        return []

def upsert_to_server(url: str, payload: dict):
    res = requests.post(url, json=payload)
    if res.status_code == 200:
        console.print(Panel("✅ 성공적으로 반영되었습니다!", style="bold green"))
        show_object(res.json(), title="서버 응답")
    else:
        console.print(Panel(f"❌ 실패 ({res.status_code})\n{res.text}", style="bold red"))
        sys.exit(1)

def add_or_edit_member(edit: bool = False):
    if edit:
        members = fetch_members()
        if not members:
            console.print("[yellow]편집할 멤버가 없습니다.[/]")
            return
        # 목록 표시
        list_table = Table(title="멤버 목록", box=box.MINIMAL_DOUBLE_HEAD, show_lines=True)
        list_table.add_column("No", justify="right")
        list_table.add_column("이름")
        list_table.add_column("포지션")
        for idx, m in enumerate(members, 1):
            list_table.add_row(str(idx), m["name"], m.get("position", ""))
        console.print(list_table)
        idx = int(Prompt.ask("수정할 멤버 번호", choices=[str(i) for i in range(1, len(members)+1)]))
        data = members[idx-1]
        console.rule(f"[bold cyan]{data['name']} 수정[/]")
    else:
        data = {}

    # ---- 필드 입력 ----
    def ask(key, default=""):
        return Prompt.ask(f"{key}", default=default).strip()

    # 이미지 처리
    if Confirm.ask("프로필 이미지를 새로 선택하시겠습니까?", default=not edit):
        src = choose_local_file()
        if src:
            # 파일명을 이름_확장명으로 변경해 버킷에 저장
            ext = os.path.splitext(src)[1]
            object_name = f"members/{ask('저장될 파일명(공백=자동, 영문/숫자만)', default=data.get('name','').replace(' ', '_') or 'image')}{ext}"
            # R2 에 업로드 후 URL
            image_url = upload_image(src, object_name)
            data["image"] = image_url
    # 기본 필드
    data["name"]        = ask("이름",           default=data.get("name",""))
    data["position"]    = ask("포지션",         default=data.get("position",""))
    data["affiliation"] = ask("소속(affiliation)", default=data.get("affiliation",""))
    data["section"]     = ask("구분(section)", default=data.get("section",""))
    data["email"]       = ask("이메일",        default=data.get("email",""))
    data["학력"]         = prompt_list("학력",  default=data.get("학력", []))
    data["경력"]         = prompt_list("경력",  default=data.get("경력", []))
    data["연구"]         = prompt_list("연구",  default=data.get("연구", []))

    show_object(data, title="보낼 데이터")
    if Confirm.ask("서버에 저장할까요?", default=True):
        upsert_to_server(MEMBER_EDIT_URL, data)

def add_news():
    console.rule("[bold cyan]뉴스 등록[/]")

    # 이미지 선택
    image_url = ""
    if Confirm.ask("썸네일 이미지를 업로드할까요?", default=False):
        src = choose_local_file()
        if src:
            object_name = f"news/{os.path.basename(src)}"
            image_url = upload_image(src, object_name)

    news = {
        "image": image_url,
        "title": Prompt.ask("제목"),
        "content": Prompt.ask("내용"),
        "date": Prompt.ask("날짜 (YYYY.MM 또는 YYYY.MM.DD)"),
        "url": Prompt.ask("원본 기사 URL"),
    }

    show_object(news, title="보낼 뉴스 데이터")
    if Confirm.ask("서버에 저장할까요?", default=True):
        upsert_to_server(NEWS_EDIT_URL, news)

# ---------- 메인 메뉴 ----------
def main():
    while True:
        console.rule("[bold magenta]LAB CONTENT MANAGER[/]")
        console.print("1) 멤버 추가")
        console.print("2) 멤버 수정")
        console.print("3) 뉴스 추가")
        console.print("0) 종료")
        choice = Prompt.ask("선택", choices=["1", "2", "3", "0"])
        if choice == "1":
            add_or_edit_member(edit=False)
        elif choice == "2":
            add_or_edit_member(edit=True)
        elif choice == "3":
            add_news()
        else:
            console.print("안녕히 가세요! 👋")
            break

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[bold yellow]사용자 종료[/]")
