import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from .config import settings

logger = logging.getLogger(__name__)


def is_email_configured() -> bool:
    """Check if email settings are configured."""
    return bool(
        settings.SMTP_HOST and 
        settings.SMTP_USER and 
        settings.SMTP_PASSWORD and 
        settings.SMTP_FROM_EMAIL
    )


def send_onboarding_email(
    personal_email: str,
    employee_name: str,
    company_email: str,
    password: str
) -> bool:
    """
    Send onboarding email with credentials to new employee.
    
    Args:
        personal_email: Employee's personal email address
        employee_name: Employee's full name
        company_email: Generated company email address
        password: Generated password
        
    Returns:
        True if email sent successfully, False otherwise
    """
    if not is_email_configured():
        logger.warning("Email not configured. Skipping onboarding email.")
        return False
    
    subject = "Welcome to the Company - Your Login Credentials"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .header h1 {{ color: white; margin: 0; }}
            .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
            .credentials {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }}
            .credentials p {{ margin: 10px 0; }}
            .label {{ font-weight: bold; color: #555; }}
            .value {{ font-family: monospace; background: #eef2f7; padding: 5px 10px; border-radius: 4px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #777; font-size: 12px; }}
            .warning {{ color: #e74c3c; font-size: 13px; margin-top: 20px; padding: 15px; background: #fdf2f2; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome Aboard! 🎉</h1>
            </div>
            <div class="content">
                <p>Dear <strong>{employee_name}</strong>,</p>
                
                <p>Welcome to the team! We're excited to have you join us. Below are your login credentials for the HR Management System:</p>
                
                <div class="credentials">
                    <p><span class="label">Company Email:</span> <span class="value">{company_email}</span></p>
                    <p><span class="label">Temporary Password:</span> <span class="value">{password}</span></p>
                </div>
                
                <p>Please use these credentials to log in to the HR system. We recommend changing your password after your first login for security purposes.</p>
                
                <div class="warning">
                    ⚠️ <strong>Important:</strong> Keep your credentials secure and do not share them with anyone. If you suspect your account has been compromised, contact IT immediately.
                </div>
                
                <p>If you have any questions or need assistance, please don't hesitate to reach out to the HR department.</p>
                
                <p>Best regards,<br><strong>HR Team</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated message. Please do not reply directly to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Welcome to the Company!
    
    Dear {employee_name},
    
    Welcome to the team! Below are your login credentials for the HR Management System:
    
    Company Email: {company_email}
    Temporary Password: {password}
    
    Please use these credentials to log in to the HR system. We recommend changing your password after your first login for security purposes.
    
    Important: Keep your credentials secure and do not share them with anyone.
    
    Best regards,
    HR Team
    """
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg['To'] = personal_email
        
        # Attach both plain text and HTML versions
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Connect to SMTP server and send
        if settings.SMTP_USE_TLS:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
        
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, personal_email, msg.as_string())
        server.quit()
        
        logger.info(f"Onboarding email sent successfully to {personal_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP authentication failed: {e}")
        return False
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error sending email: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending email: {e}")
        return False
