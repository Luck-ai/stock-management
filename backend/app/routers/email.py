from fastapi import APIRouter, Depends, HTTPException
from starlette.concurrency import run_in_threadpool
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Content
import os
import logging
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path
from typing import Optional

TEMPLATES_PATH = Path(__file__).resolve().parents[1] / "templates"
jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_PATH)),
    autoescape=select_autoescape(["html", "xml"]),
)

router = APIRouter(prefix="/email", tags=["email"])


def get_sendgrid_api_key():
    api_key = os.getenv("SENDGRID_API_KEY")
    if not api_key:
        logging.error("SENDGRID_API_KEY environment variable is not set")
        raise HTTPException(status_code=500, detail="SendGrid API key not set")
    return api_key

def send_verification_email_sync(email: str, link: Optional[str] = None, full_name: Optional[str] = None, api_key: Optional[str] = None):

    if api_key is None:
        api_key = get_sendgrid_api_key()

    full_name = full_name or ''
    try:
        tmpl = jinja_env.get_template('verify_email.html')
        html = tmpl.render(full_name=full_name, verify_link=link)
    except Exception:
        html = None
    try:
        tmpl_txt = jinja_env.get_template('verify_email.txt')
        text = tmpl_txt.render(full_name=full_name, verify_link=link)
    except Exception:
        text = f"Please verify your email: {link}" if link else ""

    message = Mail(
        from_email="luckyagarwal645@gmail.com",
        to_emails=email,
        subject="Please verify your email",
    )

    # add plain text then html
    if text:
        message.add_content(Content("text/plain", text))
    if html:
        message.add_content(Content("text/html", html))

    sg = SendGridAPIClient(api_key)
    response = sg.send(message)
    return response

