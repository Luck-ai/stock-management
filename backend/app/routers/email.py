from fastapi import APIRouter, HTTPException
from starlette.concurrency import run_in_threadpool
import logging
from python_http_client.exceptions import BadRequestsError

logger = logging.getLogger(__name__)
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Content
import os
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/email", tags=["email"])


def fmt_money(val: float) -> str:
    try:
        return f"${val:,.2f}"
    except Exception:
        return "—"


def get_sendgrid_api_key():
    api_key = os.getenv("SENDGRID_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="SendGrid API key not set")
    return api_key

def send_verification_email_sync(email: str, link: Optional[str] = None, full_name: Optional[str] = None, api_key: Optional[str] = None):

    if api_key is None:
        api_key = get_sendgrid_api_key()

    full_name = full_name or ''

    message = Mail(
        from_email="luckyagarwal645@gmail.com",
        to_emails=email,
        subject="Please verify your email",
    )
    # Build inline HTML for verification email (previously used a SendGrid template)
    year = datetime.utcnow().year
    verify_link = link or ''
    html_content = f"""
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Verify your email</title>
                <style>
                    body {{
                        font-family: "Segoe UI", Arial, sans-serif;
                        background: #f4f6fa;
                        color: #333;
                        margin: 0;
                        padding: 0;
                    }}

                    .container {{
                        max-width: 600px;
                        margin: 40px auto;
                        background: #ffffff;
                        padding: 32px 28px;
                        border-radius: 12px;
                        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
                    }}

                    .header {{
                        text-align: center;
                        margin-bottom: 24px;
                    }}

                    .logo {{
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        margin-bottom: 12px;
                    }}

                    h1 {{
                        text-align: center;
                        color: #2d2a4a;
                        font-size: 24px;
                        margin-bottom: 16px;
                    }}

                    p {{
                        font-size: 16px;
                        line-height: 1.6;
                        margin: 12px 0;
                    }}

                    .btn {{
                        display: inline-block;
                        padding: 14px 28px;
                        background: linear-gradient(135deg, #6c63ff, #514982);
                        color: #ffffff !important;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: bold;
                        font-size: 16px;
                        transition: background 0.3s ease;
                    }}

                    .btn:hover {{
                        background: linear-gradient(135deg, #514982, #3a3466);
                    }}

                    .muted {{
                        color: #666;
                        font-size: 14px;
                    }}

                    .footer {{
                        margin-top: 32px;
                        padding-top: 16px;
                        border-top: 1px solid #e5e5e5;
                        font-size: 13px;
                        color: #888;
                        text-align: center;
                    }}

                    a {{
                        color: #514982;
                        word-break: break-all;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- Header with Logo -->
                    <div class="header">
                        <img
                            src="http://cdn.mcauto-images-production.sendgrid.net/f6d1a6adf0560180/afb72e05-dcad-482c-9bf1-5bbb835e144b/132x138.png"
                            alt="OptiStock Logo"
                            width=50
                            height=50
                        />
                        <h2 style="margin: 0; color: #514982;">OptiStock</h2>
                    </div>

                    <h1>Confirm your email</h1>
                    <p class="muted">Hi {full_name},</p>
                    <p>
                        Thanks for signing up! Please confirm your email address to finish
                        setting up your account and get started.
                    </p>

                    <p style="text-align: center; margin: 28px 0;">
                        <a class="btn" href="{link}">Verify Email</a>
                    </p>

                    <p class="muted">
                        If the button above doesn’t work, copy and paste this link into your
                        browser:
                    </p>
                    <p><a href="{link}">{link}</a></p>

                    <div class="footer">
                        <p>
                            If you didn’t create this account, you can safely ignore this email.
                        </p>
                        <p>© {year} OptiStock. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """

    # Add HTML content to the message. Use add_content when available, else fallback.
    try:
        message.add_content(Content("text/html", html_content))
    except Exception:
        message.html_content = html_content

    sg = SendGridAPIClient(api_key)
    # Log the outgoing payload (safe to log - contains no secret API key)
    try:
        payload = message.get()
    except Exception:
        payload = None
    logger.debug('Sending SendGrid message payload: %s', payload)

    try:
        response = sg.send(message)
        logger.debug('SendGrid response status: %s', getattr(response, 'status_code', 'unknown'))
        return response
    except BadRequestsError as e:
        # python_http_client BadRequestsError contains a .body and .status_code
        logger.error('SendGrid BadRequest (400) - status: %s body: %s', getattr(e, 'status_code', None), getattr(e, 'body', None))
        return None
    except Exception as e:
        body = getattr(e, 'body', None)
        if body:
            logger.exception('SendGrid returned an error: %s', body)
        else:
            logger.exception('SendGrid send failed: %s', e)
        return None


def build_order_summary_html(full_name: str, order: object, frontend_base: str = None) -> str:

    try:
        order_id = getattr(order, 'id', '')
        # Prefer related fields when available, but fall back to IDs
        product = getattr(order, 'product', None)
        product_name = getattr(product, 'name', None) if product is not None else None
        product_cat = None
        if product is not None:
            category = getattr(product, 'category', None)
            product_cat = getattr(category, 'name', None) if category is not None else None

        product_id = getattr(order, 'product_id', '')
        supplier = getattr(order, 'supplier', None)
        supplier_name = getattr(supplier, 'name', None) if supplier is not None else None
        supplier_id = getattr(order, 'supplier_id', '')
        quantity = getattr(order, 'quantity_ordered', '')
        order_date = getattr(order, 'order_date', '')
    except Exception:
        order_id = ''
        product_name = None
        product_cat = None
        product_id = ''
        supplier_name = None
        supplier_id = ''
        quantity = ''
        order_date = ''

    frontend_base = frontend_base or os.getenv('FRONTEND_BASE', 'http://localhost:3000')
    order_link = f"{frontend_base}/dashboard/restock"

    # Compute price and subtotal (product.price stored as integer, assume cents)
    try:
        product_obj = getattr(order, 'product', None)
        price_cents = getattr(product_obj, 'price', None) if product_obj is not None else None
        if price_cents is None:
            # fallback: product price might not be loaded; attempt to read price attribute on order if present
            price_cents = getattr(order, 'product_price', None)
        if price_cents is None:
            price_cents = 0
        price_dollars = price_cents / 100.0
    except Exception:
        price_dollars = 0.0

    try:
        subtotal = (float(quantity) * price_dollars) if quantity not in (None, '') else 0.0
    except Exception:
        subtotal = 0.0

    # fmt_money is a module-level helper

    html = f"""
    <!doctype html>
    <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Order Summary</title>
            <style>
                body {{ font-family: "Segoe UI", Arial, sans-serif; background: #f4f6fa; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; padding: 32px 28px; border-radius: 12px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08); }}
                .header {{ text-align: center; margin-bottom: 24px; }}
                .logo {{ width: 60px; height: 60px; border-radius: 50%; margin-bottom: 12px; }}
                h1 {{ text-align: center; color: #2d2a4a; font-size: 24px; margin-bottom: 16px; }}
                p {{ font-size: 16px; line-height: 1.6; margin: 12px 0; }}
                .btn {{ display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #6c63ff, #514982); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background 0.3s ease; }}
                .muted {{ color: #666; font-size: 14px; }}
                .footer {{ margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 13px; color: #888; text-align: center; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
                th, td {{ padding: 8px 6px; border-bottom: 1px solid #eee; text-align: left; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="http://cdn.mcauto-images-production.sendgrid.net/f6d1a6adf0560180/afb72e05-dcad-482c-9bf1-5bbb835e144b/132x138.png" alt="OptiStock Logo" width=50 height=50 />
                    <h2 style="margin: 0; color: #514982;">OptiStock</h2>
                </div>

                <h1>Order Summary</h1>
                <p class="muted">Hi {full_name or ''},</p>
                <p>Thanks — your purchase order has been created. Below are the details for order <strong>#{order_id}</strong>.</p>

                    <table>
                        <tr><th>Product</th><td>{product_name if product_name else f'ID: {product_id}'}</td></tr>
                        <tr><th>Category</th><td>{product_cat if product_cat else '—'}</td></tr>
                        <tr><th>Quantity</th><td>{quantity}</td></tr>
                        <tr><th>Unit Price</th><td>{fmt_money(price_dollars) if price_dollars else '—'}</td></tr>
                        <tr><th>Subtotal</th><td>{fmt_money(subtotal) if subtotal else '—'}</td></tr>
                        <tr><th>Supplier</th><td>{supplier_name if supplier_name else f'ID: {supplier_id}'}</td></tr>
                        <tr><th>Order Date</th><td>{order_date}</td></tr>
                    </table>

                <p style="text-align: center; margin: 28px 0;"><a class="btn" href="{order_link}">View Order</a></p>

                <div class="footer">
                    <p>If you didn’t create this order, please contact your account administrator.</p>
                    <p>© {2025} OptiStock. All rights reserved.</p>
                </div>
            </div>
        </body>
    </html>
    """
    return html


def send_order_summary_sync(email: str, order: object, full_name: Optional[str] = None, api_key: Optional[str] = None):
    """Send an order summary email using SendGrid synchronously.

    `order` can be an ORM object with attributes (product, supplier, quantity_ordered, id, order_date)
    """
    if api_key is None:
        api_key = get_sendgrid_api_key()

    full_name = full_name or ''
    frontend_base = os.getenv('FRONTEND_BASE', 'http://localhost:3000')
    html_content = build_order_summary_html(full_name, order, frontend_base)

    message = Mail(
        from_email="luckyagarwal645@gmail.com",
        to_emails=email,
        subject=f"Order Summary - Order #{getattr(order, 'id', '')}",
    )
    # Ensure SendGrid receives a content block (html). Some SDK versions
    # require an explicit Content() to be present when not using templates.
    if html_content:
        try:
            message.add_content(Content("text/html", html_content))
        except Exception:
            # Fallback for different SDK versions
            message.html_content = html_content

    sg = SendGridAPIClient(api_key)
    try:
        payload = message.get()
    except Exception:
        payload = None
    logger.debug('Sending SendGrid order message payload: %s', payload)

    try:
        response = sg.send(message)
        logger.debug('SendGrid response status: %s', getattr(response, 'status_code', 'unknown'))
        return response
    except BadRequestsError as e:
        logger.error('SendGrid BadRequest (order) - status: %s body: %s', getattr(e, 'status_code', None), getattr(e, 'body', None))
        return None
    except Exception as e:
        body = getattr(e, 'body', None)
        if body:
            logger.exception('SendGrid returned an error (order): %s', body)
        else:
            logger.exception('SendGrid order send failed: %s', e)
        return None


async def send_order_summary(email: str, order: object, full_name: Optional[str] = None, api_key: Optional[str] = None):
    # Run the blocking SendGrid call in a threadpool to avoid blocking the event loop
    try:
        return await run_in_threadpool(send_order_summary_sync, email, order, full_name, api_key)
    except Exception as e:
        logger.exception('Unexpected error while sending order summary: %s', e)
        return None


def build_batch_order_summary_html(full_name: str, orders: list, frontend_base: str = None) -> str:
    """Build an HTML summary for multiple orders."""
    try:
        frontend_base = frontend_base or os.getenv('FRONTEND_BASE', 'http://localhost:3000')
        order_link = f"{frontend_base}/dashboard/restock"


        rows_html = []
        grand_total = 0.0
        for o in orders:
            order_id = getattr(o, 'id', '')
            pid = getattr(o, 'product_id', '')
            sid = getattr(o, 'supplier_id', '')
            qty = getattr(o, 'quantity_ordered', '')

            product = getattr(o, 'product', None)
            product_name = getattr(product, 'name', None) if product is not None else None
            product_cat = None
            if product is not None:
                category = getattr(product, 'category', None)
                product_cat = getattr(category, 'name', None) if category is not None else None

            supplier = getattr(o, 'supplier', None)
            supplier_name = getattr(supplier, 'name', None) if supplier is not None else None

            # Determine unit price (product.price in cents)
            try:
                price_cents = getattr(product, 'price', None) if product is not None else None
                if price_cents is None:
                    price_cents = getattr(o, 'product_price', None)
                if price_cents is None:
                    price_cents = 0
                price = float(price_cents) / 100.0
            except Exception:
                price = 0.0

            try:
                line_subtotal = (float(qty) * price) if qty not in (None, '') else 0.0
            except Exception:
                line_subtotal = 0.0

            grand_total += line_subtotal

            prod_display = product_name if product_name else f'ID: {pid}'
            supp_display = supplier_name if supplier_name else f'ID: {sid}'

            rows_html.append(f"<tr><td>{order_id}</td><td>{prod_display}</td><td>{product_cat if product_cat else '—'}</td><td>{qty}</td><td>{supp_display}</td><td>{fmt_money(line_subtotal) if line_subtotal else '—'}</td></tr>")

        rows_joined = '\n'.join(rows_html)

        html = f"""
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Order Summary</title>
                <style>
                    body {{ font-family: "Segoe UI", Arial, sans-serif; background: #f4f6fa; color: #333; margin: 0; padding: 0; }}
                    .container {{ max-width: 700px; margin: 40px auto; background: #ffffff; padding: 32px 28px; border-radius: 12px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08); }}
                    .header {{ text-align: center; margin-bottom: 24px; }}
                    h1 {{ text-align: center; color: #2d2a4a; font-size: 24px; margin-bottom: 16px; }}
                    .muted {{ color: #666; font-size: 14px; }}
                    .footer {{ margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 13px; color: #888; text-align: center; }}
                    table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
                    th, td {{ padding: 8px 6px; border-bottom: 1px solid #eee; text-align: left; }}
                    th {{ background: #fafafa; text-align: left; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="http://cdn.mcauto-images-production.sendgrid.net/f6d1a6adf0560180/afb72e05-dcad-482c-9bf1-5bbb835e144b/132x138.png" alt="OptiStock Logo" width=50 height=50 />
                        <h2 style="margin: 0; color: #514982;">OptiStock</h2>
                    </div>

                    <h1>Order Summary</h1>
                    <p class="muted">Hi {full_name or ''},</p>
                    <p>Thanks — your purchase order has been created. Below are the details for your orders.</p>

                    <table>
                        <thead><tr><th>Order</th><th>Product</th><th>Category</th><th>Quantity</th><th>Supplier</th><th>Subtotal</th></tr></thead>
                        <tbody>
                        {rows_joined}
                        </tbody>
                        <tfoot>
                            <tr><th colspan="5">Grand Total</th><th>{fmt_money(grand_total) if grand_total else '—'}</th></tr>
                        </tfoot>
                    </table>

                    <p style="text-align: center; margin: 28px 0;"><a class="btn" href="{order_link}">View Orders</a></p>

                    <div class="footer">
                        <p>If you didn’t create these orders, please contact your account administrator.</p>
                        <p>© {2025} OptiStock. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        return html
    except Exception:
        return ""


def send_batch_order_summary_sync(email: str, orders: list, full_name: Optional[str] = None, api_key: Optional[str] = None):
    if api_key is None:
        api_key = get_sendgrid_api_key()

    frontend_base = os.getenv('FRONTEND_BASE', 'http://localhost:3000')
    html_content = build_batch_order_summary_html(full_name, orders, frontend_base)

    message = Mail(
        from_email="luckyagarwal645@gmail.com",
        to_emails=email,
        subject=f"Order Summary - {len(orders)} items",
    )
    if html_content:
        try:
            message.add_content(Content("text/html", html_content))
        except Exception:
            message.html_content = html_content

    sg = SendGridAPIClient(api_key)
    try:
        payload = message.get()
    except Exception:
        payload = None
    logger.debug('Sending SendGrid batch message payload: %s', payload)

    try:
        response = sg.send(message)
        logger.debug('SendGrid batch response status: %s', getattr(response, 'status_code', 'unknown'))
        return response
    except BadRequestsError as e:
        logger.error('SendGrid BadRequest (batch) - status: %s body: %s', getattr(e, 'status_code', None), getattr(e, 'body', None))
        return None
    except Exception as e:
        body = getattr(e, 'body', None)
        if body:
            logger.exception('SendGrid returned an error (batch): %s', body)
        else:
            logger.exception('SendGrid batch send failed: %s', e)
        return None


async def send_batch_order_summary(email: str, orders: list, full_name: Optional[str] = None, api_key: Optional[str] = None):
    try:
        return await run_in_threadpool(send_batch_order_summary_sync, email, orders, full_name, api_key)
    except Exception as e:
        logger.exception('Unexpected error while sending batch order summary: %s', e)
        return None

