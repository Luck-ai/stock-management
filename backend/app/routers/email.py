from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import models, schemas
from ..database import get_db
from sqlalchemy import select
from ..security import get_current_user
from .. import models
from sendgrid import SendGridAPIClient
import os
from sendgrid.helpers.mail import Mail

router = APIRouter(prefix="/email", tags=["email"])
apikey = os.getenv("SENDGRID_API_KEY")

@router.post("/email")
async def send_mail(email: str):

    message = Mail(
        from_email="luckyagarwal645@gmail.com",
        to_emails=email,
        subject=f"Order Confirmation #{12345}"  # subject can also come from the template
    )

    message.template_id = "d-a76b73a03d3b46fb9907347b1a0f48b4"
    try:
        sg = SendGridAPIClient(apikey)  # put your SendGrid API key here
        response = sg.send(message)
        return {
            "status": "success",
            "email_status": response.status_code
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
