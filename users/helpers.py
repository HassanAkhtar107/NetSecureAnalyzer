from datetime import datetime
import base64
import pyotp
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import F
from .models import User
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def generateRandom(email):
    return str(email) + str(datetime.date(datetime.now()))


def sendOtpEmail(user):
    keygen = generateRandom(user.email)
    key = base64.b32encode(keygen.encode())
    OTP = pyotp.HOTP(key, digits=4)
    otp = OTP.at(user.otp_counter)
    subject = "OTP verification"
    text = f"Your Verification OTP is {otp}"
    html = f"""
      <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5">
        <p>Your Verification OTP is <strong style="letter-spacing:2px">{otp}</strong></p>
        <p>This code is valid for one use. If you didn’t request it, you can ignore this email.</p>
      </div>
    """
    
    message = Mail(
        from_email=settings.DEFAULT_FROM_EMAIL,
        to_emails=user.email,
        subject=subject,
        plain_text_content=text,
        html_content=html,
    )
    try:
        sg = SendGridAPIClient(settings.EMAIL_HOST_PASSWORD)
        resp = sg.send(message)
        # 2xx is success
        if 200 <= resp.status_code < 300:
            # increment counter only after successful send
            User.objects.filter(pk=user.pk).update(otp_counter=F("otp_counter") + 1)
            return True
        else:
            print("resp",resp)
            return False
    except Exception as e:
        print("e",e)
        return False


def verifyOtp(user, otp):
    keygen = generateRandom(user.email)
    key = base64.b32encode(keygen.encode())
    OTP = pyotp.HOTP(key, digits=4)
    if OTP.verify(otp, user.otp_counter - 1):
        user = User.objects.filter(email=user.email).update(is_verified=True)
        return True
    return False
