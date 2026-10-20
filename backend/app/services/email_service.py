import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional


class EmailService:
    @staticmethod
    def send_email(
        recipient: str,
        subject: str,
        body: str,
        smtp_config: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Sends an email using the workspace SMTP configuration.
        Falls back to log/simulation mode if SMTP settings are unconfigured or incomplete.
        """
        if not smtp_config:
            print(f"[Email Engine Log]: Simulating email send to '{recipient}' with subject '{subject}'")
            return True

        host = smtp_config.get("host")
        port = int(smtp_config.get("port", 587))
        username = smtp_config.get("username")
        password = smtp_config.get("password")
        sender = smtp_config.get("sender_email", username)

        if not host or not username or not password:
            print(f"[Email Engine Log]: Incomplete SMTP config. Simulating send to '{recipient}'.")
            return True

        try:
            msg = MIMEMultipart()
            msg["From"] = sender
            msg["To"] = recipient
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(host, port) as server:
                server.starttls()
                server.login(username, password)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"[Email Engine Error]: Failed to send email to {recipient}: {str(e)}")
            raise e


email_service = EmailService()